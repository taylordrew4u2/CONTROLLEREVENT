import { useState, useEffect } from 'react';
import { Segment, Comedian, Template, Show } from '../types';
import * as storage from '../storage';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import './ShowBuilderScreen.css';

function ShowBuilderScreen() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [showName, setShowName] = useState('');
  const [currentShowId, setCurrentShowId] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteSegmentConfirm, setShowDeleteSegmentConfirm] = useState<number | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    loadDefaultTemplate();
    loadComedians();
    loadTemplates();
    loadShows();
  }, []);

  const loadDefaultTemplate = () => {
    const template = storage.getDefaultShowTemplate();
    if (template && template.segments) {
      const newSegments = template.segments.map((seg, index) => ({
        name: seg.name,
        duration: seg.duration,
        orderIndex: index,
        calculatedStartTime: 0,
        segmentType: seg.segmentType
      }));
      recalculateTimestamps(newSegments);
      setSegments(newSegments);
    }
  };

  const loadComedians = () => setComedians(storage.getComedians());
  const loadTemplates = () => setTemplates(storage.getTemplates());
  const loadShows = () => setShows(storage.getShows());

  const recalculateTimestamps = (segs: Segment[]) => {
    let currentTime = 0;
    segs.forEach(seg => {
      seg.calculatedStartTime = currentTime;
      currentTime += seg.duration;
    });
    return segs;
  };

  const getTotalDuration = () => segments.reduce((sum, seg) => sum + seg.duration, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (start: number, duration: number) => {
    return `${formatTime(start)}\u2013${formatTime(start + duration)}`;
  };

  const handleAddSegment = () => {
    const newSegment: Segment = {
      name: 'New Segment',
      duration: 5,
      orderIndex: segments.length,
      calculatedStartTime: 0
    };
    const newSegments = [...segments, newSegment];
    recalculateTimestamps(newSegments);
    setSegments(newSegments);
  };

  const handleUpdateSegment = (index: number, updates: Partial<Segment>) => {
    const newSegments = segments.map((seg, i) =>
      i === index ? { ...seg, ...updates } : seg
    );
    recalculateTimestamps(newSegments);
    setSegments(newSegments);
  };

  const handleDeleteSegment = (index: number) => {
    setShowDeleteSegmentConfirm(index);
  };

  const confirmDeleteSegment = () => {
    if (showDeleteSegmentConfirm === null) return;
    const newSegments = segments.filter((_, i) => i !== showDeleteSegmentConfirm)
      .map((seg, i) => ({ ...seg, orderIndex: i }));
    recalculateTimestamps(newSegments);
    setSegments(newSegments);
    showToast('Segment removed', 'success');
    setShowDeleteSegmentConfirm(null);
  };

  const handleMoveSegment = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= segments.length) return;
    const newSegments = [...segments];
    const [moved] = newSegments.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, moved);
    newSegments.forEach((seg, i) => seg.orderIndex = i);
    recalculateTimestamps(newSegments);
    setSegments(newSegments);
  };

  const handleAssignComedian = (segmentIndex: number, comedianId: number) => {
    const comedian = comedians.find(c => c.id === comedianId);
    if (comedian) {
      handleUpdateSegment(segmentIndex, {
        name: comedian.name,
        audioFilePath: comedian.audioFilePath,
        walkOnAudioId: comedian.walkOnAudioId,
        walkOnAudioName: comedian.walkOnAudioName,
        walkOffAudioId: comedian.walkOffAudioId,
        walkOffAudioName: comedian.walkOffAudioName,
        duration: comedian.defaultDuration,
        comedianId: comedian.id
      });
    }
  };

  const handleAssignTemplate = (segmentIndex: number, templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      handleUpdateSegment(segmentIndex, {
        name: template.name,
        audioFilePath: template.audioFilePath,
        duration: template.defaultDuration,
        templateId: template.id
      });
    }
  };

  const handleAddAudioToSegment = (_segmentIndex: number) => {
    showToast('Audio file picking is not available in this version', 'warning');
  };

  const handleSaveShow = async () => {
    if (!showName.trim()) {
      showToast('Please enter a show name', 'warning');
      return;
    }
    if (segments.length === 0) {
      showToast('Add at least one segment before saving', 'warning');
      return;
    }
    try {
      const totalDuration = getTotalDuration();
      const show: Show = {
        name: showName,
        createdDate: new Date().toISOString(),
        totalDuration: totalDuration || 0,
        segments: segments
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
    } catch (err) {
      console.error('Error saving show:', err);
      showToast('Error saving show: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  const handleLoadShow = (showId: number) => {
    const show = storage.getShow(showId);
    if (show) {
      setSegments(show.segments);
      setShowName(show.name);
      setCurrentShowId(show.id!);
      setShowLoadModal(false);
    }
  };

  const handleUseTemplate = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    loadDefaultTemplate();
    setShowName('');
    setCurrentShowId(null);
    setShowResetConfirm(false);
    showToast('Reset to default template', 'info');
  };

  const handleSaveAsTemplate = () => {
    setTemplateName('');
    setShowSaveTemplateModal(true);
  };

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'warning');
      return;
    }
    storage.saveShowTemplate(templateName, segments.map(seg => ({
      name: seg.name,
      duration: seg.duration,
      orderIndex: seg.orderIndex
    })));
    setShowSaveTemplateModal(false);
    showToast('Template saved as default!', 'success');
  };

  return (
    <div className="show-builder-screen">
      <div className="builder-header">
        <div className="header-info">
          <h2>{showName || 'Untitled Show'}</h2>
          <div className="total-runtime">
            Total: {formatTime(getTotalDuration())} ({getTotalDuration()} min)
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleUseTemplate}>Reset</button>
          <button className="btn-secondary" onClick={handleSaveAsTemplate}>Save Template</button>
          <button className="btn-secondary" onClick={() => setShowLoadModal(true)}>Load</button>
          <button className="btn-primary" onClick={() => setShowSaveModal(true)}>Save Show</button>
        </div>
      </div>

      <div className="builder-content">
        <div className="segments-list">
          <div className="list-header">
            <span className="col-time">Time</span>
            <span className="col-segment">Segment</span>
            <span className="col-duration">Duration</span>
            <span className="col-actions">Actions</span>
          </div>

          {segments.length === 0 ? (
            <EmptyState
              message="No segments yet"
              hint='Tap "Add Segment" below or "Reset" to load the default show template.'
            />
          ) : (
            segments.map((segment, index) => (
              <div key={index} className="segment-row">
                <div className="col-time">
                  {formatTimeRange(segment.calculatedStartTime, segment.duration)}
                </div>
                <div className="col-segment">
                  {editingSegment === index ? (
                    <input
                      type="text"
                      title="Segment name"
                      value={segment.name}
                      onChange={(e) => handleUpdateSegment(index, { name: e.target.value })}
                      onBlur={() => setEditingSegment(null)}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <span onClick={() => setEditingSegment(index)}>{segment.name}</span>
                      {segment.walkOnAudioName && <span className="audio-indicator"> (walk-on)</span>}
                      {segment.walkOffAudioName && <span className="audio-indicator"> (walk-off)</span>}
                      {segment.audioFilePath && !segment.walkOnAudioName && <span className="audio-indicator"> (audio)</span>}
                    </div>
                  )}
                </div>
                <div className="col-duration">
                  <input
                    type="number"
                    min="1"
                    title="Segment duration in minutes"
                    value={segment.duration}
                    onChange={(e) => handleUpdateSegment(index, { duration: parseInt(e.target.value) || 1 })}
                    className="duration-input"
                  />
                  <span>min</span>
                </div>
                <div className="col-actions">
                  <button
                    className="btn-icon"
                    onClick={() => setEditingNotesIndex(index)}
                    title="Add notes or talking points for this segment"
                    aria-label="Notes"
                  >
                    N
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleAddAudioToSegment(index)}
                    title="Attach an audio file to play during this segment"
                    aria-label="Audio"
                  >
                    A
                  </button>

                  <select
                    title="Assign comedian or template"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith('c-')) {
                        handleAssignComedian(index, parseInt(value.substring(2)));
                      } else if (value.startsWith('t-')) {
                        handleAssignTemplate(index, parseInt(value.substring(2)));
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="">Assign...</option>
                    <optgroup label="Comedians">
                      {comedians.map(c => (
                        <option key={`c-${c.id}`} value={`c-${c.id}`}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Templates">
                      {templates.map(t => (
                        <option key={`t-${t.id}`} value={`t-${t.id}`}>{t.name}</option>
                      ))}
                    </optgroup>
                  </select>

                  <button
                    className="btn-icon"
                    onClick={() => handleMoveSegment(index, index - 1)}
                    disabled={index === 0}
                    title="Move this segment earlier in the show"
                    aria-label="Move up"
                  >
                    &#8593;
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleMoveSegment(index, index + 1)}
                    disabled={index === segments.length - 1}
                    title="Move this segment later in the show"
                    aria-label="Move down"
                  >
                    &#8595;
                  </button>
                  <button
                    className="btn-danger btn-icon"
                    onClick={() => handleDeleteSegment(index)}
                    title="Remove this segment from the show"
                    aria-label="Delete segment"
                  >
                    &#10005;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="add-segment-area">
          <button className="btn-primary" onClick={handleAddSegment}>Add Segment</button>
          <p className="builder-tip">Tap a segment name to rename it. Use "Assign" to fill from your library.</p>
        </div>
      </div>

      {showSaveModal && (
        <Modal title="Save Show" onClose={() => setShowSaveModal(false)}>
          <div className="form-group">
            <label>Show Name</label>
            <input
              type="text"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              autoFocus
              placeholder="Enter show name..."
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveShow}>Save</button>
          </div>
        </Modal>
      )}

      {showLoadModal && (
        <Modal title="Load Show" onClose={() => setShowLoadModal(false)}>
          {shows.length === 0 ? (
            <EmptyState message="No saved shows yet" hint="Build a show and save it first." />
          ) : (
            <div className="shows-list">
              {shows.map(show => (
                <div key={show.id} className="show-item" onClick={() => handleLoadShow(show.id!)}>
                  <div className="show-name">{show.name}</div>
                  <div className="show-info">
                    {formatTime(show.totalDuration)} · {new Date(show.createdDate).toLocaleDateString()}
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

      {editingNotesIndex !== null && (
        <Modal title="Segment Notes" onClose={() => setEditingNotesIndex(null)}>
          <h3 className="notes-segment-name">{segments[editingNotesIndex]?.name}</h3>
          <p className="notes-help">Use this space for credits, talking points, or reminders for this segment.</p>
          <textarea
            className="notes-textarea"
            value={segments[editingNotesIndex]?.notes || ''}
            onChange={(e) => handleUpdateSegment(editingNotesIndex, { notes: e.target.value })}
            placeholder={"e.g., Credits: John Smith from Boston\nMention: New show dates next weekend\nSetup: Introduce headliner's special achievement"}
            rows={10}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn-primary" onClick={() => setEditingNotesIndex(null)}>Done</button>
          </div>
        </Modal>
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset to Default Template?"
          message="This will clear your entire current lineup and replace it with the default show template. Any unsaved changes will be lost."
          confirmLabel="Reset"
          danger
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showDeleteSegmentConfirm !== null && (
        <ConfirmDialog
          title="Delete Segment?"
          message={`Are you sure you want to remove "${segments[showDeleteSegmentConfirm]?.name}" from the show?`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteSegment}
          onCancel={() => setShowDeleteSegmentConfirm(null)}
        />
      )}

      {showSaveTemplateModal && (
        <Modal title="Save as Template" onClose={() => setShowSaveTemplateModal(false)}>
          <p className="confirm-message">This will save the current segment layout as the new default template.</p>
          <div className="form-group">
            <label>Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Friday Night 60-Min"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowSaveTemplateModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={confirmSaveTemplate}>Save Template</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ShowBuilderScreen;
