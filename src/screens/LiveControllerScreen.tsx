import { useState, useEffect, useRef, useCallback } from 'react';
import { Show, LineupEntry } from '../types';
import * as storage from '../storage';
import { getAudioBlobURL } from '../audioStorage';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import './LiveControllerScreen.css';

function LiveControllerScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [fadeOutDuration, setFadeOutDuration] = useState(2);
  const [showScheduleOverlay, setShowScheduleOverlay] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioLabel, setAudioLabel] = useState<string>('');
  const [walkOffLabel, setWalkOffLabel] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const walkOffAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeOutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobURLsRef = useRef<string[]>([]);
  const preMuteVolumeRef = useRef(0.8);

  // Load settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setVolume(settings.audioVolume || 0.8);
        setFadeOutDuration(settings.fadeOutDuration || 2);
      } catch {
        /* corrupted settings — use defaults */
      }
    }
  }, []);

  // Compute start time (in minutes) at a given lineup index
  const getStartTime = useCallback((lineup: LineupEntry[], index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) t += lineup[i].duration;
    return t;
  }, []);

  const getTotalDuration = useCallback((lineup: LineupEntry[]) => {
    return lineup.reduce((sum, e) => sum + e.duration, 0);
  }, []);

  // Play audio from IndexedDB by ID
  const playAudioFromDB = async (audioId: string, vol: number): Promise<HTMLAudioElement | null> => {
    try {
      const url = await getAudioBlobURL(audioId);
      if (!url) return null;
      blobURLsRef.current.push(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : vol;
      audio.addEventListener('play', () => setIsAudioPlaying(true));
      audio.addEventListener('pause', () => {
        if (audio.currentTime >= audio.duration) setIsAudioPlaying(false);
      });
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      await audio.play();
      return audio;
    } catch {
      return null;
    }
  };

  // Preload audio from IndexedDB by ID
  const preloadAudioFromDB = async (audioId: string, vol: number): Promise<HTMLAudioElement | null> => {
    try {
      const url = await getAudioBlobURL(audioId);
      if (!url) return null;
      blobURLsRef.current.push(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : vol;
      audio.addEventListener('play', () => setIsAudioPlaying(true));
      audio.addEventListener('pause', () => {
        if (audio.currentTime >= audio.duration) setIsAudioPlaying(false);
      });
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      audio.load();
      return audio;
    } catch {
      return null;
    }
  };

  // Fade out audio over specified duration (in seconds)
  const fadeOutAudio = (audio: HTMLAudioElement, duration: number = 2) => {
    if (!audio) return;
    const startVolume = audio.volume;
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    if (fadeOutRef.current) clearInterval(fadeOutRef.current);
    fadeOutRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= endTime) {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeOutRef.current!);
      } else {
        const progress = (now - startTime) / (duration * 1000);
        audio.volume = startVolume * (1 - progress);
      }
    }, 50);
  };

  const handleNextPerformer = useCallback(() => {
    if (!currentShow || currentIndex >= currentShow.lineup.length - 1) return;

    const currentEntry = currentShow.lineup[currentIndex];
    const nextIdx = currentIndex + 1;
    const nextEntry = currentShow.lineup[nextIdx];

    // Fade out current walk-on audio
    if (audioRef.current) {
      fadeOutAudio(audioRef.current, fadeOutDuration);
    }

    // Play walk-off audio for the departing performer
    if (currentEntry.walkOffAudioId) {
      setWalkOffLabel(currentEntry.walkOffAudioName || 'Walk-Off');
      playAudioFromDB(currentEntry.walkOffAudioId, volume).then(audio => {
        if (audio) {
          walkOffAudioRef.current = audio;
          audio.addEventListener('ended', () => setWalkOffLabel(''));
          setTimeout(() => {
            if (walkOffAudioRef.current) {
              fadeOutAudio(walkOffAudioRef.current, fadeOutDuration);
              setWalkOffLabel('');
            }
          }, 15000);
        }
      });
    } else {
      setWalkOffLabel('');
    }

    // Move to next performer
    setCurrentIndex(nextIdx);
    const nextStart = getStartTime(currentShow.lineup, nextIdx);
    setElapsedSeconds(nextStart * 60);

    // Play walk-on audio for the incoming performer
    if (nextEntry.walkOnAudioId && isRunning) {
      setAudioLabel(nextEntry.walkOnAudioName || 'Walk-On');
      playAudioFromDB(nextEntry.walkOnAudioId, volume).then(audio => {
        if (audio) audioRef.current = audio;
      });
    } else if (nextAudioRef.current) {
      audioRef.current = nextAudioRef.current;
      nextAudioRef.current = null;
      if (isRunning) audioRef.current.play();
    }
  }, [currentShow, currentIndex, isRunning, fadeOutDuration, volume, getStartTime]);

  useEffect(() => {
    loadShows();
  }, []);

  // Broadcast live state for the web admin shell to relay to the public viewer.
  // Recompute only when the performer or run-state changes — using elapsedSeconds
  // here would slide timerEndsAt every tick and defeat the admin-shell dedupe.
  const elapsedRef = useRef(elapsedSeconds);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);

  useEffect(() => {
    const current = currentShow?.lineup[currentIndex]?.name || '';
    const nextUp: string[] = [];
    if (currentShow) {
      for (let i = currentIndex + 1; i < currentShow.lineup.length; i++) {
        nextUp.push(currentShow.lineup[i].name);
      }
    }
    const entry = currentShow?.lineup[currentIndex];
    let timerEndsAt: number | null = null;
    if (entry && isRunning) {
      const entryStart = currentShow ? (() => { let t = 0; for (let i = 0; i < currentIndex; i++) t += currentShow.lineup[i].duration; return t; })() : 0;
      const entryDuration = entry.duration * 60;
      const remaining = Math.max(0, (entryStart * 60 + entryDuration) - elapsedRef.current);
      timerEndsAt = Date.now() + remaining * 1000;
    }
    window.dispatchEvent(new CustomEvent('pn:live-state', {
      detail: { current, nextUp, timerEndsAt },
    }));
  }, [currentShow, currentIndex, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) fadeOutAudio(audioRef.current, 0.5);
      if (walkOffAudioRef.current) { walkOffAudioRef.current.pause(); walkOffAudioRef.current = null; }
      if (nextAudioRef.current) { nextAudioRef.current.pause(); nextAudioRef.current = null; }
      if (fadeOutRef.current) clearInterval(fadeOutRef.current);
      blobURLsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobURLsRef.current = [];
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1;
          if (currentShow && currentIndex < currentShow.lineup.length) {
            const entry = currentShow.lineup[currentIndex];
            const entryStart = getStartTime(currentShow.lineup, currentIndex) * 60;
            const entryElapsed = newValue - entryStart;

            // 30-second warning vibration
            if (entryElapsed === (entry.duration * 60) - 30) {
              navigator.vibrate?.(200);
            }
            // Auto-advance
            if (entryElapsed >= entry.duration * 60) {
              handleNextPerformer();
            }
          }
          return newValue;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, currentIndex, currentShow, handleNextPerformer, getStartTime]);

  // Preload next performer's walk-on audio
  useEffect(() => {
    if (currentShow && currentIndex < currentShow.lineup.length - 1) {
      const nextEntry = currentShow.lineup[currentIndex + 1];
      if (nextEntry.walkOnAudioId) {
        // Clean up previous preloaded audio before loading new one
        if (nextAudioRef.current) {
          nextAudioRef.current.pause();
          nextAudioRef.current = null;
        }
        preloadAudioFromDB(nextEntry.walkOnAudioId, volume).then(audio => {
          if (audio) nextAudioRef.current = audio;
        });
      }
    }
  }, [currentIndex, currentShow, volume]);

  const loadShows = () => setShows(storage.getShows());

  const handleLoadShow = (showId: number) => {
    const show = storage.getShow(showId);
    if (show) {
      setCurrentShow(show);
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setIsRunning(false);
      setShowLoadModal(false);
      // Preload first performer's walk-on audio
      const first = show.lineup[0];
      if (first?.walkOnAudioId) {
        preloadAudioFromDB(first.walkOnAudioId, volume).then(audio => {
          if (audio) audioRef.current = audio;
        });
      }
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    const entry = currentShow?.lineup[currentIndex];
    if (entry?.walkOnAudioId && audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {});
    } else if (entry?.walkOnAudioId && !audioRef.current) {
      playAudioFromDB(entry.walkOnAudioId, volume).then(audio => {
        if (audio) audioRef.current = audio;
      });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (audioRef.current) fadeOutAudio(audioRef.current, fadeOutDuration);
  };

  const handleJumpToPerformer = (index: number) => {
    if (!currentShow) return;
    // Stop and clean up all current audio
    if (audioRef.current) { fadeOutAudio(audioRef.current, fadeOutDuration); audioRef.current = null; }
    if (walkOffAudioRef.current) { fadeOutAudio(walkOffAudioRef.current, fadeOutDuration); walkOffAudioRef.current = null; }
    if (nextAudioRef.current) { nextAudioRef.current.pause(); nextAudioRef.current = null; }
    setIsAudioPlaying(false);
    setAudioLabel('');
    setWalkOffLabel('');

    setCurrentIndex(index);
    setElapsedSeconds(getStartTime(currentShow.lineup, index) * 60);

    const entry = currentShow.lineup[index];
    if (entry.walkOnAudioId) {
      preloadAudioFromDB(entry.walkOnAudioId, volume).then(audio => {
        if (audio) {
          audioRef.current = audio;
          if (isRunning) audio.play();
        }
      });
    }
    setShowScheduleOverlay(false);
  };

  const handleAdjustTime = (minutes: number) => {
    setElapsedSeconds(prev => Math.max(0, prev + (minutes * 60)));
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isMuted) setIsMuted(false);
    if (audioRef.current) audioRef.current.volume = newVolume;
    if (walkOffAudioRef.current) walkOffAudioRef.current.volume = newVolume;
  };

  const handleRestartTrack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isRunning) audioRef.current.play();
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      const restored = preMuteVolumeRef.current;
      setIsMuted(false);
      setVolume(restored);
      if (audioRef.current) audioRef.current.volume = restored;
      if (walkOffAudioRef.current) walkOffAudioRef.current.volume = restored;
    } else {
      preMuteVolumeRef.current = volume;
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
      if (walkOffAudioRef.current) walkOffAudioRef.current.volume = 0;
    }
  };

  const handlePlayPauseAudio = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play();
      setIsAudioPlaying(true);
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleStopAllAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (walkOffAudioRef.current) { walkOffAudioRef.current.pause(); walkOffAudioRef.current.currentTime = 0; walkOffAudioRef.current = null; }
    if (fadeOutRef.current) clearInterval(fadeOutRef.current);
    setIsAudioPlaying(false);
    setAudioLabel('');
    setWalkOffLabel('');
  };

  const handlePlayWalkOn = () => {
    const entry = getCurrentEntry();
    if (!entry?.walkOnAudioId) return;
    if (audioRef.current && !audioRef.current.paused) fadeOutAudio(audioRef.current, 0.5);
    setAudioLabel(entry.walkOnAudioName || 'Walk-On');
    playAudioFromDB(entry.walkOnAudioId, volume).then(audio => {
      if (audio) audioRef.current = audio;
    });
  };

  const handlePlayWalkOff = () => {
    const entry = getCurrentEntry();
    if (!entry?.walkOffAudioId) return;
    if (walkOffAudioRef.current && !walkOffAudioRef.current.paused) fadeOutAudio(walkOffAudioRef.current, 0.5);
    setWalkOffLabel(entry.walkOffAudioName || 'Walk-Off');
    playAudioFromDB(entry.walkOffAudioId, volume).then(audio => {
      if (audio) {
        walkOffAudioRef.current = audio;
        audio.addEventListener('ended', () => setWalkOffLabel(''));
      }
    });
  };

  const handleEmergencyStop = () => setShowEmergencyConfirm(true);

  const confirmEmergencyStop = () => {
    setIsRunning(false);
    if (audioRef.current) fadeOutAudio(audioRef.current, 0.5);
    if (walkOffAudioRef.current) fadeOutAudio(walkOffAudioRef.current, 0.5);
    setShowEmergencyConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinutesSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCurrentEntry = (): LineupEntry | null => {
    if (!currentShow || currentIndex >= currentShow.lineup.length) return null;
    return currentShow.lineup[currentIndex];
  };

  const getNextEntry = (): LineupEntry | null => {
    if (!currentShow || currentIndex >= currentShow.lineup.length - 1) return null;
    return currentShow.lineup[currentIndex + 1];
  };

  const getTimeRemaining = () => {
    const entry = getCurrentEntry();
    if (!entry || !currentShow) return 0;
    const entryStart = getStartTime(currentShow.lineup, currentIndex) * 60;
    const entryDuration = entry.duration * 60;
    const entryElapsed = elapsedSeconds - entryStart;
    return Math.max(0, entryDuration - entryElapsed);
  };

  const getScheduleDelta = () => {
    if (!currentShow) return 0;
    const plannedTime = getStartTime(currentShow.lineup, currentIndex) * 60;
    return elapsedSeconds - plannedTime;
  };

  if (!currentShow) {
    return (
      <div className="live-controller-screen">
        <div className="no-show">
          <div className="no-show-icon" aria-hidden="true">&#9654;</div>
          <h2>Ready to Run a Show</h2>
          <p>Load a saved show from the Builder to get started.</p>
          <button className="btn-primary btn-large" onClick={() => setShowLoadModal(true)}>
            Load Show
          </button>
          <div className="no-show-steps">
            <p className="step"><strong>Step 1:</strong> Go to <strong>Library</strong> and add your performers</p>
            <p className="step"><strong>Step 2:</strong> Go to <strong>Builder</strong> to create &amp; save a show</p>
            <p className="step"><strong>Step 3:</strong> Come back here and tap <strong>Load Show</strong></p>
          </div>
        </div>

        {showLoadModal && (
          <LoadShowModal
            shows={shows}
            onLoad={handleLoadShow}
            onClose={() => setShowLoadModal(false)}
          />
        )}
      </div>
    );
  }

  const currentEntry = getCurrentEntry();
  const nextEntry = getNextEntry();
  const timeRemaining = getTimeRemaining();
  const delta = getScheduleDelta();
  const totalDuration = getTotalDuration(currentShow.lineup);
  const currentStart = getStartTime(currentShow.lineup, currentIndex);

  return (
    <div className="live-controller-screen">
      <div className="controller-top">
        <div className="timer-display">
          <div className="countdown-timer">{formatMinutesSeconds(timeRemaining)}</div>
          <div className="elapsed-time">Show Time: {formatTime(elapsedSeconds)}</div>
        </div>

        {currentEntry && (
          <div className="performer-info">
            <div className="performer-name">
              {formatMinutesSeconds(currentStart * 60)}–{formatMinutesSeconds((currentStart + currentEntry.duration) * 60)} | {currentEntry.name}
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  '--progress-width': `${totalDuration > 0 ? (elapsedSeconds / (totalDuration * 60)) * 100 : 0}%`
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}
      </div>

      <div className="controller-middle">
        {currentEntry && (
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Allocated Time</div>
              <div className="status-value">{currentEntry.duration} min</div>
            </div>
            <div className="status-item">
              <div className="status-label">Time Remaining</div>
              <div className="status-value">{formatMinutesSeconds(timeRemaining)}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Schedule Status</div>
              <div className={`status-value ${delta > 0 ? 'behind' : delta < 0 ? 'ahead' : 'on-time'}`}>
                {delta === 0 ? 'On Time' : `${delta > 0 ? '+' : ''}${formatMinutesSeconds(Math.abs(delta))}`}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Position</div>
              <div className="status-value">
                {currentIndex + 1} of {currentShow.lineup.length}
              </div>
            </div>
            {nextEntry && (
              <div className="status-item full-width">
                <div className="status-label">Next Up</div>
                <div className="status-value">{nextEntry.name} ({nextEntry.duration} min)</div>
              </div>
            )}
            {currentEntry.walkOnAudioName && (
              <div className="status-item full-width">
                <div className="status-label">Walk-On Music</div>
                <div className="status-value audio-path">{currentEntry.walkOnAudioName}</div>
              </div>
            )}
            {currentEntry.walkOffAudioName && (
              <div className="status-item full-width">
                <div className="status-label">Walk-Off Music</div>
                <div className="status-value audio-path">{currentEntry.walkOffAudioName}</div>
              </div>
            )}
            {currentEntry.notes && (
              <div className="status-item full-width notes-section">
                <div className="status-label">Notes</div>
                <div className="status-value notes-content">{currentEntry.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="controller-bottom">
        <div className="control-section">
          <h3>Timer Controls</h3>
          <div className="control-buttons">
            {!isRunning ? (
              <button className="btn-success btn-large" onClick={handleStart}>Start</button>
            ) : (
              <button className="btn-secondary btn-large" onClick={handlePause}>Pause</button>
            )}
            <button className="btn-secondary" onClick={() => handleAdjustTime(2)}>+2 Min</button>
            <button className="btn-secondary" onClick={() => handleAdjustTime(-2)}>−2 Min</button>
            <button className="btn-primary" onClick={handleNextPerformer}>Next</button>
          </div>
        </div>

        <div className="control-section">
          <h3>Audio Controls</h3>
          {(audioLabel || walkOffLabel) && (
            <div className="audio-now-playing">
              {audioLabel && <span className="now-playing-label">&#9835; {audioLabel}</span>}
              {walkOffLabel && <span className="now-playing-label walk-off-playing">&#9835; {walkOffLabel}</span>}
            </div>
          )}
          <div className="control-buttons">
            <button
              className={`btn-secondary${isAudioPlaying ? ' btn-active' : ''}`}
              onClick={handlePlayPauseAudio}
              disabled={!audioRef.current}
            >
              {isAudioPlaying ? 'Pause' : 'Play'}
            </button>
            <button className="btn-secondary" onClick={handleStopAllAudio}>Stop Audio</button>
            <button className="btn-secondary" onClick={handleRestartTrack}>Restart</button>
            <button className={`btn-mute${isMuted ? ' muted' : ''}`} onClick={handleToggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <div className="control-buttons">
            <button className="btn-secondary btn-walk-on" onClick={handlePlayWalkOn} disabled={!getCurrentEntry()?.walkOnAudioId}>Walk-On</button>
            <button className="btn-secondary btn-walk-off" onClick={handlePlayWalkOff} disabled={!getCurrentEntry()?.walkOffAudioId}>Walk-Off</button>
            <div className="volume-control">
              <label>Vol:</label>
              <input type="range" min="0" max="1" step="0.05" title="Volume" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} />
              <span>{isMuted ? '0%' : Math.round(volume * 100) + '%'}</span>
            </div>
          </div>
        </div>

        <div className="control-section full-width">
          <div className="control-buttons">
            <button className="btn-danger btn-large" onClick={handleEmergencyStop}>Stop</button>
            <button className="btn-primary" onClick={() => setShowScheduleOverlay(true)}>Lineup</button>
            <button className="btn-secondary" onClick={() => setShowLoadModal(true)}>Switch Show</button>
          </div>
        </div>
      </div>

      {showScheduleOverlay && (
        <ScheduleOverlay
          show={currentShow}
          currentIndex={currentIndex}
          onJumpTo={handleJumpToPerformer}
          onClose={() => setShowScheduleOverlay(false)}
        />
      )}

      {showLoadModal && (
        <LoadShowModal
          shows={shows}
          onLoad={handleLoadShow}
          onClose={() => setShowLoadModal(false)}
        />
      )}

      {showEmergencyConfirm && (
        <ConfirmDialog
          title="Emergency Stop?"
          message="This will immediately stop the timer and fade out all audio. Are you sure?"
          confirmLabel="Stop Everything"
          danger
          onConfirm={confirmEmergencyStop}
          onCancel={() => setShowEmergencyConfirm(false)}
        />
      )}
    </div>
  );
}

interface ScheduleOverlayProps {
  show: Show;
  currentIndex: number;
  onJumpTo: (index: number) => void;
  onClose: () => void;
}

function ScheduleOverlay({ show, currentIndex, onJumpTo, onClose }: ScheduleOverlayProps) {
  const getStartTime = (index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) t += show.lineup[i].duration;
    return t;
  };
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <Modal title={`Lineup \u2014 ${show.name}`} onClose={onClose} wide>
      <div className="schedule-list">
        {show.lineup.map((entry, index) => {
          const start = getStartTime(index);
          return (
            <div
              key={index}
              className={`schedule-item ${index === currentIndex ? 'current' : ''}`}
              onClick={() => onJumpTo(index)}
            >
              <div className="schedule-time">{formatTime(start)}\u2013{formatTime(start + entry.duration)}</div>
              <div className="schedule-name">{entry.name}</div>
              <div className="schedule-duration">{entry.duration} min</div>
            </div>
          );
        })}
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

interface LoadShowModalProps {
  shows: Show[];
  onLoad: (id: number) => void;
  onClose: () => void;
}

function LoadShowModal({ shows, onLoad, onClose }: LoadShowModalProps) {
  const getTotalDuration = (lineup: LineupEntry[]) => lineup.reduce((sum, e) => sum + e.duration, 0);

  return (
    <Modal title="Load Show" onClose={onClose}>
      {shows.length === 0 ? (
        <div className="no-shows-message">
          <p>No saved shows yet.</p>
          <p>Go to <strong>Builder</strong> to create and save a show first.</p>
        </div>
      ) : (
        <div className="shows-list">
          {shows.map(show => {
            const total = getTotalDuration(show.lineup);
            return (
              <div key={show.id} className="show-item" onClick={() => onLoad(show.id!)}>
                <div className="show-name">{show.name}</div>
                <div className="show-info">
                  {show.lineup.length} performers \u00b7 {Math.floor(total / 60)}:{(total % 60).toString().padStart(2, '0')} \u00b7 {new Date(show.createdDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="form-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export default LiveControllerScreen;
