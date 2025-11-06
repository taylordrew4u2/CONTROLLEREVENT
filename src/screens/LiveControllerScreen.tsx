import { useState, useEffect, useRef, useCallback } from 'react';
import { Show } from '../types';
import './LiveControllerScreen.css';

function LiveControllerScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showScheduleOverlay, setShowScheduleOverlay] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert file path to local-audio:// protocol for Electron playback
  const getAudioURL = (filePath: string): string => {
    if (!filePath) return '';
    if (filePath.startsWith('local-audio://')) return filePath;
    // Convert absolute path to local-audio:// protocol
    return `local-audio://${encodeURIComponent(filePath)}`;
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
        clearInterval(fadeOutRef.current as NodeJS.Timeout);
      } else {
        const progress = (now - startTime) / (duration * 1000);
        audio.volume = startVolume * (1 - progress);
      }
    }, 50);
  };

  const handleNextSegment = useCallback(() => {
    if (!currentShow || currentSegmentIndex >= currentShow.segments.length - 1) return;
    
    // Fade out current audio
    if (audioRef.current) {
      fadeOutAudio(audioRef.current, 2);
    }
    
    // Move to next segment
    const nextIndex = currentSegmentIndex + 1;
    setCurrentSegmentIndex(nextIndex);
    setElapsedSeconds(currentShow.segments[nextIndex].calculatedStartTime * 60);
    
    // Use preloaded audio
    if (nextAudioRef.current) {
      audioRef.current = nextAudioRef.current;
      nextAudioRef.current = null;
      
      if (isRunning) {
        audioRef.current.play();
      }
    }
  }, [currentShow, currentSegmentIndex, isRunning]);

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1;
          
          // Check if segment is complete
          if (currentShow && currentSegmentIndex < currentShow.segments.length) {
            const currentSegment = currentShow.segments[currentSegmentIndex];
            const segmentElapsed = newValue - (currentSegment.calculatedStartTime * 60);
            
            // 30-second warning
            if (segmentElapsed === (currentSegment.duration * 60) - 30) {
              navigator.vibrate?.(200);
            }
            
            // Auto-advance to next segment
            if (segmentElapsed >= currentSegment.duration * 60) {
              handleNextSegment();
            }
          }
          
          return newValue;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, currentSegmentIndex, currentShow, handleNextSegment]);

  useEffect(() => {
    // Preload next audio
    if (currentShow && currentSegmentIndex < currentShow.segments.length - 1) {
      const nextSegment = currentShow.segments[currentSegmentIndex + 1];
      if (nextSegment.audioFilePath) {
        nextAudioRef.current = new Audio(getAudioURL(nextSegment.audioFilePath));
        nextAudioRef.current.volume = volume;
        nextAudioRef.current.load();
      }
    }
  }, [currentSegmentIndex, currentShow, volume]);

  const loadShows = async () => {
    const data = await window.electronAPI.getShows();
    setShows(data);
  };

  const handleLoadShow = async (showId: number) => {
    const show = await window.electronAPI.getShow(showId);
    if (show) {
      setCurrentShow(show);
      setCurrentSegmentIndex(0);
      setElapsedSeconds(0);
      setIsRunning(false);
      setShowLoadModal(false);
      
      // Initialize first segment audio
      if (show.segments[0]?.audioFilePath) {
        audioRef.current = new Audio();
        audioRef.current.src = getAudioURL(show.segments[0].audioFilePath);
        audioRef.current.volume = volume;
        audioRef.current.load();
      }
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    if (audioRef.current && currentShow?.segments[currentSegmentIndex]?.audioFilePath) {
      // Ensure audio source is set
      const audioPath = getAudioURL(currentShow.segments[currentSegmentIndex].audioFilePath);
      if (audioRef.current.src !== audioPath) {
        audioRef.current.src = audioPath;
        audioRef.current.load();
      }
      // Add small delay to ensure audio is ready
      setTimeout(() => {
        audioRef.current?.play().catch(err => console.error('Audio play error:', err));
      }, 100);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (audioRef.current) {
      fadeOutAudio(audioRef.current, 1);
    }
  };

  const handleJumpToSegment = (index: number) => {
    if (!currentShow) return;
    
    if (audioRef.current) {
      fadeOutAudio(audioRef.current, 1);
    }
    
    setCurrentSegmentIndex(index);
    setElapsedSeconds(currentShow.segments[index].calculatedStartTime * 60);
    
    // Load new audio
    if (currentShow.segments[index].audioFilePath) {
      audioRef.current = new Audio(getAudioURL(currentShow.segments[index].audioFilePath));
      audioRef.current.volume = volume;
      
      if (isRunning) {
        audioRef.current.play();
      }
    }
    
    setShowScheduleOverlay(false);
  };

  const handleAdjustTime = (minutes: number) => {
    setElapsedSeconds(prev => Math.max(0, prev + (minutes * 60)));
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleRestartTrack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isRunning) {
        audioRef.current.play();
      }
    }
  };

  const handleEmergencyStop = () => {
    setIsRunning(false);
    if (audioRef.current) {
      fadeOutAudio(audioRef.current, 0.5);
    }
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

  const getCurrentSegment = () => {
    if (!currentShow || currentSegmentIndex >= currentShow.segments.length) return null;
    return currentShow.segments[currentSegmentIndex];
  };

  const getNextSegment = () => {
    if (!currentShow || currentSegmentIndex >= currentShow.segments.length - 1) return null;
    return currentShow.segments[currentSegmentIndex + 1];
  };

  const getSegmentTimeRemaining = () => {
    const segment = getCurrentSegment();
    if (!segment) return 0;
    
    const segmentStart = segment.calculatedStartTime * 60;
    const segmentDuration = segment.duration * 60;
    const segmentElapsed = elapsedSeconds - segmentStart;
    
    return Math.max(0, segmentDuration - segmentElapsed);
  };

  const getScheduleDelta = () => {
    const segment = getCurrentSegment();
    if (!segment) return 0;
    
    const plannedTime = segment.calculatedStartTime * 60;
    const actualTime = elapsedSeconds;
    
    return actualTime - plannedTime;
  };

  if (!currentShow) {
    return (
      <div className="live-controller-screen">
        <div className="no-show">
          <h2>No Show Loaded</h2>
          <p>Please load a show to begin</p>
          <button className="btn-primary" onClick={() => setShowLoadModal(true)}>
            Load Show
          </button>
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

  const currentSegment = getCurrentSegment();
  const nextSegment = getNextSegment();
  const timeRemaining = getSegmentTimeRemaining();
  const delta = getScheduleDelta();

  return (
    <div className="live-controller-screen">
      <div className="controller-top">
        <div className="timer-display">
          <div className="countdown-timer">{formatMinutesSeconds(timeRemaining)}</div>
          <div className="elapsed-time">Show Time: {formatTime(elapsedSeconds)}</div>
        </div>
        
        {currentSegment && (
          <div className="segment-info">
            <div className="segment-name">
              {formatMinutesSeconds(currentSegment.calculatedStartTime * 60)}-
              {formatMinutesSeconds((currentSegment.calculatedStartTime + currentSegment.duration) * 60)} | {currentSegment.name}
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${(elapsedSeconds / (currentShow.totalDuration * 60)) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="controller-middle">
        {currentSegment && (
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Allocated Time</div>
              <div className="status-value">{currentSegment.duration} min</div>
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
                Segment {currentSegmentIndex + 1} of {currentShow.segments.length}
              </div>
            </div>
            {nextSegment && (
              <div className="status-item full-width">
                <div className="status-label">Next Up</div>
                <div className="status-value">
                  {formatMinutesSeconds(nextSegment.calculatedStartTime * 60)}-
                  {formatMinutesSeconds((nextSegment.calculatedStartTime + nextSegment.duration) * 60)} | {nextSegment.name}
                </div>
              </div>
            )}
            {currentSegment.audioFilePath && (
              <div className="status-item full-width">
                <div className="status-label">Audio File</div>
                <div className="status-value audio-path">{currentSegment.audioFilePath}</div>
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
              <button className="btn-success btn-large" onClick={handleStart}>
                ▶ Start
              </button>
            ) : (
              <button className="btn-secondary btn-large" onClick={handlePause}>
                ⏸ Pause
              </button>
            )}
            <button className="btn-secondary" onClick={() => handleAdjustTime(2)}>
              +2 Min
            </button>
            <button className="btn-secondary" onClick={() => handleAdjustTime(-2)}>
              -2 Min
            </button>
            <button className="btn-primary" onClick={handleNextSegment}>
              Skip Segment →
            </button>
          </div>
        </div>

        <div className="control-section">
          <h3>Audio Controls</h3>
          <div className="control-buttons">
            <button className="btn-secondary" onClick={handleRestartTrack}>
              ⟲ Restart Track
            </button>
            <div className="volume-control">
              <label>Volume:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              />
              <span>{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="control-section full-width">
          <div className="control-buttons">
            <button className="btn-danger btn-large" onClick={handleEmergencyStop}>
              ⏹ EMERGENCY STOP
            </button>
            <button className="btn-primary" onClick={() => setShowScheduleOverlay(true)}>
              📋 View Full Schedule
            </button>
            <button className="btn-secondary" onClick={() => setShowLoadModal(true)}>
              Load Different Show
            </button>
          </div>
        </div>
      </div>

      {showScheduleOverlay && (
        <ScheduleOverlay
          show={currentShow}
          currentSegmentIndex={currentSegmentIndex}
          elapsedSeconds={elapsedSeconds}
          onJumpTo={handleJumpToSegment}
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
    </div>
  );
}

interface ScheduleOverlayProps {
  show: Show;
  currentSegmentIndex: number;
  elapsedSeconds: number;
  onJumpTo: (index: number) => void;
  onClose: () => void;
}

function ScheduleOverlay({ show, currentSegmentIndex, onJumpTo, onClose }: ScheduleOverlayProps) {
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal schedule-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Full Show Schedule - {show.name}</h2>
        <div className="schedule-list">
          {show.segments.map((segment, index) => (
            <div
              key={index}
              className={`schedule-item ${index === currentSegmentIndex ? 'current' : ''}`}
              onClick={() => onJumpTo(index)}
            >
              <div className="schedule-time">
                {formatTime(segment.calculatedStartTime)}-{formatTime(segment.calculatedStartTime + segment.duration)}
              </div>
              <div className="schedule-name">{segment.name}</div>
              <div className="schedule-duration">{segment.duration} min</div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface LoadShowModalProps {
  shows: Show[];
  onLoad: (id: number) => void;
  onClose: () => void;
}

function LoadShowModal({ shows, onLoad, onClose }: LoadShowModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Load Show</h2>
        <div className="shows-list">
          {shows.map(show => (
            <div
              key={show.id}
              className="show-item"
              onClick={() => onLoad(show.id!)}
            >
              <div className="show-name">{show.name}</div>
              <div className="show-info">
                {Math.floor(show.totalDuration / 60)}:{(show.totalDuration % 60).toString().padStart(2, '0')} • {new Date(show.createdDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveControllerScreen;
