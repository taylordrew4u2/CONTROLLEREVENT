import { useState, useEffect } from 'react';
import { Segment, Comedian, Template, Show } from '../types';
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

  useEffect(() => {
    loadDefaultTemplate();
    loadComedians();
    loadTemplates();
    loadShows();
  }, []);

  const loadDefaultTemplate = async () => {
    const template = await window.electronAPI.getDefaultShowTemplate();
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

  const loadComedians = async () => {
    const data = await window.electronAPI.getComedians();
    setComedians(data);
  };

  const loadTemplates = async () => {
    const data = await window.electronAPI.getTemplates();
    setTemplates(data);
  };

  const loadShows = async () => {
    const data = await window.electronAPI.getShows();
    setShows(data);
  };

  const recalculateTimestamps = (segs: Segment[]) => {
    let currentTime = 0;
    segs.forEach(seg => {
      seg.calculatedStartTime = currentTime;
      currentTime += seg.duration;
    });
    return segs;
  };

  const getTotalDuration = () => {
    return segments.reduce((sum, seg) => sum + seg.duration, 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (start: number, duration: number) => {
    return `${formatTime(start)}-${formatTime(start + duration)}`;
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
    const newSegments = segments.filter((_, i) => i !== index)
      .map((seg, i) => ({ ...seg, orderIndex: i }));
    recalculateTimestamps(newSegments);
    setSegments(newSegments);
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

  const handleAddAudioToSegment = async (segmentIndex: number) => {
    const filePath = await window.electronAPI.pickAudioFile();
    if (filePath) {
      handleUpdateSegment(segmentIndex, {
        audioFilePath: filePath
      });
      console.log('Audio file added to segment:', filePath);
    }
  };

  const handleSaveShow = async () => {
    if (!showName.trim()) {
      alert('Please enter a show name');
      return;
    }

    if (segments.length === 0) {
      alert('Please add at least one segment to the show');
      return;
    }

    try {
      const totalDuration = getTotalDuration();
      
      const show: Show = {
        name: showName,
        createdDate: new Date().toISOString(),
        totalDuration: totalDuration || 0, // Ensure it's never null/undefined
        segments: segments
      };

      console.log('Saving show:', show);

      if (currentShowId) {
        await window.electronAPI.updateShow(currentShowId, show);
        console.log('Show updated:', currentShowId);
      } else {
        const id = await window.electronAPI.saveShow(show);
        console.log('Show saved with ID:', id);
        setCurrentShowId(id);
      }

      setShowSaveModal(false);
      await loadShows();
      alert('Show saved successfully!');
    } catch (err) {
      console.error('Error saving show:', err);
      alert('Error saving show: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLoadShow = async (showId: number) => {
    const show = await window.electronAPI.getShow(showId);
    if (show) {
      setSegments(show.segments);
      setShowName(show.name);
      setCurrentShowId(show.id!);
      setShowLoadModal(false);
    }
  };

  const handleUseTemplate = () => {
    if (confirm('Reset to default template? This will clear current lineup.')) {
      loadDefaultTemplate();
      setShowName('');
      setCurrentShowId(null);
    }
  };

  const handleSaveAsTemplate = async () => {
    const name = prompt('Enter template name:');
    if (name) {
      await window.electronAPI.saveShowTemplate(name, segments.map(seg => ({
        name: seg.name,
        duration: seg.duration,
        orderIndex: seg.orderIndex
      })));
      alert('Template saved as default!');
    }
  };

  return (
    <div className="show-builder-screen">
      <div className="builder-header">
        <div className="header-info">
          <h2>{showName || 'Untitled Show'}</h2>
          <div className="total-runtime">
            Total Runtime: {formatTime(getTotalDuration())} ({getTotalDuration()} min)
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleUseTemplate}>
            Use Default Template
          </button>
          <button className="btn-secondary" onClick={handleSaveAsTemplate}>
            Save as Template
          </button>
          <button className="btn-secondary" onClick={() => setShowLoadModal(true)}>
            Load Show
          </button>
          <button className="btn-primary" onClick={() => setShowSaveModal(true)}>
            Save Show
          </button>
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

          {segments.map((segment, index) => (
            <div key={index} className="segment-row">
              <div className="col-time">
                {formatTimeRange(segment.calculatedStartTime, segment.duration)}
              </div>
              <div className="col-segment">
                {editingSegment === index ? (
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) => handleUpdateSegment(index, { name: e.target.value })}
                    onBlur={() => setEditingSegment(null)}
                    autoFocus
                  />
                ) : (
                  <div>
                    <span onClick={() => setEditingSegment(index)}>{segment.name}</span>
                    {segment.audioFilePath && <span className="audio-indicator" title={segment.audioFilePath}> 🔊</span>}
                  </div>
                )}
              </div>
              <div className="col-duration">
                <input
                  type="number"
                  min="1"
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
                  title="Add/Edit Notes"
                >
                  📝
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleAddAudioToSegment(index)}
                  title="Add/Change Audio File"
                >
                  🎵
                </button>
                
                <select
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
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleMoveSegment(index, index + 1)}
                  disabled={index === segments.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="btn-danger btn-icon"
                  onClick={() => handleDeleteSegment(index)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="add-segment-area">
          <button className="btn-primary" onClick={handleAddSegment}>
            + Add Segment
          </button>
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Save Show</h2>
            <div className="form-group">
              <label>Show Name *</label>
              <input
                type="text"
                value={showName}
                onChange={(e) => setShowName(e.target.value)}
                autoFocus
                placeholder="Enter show name..."
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveShow}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Load Show</h2>
            <div className="shows-list">
              {shows.map(show => (
                <div
                  key={show.id}
                  className="show-item"
                  onClick={() => handleLoadShow(show.id!)}
                >
                  <div className="show-name">{show.name}</div>
                  <div className="show-info">
                    {formatTime(show.totalDuration)} • {new Date(show.createdDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowLoadModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingNotesIndex !== null && (
        <div className="modal-overlay" onClick={() => setEditingNotesIndex(null)}>
          <div className="modal notes-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Segment Notes</h2>
            <h3>{segments[editingNotesIndex]?.name}</h3>
            <p className="notes-help">Use this space for credits, talking points, or reminders for this segment</p>
            <textarea
              className="notes-textarea"
              value={segments[editingNotesIndex]?.notes || ''}
              onChange={(e) => handleUpdateSegment(editingNotesIndex, { notes: e.target.value })}
              placeholder="e.g., Credits: John Smith from Boston&#10;Mention: New show dates next weekend&#10;Setup: Introduce headliner's special achievement"
              rows={10}
              autoFocus
            />
            <div className="form-actions">
              <button className="btn-primary" onClick={() => setEditingNotesIndex(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShowBuilderScreen;
