import { useState, useEffect, useRef } from 'react';
import { LineupEntry, Performer, Show } from '../types';
import * as storage from '../storage';
import { saveAudioFile } from '../audioStorage';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { parseLineupText, ParsedLineupItem } from '../lineupParser';
import { getLineupAiParser } from '../lineupAi';
import './ShowBuilderScreen.css';

function ShowBuilderScreen() {
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [showName, setShowName] = useState('');
  const [currentShowId, setCurrentShowId] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAddPerformerModal, setShowAddPerformerModal] = useState(false);
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [audioPickerIndex, setAudioPickerIndex] = useState<{ index: number; type: 'walkOn' | 'walkOff' } | null>(null);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<ParsedLineupItem[]>([]);
  const [bulkUseAi, setBulkUseAi] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const aiAvailable = getLineupAiParser() !== null;

  useEffect(() => {
    loadPerformers();
    loadShows();
  }, []);

  const loadPerformers = () => setPerformers(storage.getPerformers());
  const loadShows = () => setShows(storage.getShows());

  const getTotalDuration = () => lineup.reduce((sum, e) => sum + e.duration, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getStartTime = (index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) t += lineup[i].duration;
    return t;
  };

  const handleAddFromLibrary = (performer: Performer) => {
    const entry: LineupEntry = {
      performerId: performer.id,
      name: performer.name,
      duration: performer.defaultDuration,
      walkOnAudioId: performer.walkOnAudioId,
      walkOnAudioName: performer.walkOnAudioName,
      walkOffAudioId: performer.walkOffAudioId,
      walkOffAudioName: performer.walkOffAudioName,
      orderIndex: lineup.length,
    };
    setLineup([...lineup, entry]);
    setShowAddPerformerModal(false);
    showToast(`${performer.name} added to lineup`, 'success');
  };

  const handleAddCustomEntry = () => {
    const entry: LineupEntry = {
      name: 'New Performer',
      duration: 5,
      orderIndex: lineup.length,
    };
    setLineup([...lineup, entry]);
  };

  const handleUpdateEntry = (index: number, updates: Partial<LineupEntry>) => {
    const newLineup = lineup.map((e, i) =>
      i === index ? { ...e, ...updates } : e
    );
    setLineup(newLineup);
  };

  const handleDeleteEntry = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const confirmDeleteEntry = () => {
    if (showDeleteConfirm === null) return;
    const newLineup = lineup.filter((_, i) => i !== showDeleteConfirm)
      .map((e, i) => ({ ...e, orderIndex: i }));
    setLineup(newLineup);
    showToast('Removed from lineup', 'success');
    setShowDeleteConfirm(null);
  };

  const handleMoveEntry = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= lineup.length) return;
    const newLineup = [...lineup];
    const [moved] = newLineup.splice(fromIndex, 1);
    newLineup.splice(toIndex, 0, moved);
    newLineup.forEach((e, i) => e.orderIndex = i);
    setLineup(newLineup);
  };

  const handleAudioPick = (index: number, type: 'walkOn' | 'walkOff') => {
    setAudioPickerIndex({ index, type });
    audioRef.current?.click();
  };

  const handleAudioSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioPickerIndex) return;
    setAudioProcessing(true);
    try {
      const { id, name } = await saveAudioFile(file);
      const { index, type } = audioPickerIndex;
      if (type === 'walkOn') {
        handleUpdateEntry(index, { walkOnAudioId: id, walkOnAudioName: name });
      } else {
        handleUpdateEntry(index, { walkOffAudioId: id, walkOffAudioName: name });
      }
      showToast('Audio attached with fades applied', 'success');
    } catch {
      showToast('Failed to process audio file', 'error');
    } finally {
      setAudioProcessing(false);
      setAudioPickerIndex(null);
      if (audioRef.current) audioRef.current.value = '';
    }
  };

  const handleSaveShow = () => {
    if (!showName.trim()) {
      showToast('Please enter a show name', 'warning');
      return;
    }
    if (lineup.length === 0) {
      showToast('Add at least one performer before saving', 'warning');
      return;
    }
    const show: Show = {
      name: showName,
      createdDate: new Date().toISOString(),
      lineup: lineup,
    };
    if (currentShowId) {
      storage.updateShow(currentShowId, show);
    } else {
      const id = storage.saveShow(show);
      setCurrentShowId(id);
    }
    setShowSaveModal(false);
    loadShows();
    showToast('Show saved!', 'success');
  };

  const handleLoadShow = (showId: number) => {
    const show = storage.getShow(showId);
    if (show) {
      setLineup(show.lineup);
      setShowName(show.name);
      setCurrentShowId(show.id!);
      setShowLoadModal(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setLineup([]);
    setShowName('');
    setCurrentShowId(null);
    setShowResetConfirm(false);
    showToast('Lineup cleared', 'info');
  };

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const openBulkModal = () => {
    setBulkText('');
    setBulkPreview([]);
    setBulkError(null);
    setBulkUseAi(aiAvailable);
    setShowBulkModal(true);
  };

  const handleBulkParse = async () => {
    setBulkError(null);
    if (!bulkText.trim()) {
      setBulkPreview([]);
      return;
    }
    if (bulkUseAi) {
      const ai = getLineupAiParser();
      if (!ai) {
        setBulkError('AI parser not available; using fallback.');
        setBulkPreview(parseLineupText(bulkText));
        return;
      }
      setBulkBusy(true);
      try {
        const items = await ai(bulkText);
        setBulkPreview(items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI parse failed';
        setBulkError(`${msg}. Using fallback.`);
        setBulkPreview(parseLineupText(bulkText));
      } finally {
        setBulkBusy(false);
      }
    } else {
      setBulkPreview(parseLineupText(bulkText));
    }
  };

  const updateBulkPreview = (idx: number, updates: Partial<ParsedLineupItem>) => {
    setBulkPreview(bulkPreview.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  };

  const removeBulkPreview = (idx: number) => {
    setBulkPreview(bulkPreview.filter((_, i) => i !== idx));
  };

  const applyBulkPreview = () => {
    if (bulkPreview.length === 0) return;
    const byName = new Map(performers.map((p) => [p.name.trim().toLowerCase(), p]));
    const additions: LineupEntry[] = bulkPreview.map((item, i) => {
      const match = byName.get(item.name.trim().toLowerCase());
      const entry: LineupEntry = {
        performerId: match?.id,
        name: match?.name || item.name,
        duration: item.duration,
        walkOnAudioId: match?.walkOnAudioId,
        walkOnAudioName: match?.walkOnAudioName,
        walkOffAudioId: match?.walkOffAudioId,
        walkOffAudioName: match?.walkOffAudioName,
        orderIndex: lineup.length + i,
      };
      return entry;
    });
    setLineup([...lineup, ...additions]);
    setShowBulkModal(false);
    showToast(`Added ${additions.length} performer${additions.length === 1 ? '' : 's'} to lineup`, 'success');
  };

  return (
    <div className="show-builder-screen">
      <div className="builder-header">
        <div className="header-info">
          <h2>{showName || 'Untitled Show'}</h2>
          <div className="total-runtime">
            {lineup.length} performer{lineup.length !== 1 ? 's' : ''} · {formatTime(getTotalDuration())} total
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleReset}>Clear</button>
          <button className="btn-secondary" onClick={() => setShowLoadModal(true)}>Load</button>
          <button className="btn-primary" onClick={() => setShowSaveModal(true)}>Save Show</button>
        </div>
      </div>

      <div className="builder-content">
        <div className="lineup-list">
          {lineup.length === 0 ? (
            <EmptyState
              message="No performers in lineup"
              hint='Tap "Add from Library" or "Add Custom" to build your lineup.'
            />
          ) : (
            lineup.map((entry, index) => {
              const startTime = getStartTime(index);
              return (
                <div key={index} className="lineup-row">
                  <div className="col-time">
                    {formatTime(startTime)}–{formatTime(startTime + entry.duration)}
                  </div>
                  <div className="col-performer">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        title="Performer name"
                        value={entry.name}
                        onChange={(e) => handleUpdateEntry(index, { name: e.target.value })}
                        onBlur={() => setEditingIndex(null)}
                        autoFocus
                      />
                    ) : (
                      <div>
                        <span onClick={() => setEditingIndex(index)}>{entry.name}</span>
                        {entry.walkOnAudioName && <span className="audio-indicator"> ♪ on</span>}
                        {entry.walkOffAudioName && <span className="audio-indicator"> ♪ off</span>}
                      </div>
                    )}
                  </div>
                  <div className="col-duration">
                    <input
                      type="number"
                      min="1"
                      title="Set duration in minutes"
                      value={entry.duration}
                      onChange={(e) => handleUpdateEntry(index, { duration: parseInt(e.target.value) || 1 })}
                      className="duration-input"
                    />
                    <span>min</span>
                  </div>
                  <div className="col-actions">
                    <button
                      className="btn-icon"
                      onClick={() => setEditingNotesIndex(index)}
                      title="Add notes for this performer"
                      aria-label="Notes"
                    >
                      N
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleAudioPick(index, 'walkOn')}
                      title="Set walk-on audio for this slot"
                      aria-label="Walk-on audio"
                    >
                      ♪
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleMoveEntry(index, index - 1)}
                      disabled={index === 0}
                      title="Move earlier in lineup"
                      aria-label="Move up"
                    >
                      &#8593;
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleMoveEntry(index, index + 1)}
                      disabled={index === lineup.length - 1}
                      title="Move later in lineup"
                      aria-label="Move down"
                    >
                      &#8595;
                    </button>
                    <button
                      className="btn-danger btn-icon"
                      onClick={() => handleDeleteEntry(index)}
                      title="Remove from lineup"
                      aria-label="Delete"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="add-performer-area">
          <button className="btn-primary" onClick={() => setShowAddPerformerModal(true)}>Add from Library</button>
          <button className="btn-secondary btn-add-custom" onClick={handleAddCustomEntry}>Add Custom</button>
          <button className="btn-secondary btn-add-custom" onClick={openBulkModal}>Bulk Paste</button>
          <p className="builder-tip">Tap a name to rename. Audio assignments travel with each performer when reordered.</p>
        </div>

        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          title="Choose audio file"
          className="hidden-input"
          onChange={handleAudioSelected}
        />
        {audioProcessing && (
          <div className="audio-processing-banner">Processing audio with fades...</div>
        )}
      </div>

      {showSaveModal && (
        <Modal title="Save Show" onClose={() => setShowSaveModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveShow(); }}>
            <div className="form-group">
              <label>Show Name</label>
              <input
                type="text"
                value={showName}
                onChange={(e) => setShowName(e.target.value)}
                autoFocus
                placeholder="Enter show name..."
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {showLoadModal && (
        <Modal title="Load Show" onClose={() => setShowLoadModal(false)}>
          {shows.length === 0 ? (
            <EmptyState message="No saved shows yet" hint="Build a lineup and save it first." />
          ) : (
            <div className="shows-list">
              {shows.map(show => (
                <div key={show.id} className="show-item" onClick={() => handleLoadShow(show.id!)}>
                  <div className="show-name">{show.name}</div>
                  <div className="show-info">
                    {show.lineup.length} performers · {new Date(show.createdDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowLoadModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {showAddPerformerModal && (
        <Modal title="Add Performer to Lineup" onClose={() => setShowAddPerformerModal(false)}>
          {performers.length === 0 ? (
            <EmptyState message="No performers in library" hint="Go to Library to add performers first." />
          ) : (
            <div className="shows-list">
              {performers.map(p => (
                <div key={p.id} className="show-item" onClick={() => handleAddFromLibrary(p)}>
                  <div className="show-name">{p.name}</div>
                  <div className="show-info">
                    {p.defaultDuration} min
                    {p.walkOnAudioName && ` · Walk-on: ${p.walkOnAudioName}`}
                    {p.walkOffAudioName && ` · Walk-off: ${p.walkOffAudioName}`}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowAddPerformerModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {editingNotesIndex !== null && (
        <Modal title="Performer Notes" onClose={() => setEditingNotesIndex(null)}>
          <h3 className="notes-performer-name">{lineup[editingNotesIndex]?.name}</h3>
          <p className="notes-help">Credits, talking points, or reminders for this performer's slot.</p>
          <textarea
            className="notes-textarea"
            value={lineup[editingNotesIndex]?.notes || ''}
            onChange={(e) => handleUpdateEntry(editingNotesIndex, { notes: e.target.value })}
            placeholder={"e.g., Credits: From Boston\nMention: New album out\nSetup: Long intro needed"}
            rows={10}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn-primary" onClick={() => setEditingNotesIndex(null)}>Done</button>
          </div>
        </Modal>
      )}

      {showBulkModal && (
        <Modal title="Bulk Add Performers" onClose={() => setShowBulkModal(false)}>
          <p className="notes-help">
            Paste names with optional minutes — one per line. Examples: <code>Alex - 7</code>, <code>Sam, 5 min</code>, <code>Jordan</code> (defaults to 5).
          </p>
          <textarea
            className="notes-textarea"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Alex - 7\nSam, 5 min\nJordan\nKim 8"}
            rows={8}
            autoFocus
          />
          <div className="bulk-options">
            <label className={`bulk-ai-toggle${aiAvailable ? '' : ' disabled'}`}>
              <input
                type="checkbox"
                checked={bulkUseAi && aiAvailable}
                disabled={!aiAvailable || bulkBusy}
                onChange={(e) => setBulkUseAi(e.target.checked)}
              />
              <span>Use AI parser (smart){aiAvailable ? '' : ' — not configured'}</span>
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBulkParse}
              disabled={bulkBusy || !bulkText.trim()}
            >
              {bulkBusy ? 'Parsing…' : 'Preview'}
            </button>
          </div>
          {bulkError && <div className="web-message">{bulkError}</div>}
          {bulkPreview.length > 0 && (
            <div className="bulk-preview">
              <div className="bulk-preview-header">
                Preview ({bulkPreview.length}) — edit before adding:
              </div>
              {bulkPreview.map((item, i) => (
                <div key={i} className="bulk-preview-row">
                  <input
                    type="text"
                    className="bulk-preview-name"
                    title="Performer name"
                    value={item.name}
                    onChange={(e) => updateBulkPreview(i, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    min="1"
                    className="duration-input"
                    title="Duration in minutes"
                    value={item.duration}
                    onChange={(e) => updateBulkPreview(i, { duration: parseInt(e.target.value) || 1 })}
                  />
                  <span>min</span>
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => removeBulkPreview(i)}
                    aria-label="Remove"
                  >
                    &#10005;
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={applyBulkPreview}
              disabled={bulkPreview.length === 0}
            >
              Add {bulkPreview.length || ''} to Lineup
            </button>
          </div>
        </Modal>
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Clear Lineup?"
          message="This will remove all performers from the current lineup. Any unsaved changes will be lost."
          confirmLabel="Clear"
          danger
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showDeleteConfirm !== null && (
        <ConfirmDialog
          title="Remove Performer?"
          message={`Remove "${lineup[showDeleteConfirm]?.name}" from the lineup?`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmDeleteEntry}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default ShowBuilderScreen;
