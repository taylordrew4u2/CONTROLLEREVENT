import { useState, useEffect, useRef } from 'react';
import { Performer } from '../types';
import * as storage from '../storage';
import { saveAudioFile } from '../audioStorage';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import './LibraryScreen.css';

function LibraryScreen() {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Performer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => { loadPerformers(); }, []);

  const loadPerformers = () => setPerformers(storage.getPerformers());

  const handleAdd = () => {
    setEditing({ name: '', defaultDuration: 8 });
    setShowModal(true);
  };

  const handleEdit = (p: Performer) => {
    setEditing(p);
    setShowModal(true);
  };

  const handleSave = (p: Performer) => {
    if (p.id) {
      storage.updatePerformer(p.id, p);
      showToast('Performer updated', 'success');
    } else {
      storage.addPerformer(p);
      showToast('Performer added', 'success');
    }
    setShowModal(false);
    setEditing(null);
    loadPerformers();
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    storage.deletePerformer(deleteConfirm.id);
    loadPerformers();
    showToast('Performer deleted', 'success');
    setDeleteConfirm(null);
  };

  const filtered = performers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="library-screen">
      <div className="library-section">
        <div className="section-header">
          <h2>Performers</h2>
          <button className="btn-primary" onClick={handleAdd}>Add Performer</button>
        </div>

        <input
          type="text"
          placeholder="Search performers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <div className="items-list">
          {filtered.length === 0 ? (
            <EmptyState
              message={performers.length === 0 ? 'No performers added yet' : 'No results match your search'}
              hint={performers.length === 0 ? 'Tap "Add Performer" to get started.' : undefined}
            />
          ) : (
            filtered.map(p => (
              <div key={p.id} className="list-item">
                <div className="item-info">
                  <div className="item-name">{p.name}</div>
                  <div className="item-details">
                    {p.defaultDuration} min set
                    {p.walkOnAudioName && ` · Walk-on: ${p.walkOnAudioName}`}
                    {p.walkOffAudioName && ` · Walk-off: ${p.walkOffAudioName}`}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-secondary" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(p.id!, p.name)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && editing && (
        <PerformerModal
          performer={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Performer?"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

interface PerformerModalProps {
  performer: Performer;
  onSave: (performer: Performer) => void;
  onClose: () => void;
}

function PerformerModal({ performer, onSave, onClose }: PerformerModalProps) {
  const [formData, setFormData] = useState(performer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const walkOnRef = useRef<HTMLInputElement>(null);
  const walkOffRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.defaultDuration || formData.defaultDuration < 1) e.duration = 'Duration must be at least 1 minute';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAudioFile = async (file: File, type: 'walkOn' | 'walkOff') => {
    const label = type === 'walkOn' ? 'Walk-on' : 'Walk-off';
    setProcessing(`Processing ${label} audio with fades...`);
    try {
      const { id, name } = await saveAudioFile(file);
      if (type === 'walkOn') {
        setFormData(prev => ({ ...prev, walkOnAudioId: id, walkOnAudioName: name }));
      } else {
        setFormData(prev => ({ ...prev, walkOffAudioId: id, walkOffAudioName: name }));
      }
      showToast(`${label} audio saved with fades applied`, 'success');
    } catch {
      showToast('Failed to process audio file', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={performer.id ? 'Edit Performer' : 'Add Performer'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder="e.g. John Smith"
            autoFocus
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Default Set Duration (minutes)</label>
          <input
            type="number"
            min="1"
            title="Default set duration in minutes"
            value={formData.defaultDuration}
            onChange={(e) => { setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 0 }); setErrors(prev => ({ ...prev, duration: '' })); }}
            className={errors.duration ? 'input-error' : ''}
          />
          {errors.duration && <span className="field-error">{errors.duration}</span>}
          <span className="field-hint">How many minutes this performer typically performs</span>
        </div>

        <div className="form-group">
          <label>Walk-On Music</label>
          <div className="audio-picker">
            <input
              ref={walkOnRef}
              type="file"
              accept="audio/*"
              title="Choose walk-on music file"
              className="hidden-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAudioFile(file, 'walkOn');
              }}
            />
            <button type="button" className="btn-secondary" onClick={() => walkOnRef.current?.click()}>
              {formData.walkOnAudioName ? 'Change File' : 'Choose File'}
            </button>
            {formData.walkOnAudioName && (
              <span className="audio-file-name">{formData.walkOnAudioName}</span>
            )}
          </div>
          <span className="field-hint">Plays when this performer takes the stage</span>
        </div>

        <div className="form-group">
          <label>Walk-Off Music</label>
          <div className="audio-picker">
            <input
              ref={walkOffRef}
              type="file"
              accept="audio/*"
              title="Choose walk-off music file"
              className="hidden-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAudioFile(file, 'walkOff');
              }}
            />
            <button type="button" className="btn-secondary" onClick={() => walkOffRef.current?.click()}>
              {formData.walkOffAudioName ? 'Change File' : 'Choose File'}
            </button>
            {formData.walkOffAudioName && (
              <span className="audio-file-name">{formData.walkOffAudioName}</span>
            )}
          </div>
          <span className="field-hint">Plays when this performer leaves the stage</span>
        </div>

        {processing && (
          <div className="audio-processing-banner">{processing}</div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={!!processing}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving || !!processing}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default LibraryScreen;
