import { useState, useEffect, useRef } from 'react';
import { Comedian, Template } from '../types';
import * as storage from '../storage';
import { saveAudioFile } from '../audioStorage';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import './LibraryScreen.css';

const TEMPLATE_TYPES = [
  'Host Intro',
  'Opening Act',
  'Host Transition',
  'Extended Host Bit',
  'Headliner Intro',
  'Headliner Set',
  'Show Close',
  'Custom'
];

function LibraryScreen() {
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchComedian, setSearchComedian] = useState('');
  const [searchTemplate, setSearchTemplate] = useState('');
  const [showComedianModal, setShowComedianModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingComedian, setEditingComedian] = useState<Comedian | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'comedian' | 'template'; id: number; name: string } | null>(null);

  useEffect(() => {
    loadComedians();
    loadTemplates();
  }, []);

  const loadComedians = () => setComedians(storage.getComedians());
  const loadTemplates = () => setTemplates(storage.getTemplates());

  const handleAddComedian = () => {
    setEditingComedian({ name: '', defaultDuration: 8 });
    setShowComedianModal(true);
  };

  const handleEditComedian = (comedian: Comedian) => {
    setEditingComedian(comedian);
    setShowComedianModal(true);
  };

  const handleSaveComedian = (comedian: Comedian) => {
    if (comedian.id) {
      storage.updateComedian(comedian.id, comedian);
      showToast('Comedian updated', 'success');
    } else {
      storage.addComedian(comedian);
      showToast('Comedian added', 'success');
    }
    setShowComedianModal(false);
    setEditingComedian(null);
    loadComedians();
  };

  const handleDeleteComedian = (id: number, name: string) => {
    setDeleteConfirm({ type: 'comedian', id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'comedian') {
      storage.deleteComedian(deleteConfirm.id);
      loadComedians();
      showToast('Comedian deleted', 'success');
    } else {
      storage.deleteTemplate(deleteConfirm.id);
      loadTemplates();
      showToast('Template deleted', 'success');
    }
    setDeleteConfirm(null);
  };

  const handleAddTemplate = () => {
    setEditingTemplate({ name: '', defaultDuration: 5, type: 'Custom' });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = (template: Template) => {
    if (template.id) {
      storage.updateTemplate(template.id, template);
      showToast('Template updated', 'success');
    } else {
      storage.addTemplate(template);
      showToast('Template added', 'success');
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleDeleteTemplate = (id: number, name: string) => {
    setDeleteConfirm({ type: 'template', id, name });
  };

  const filteredComedians = comedians.filter(c =>
    c.name.toLowerCase().includes(searchComedian.toLowerCase())
  );

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTemplate.toLowerCase())
  );

  return (
    <div className="library-screen">
      <div className="library-section">
        <div className="section-header">
          <h2>Comedians</h2>
          <button className="btn-primary" onClick={handleAddComedian}>Add Comedian</button>
        </div>

        <input
          type="text"
          placeholder="Search comedians..."
          value={searchComedian}
          onChange={(e) => setSearchComedian(e.target.value)}
          className="search-input"
        />

        <div className="items-list">
          {filteredComedians.length === 0 ? (
            <EmptyState
              message={comedians.length === 0 ? 'No comedians added yet' : 'No results match your search'}
              hint={comedians.length === 0 ? 'Tap "Add Comedian" to get started.' : undefined}
            />
          ) : (
            filteredComedians.map(comedian => (
              <div key={comedian.id} className="list-item">
                <div className="item-info">
                  <div className="item-name">{comedian.name}</div>
                  <div className="item-details">
                    {comedian.defaultDuration} min set
                    {comedian.walkOnAudioName && ` · Walk-on: ${comedian.walkOnAudioName}`}
                    {comedian.walkOffAudioName && ` · Walk-off: ${comedian.walkOffAudioName}`}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-secondary" onClick={() => handleEditComedian(comedian)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDeleteComedian(comedian.id!, comedian.name)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="library-section">
        <div className="section-header">
          <h2>Segment Templates</h2>
          <button className="btn-primary" onClick={handleAddTemplate}>Add Template</button>
        </div>

        <input
          type="text"
          placeholder="Search templates..."
          value={searchTemplate}
          onChange={(e) => setSearchTemplate(e.target.value)}
          className="search-input"
        />

        <div className="items-list">
          {filteredTemplates.length === 0 ? (
            <EmptyState
              message={templates.length === 0 ? 'No templates added yet' : 'No results match your search'}
              hint={templates.length === 0 ? 'Tap "Add Template" to get started.' : undefined}
            />
          ) : (
            filteredTemplates.map(template => (
              <div key={template.id} className="list-item">
                <div className="item-info">
                  <div className="item-name">{template.name}</div>
                  <div className="item-details">
                    {template.type} · {template.defaultDuration} min
                    {template.audioFilePath && ' · Audio attached'}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-secondary" onClick={() => handleEditTemplate(template)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDeleteTemplate(template.id!, template.name)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showComedianModal && editingComedian && (
        <ComedianModal
          comedian={editingComedian}
          onSave={handleSaveComedian}
          onClose={() => { setShowComedianModal(false); setEditingComedian(null); }}
        />
      )}

      {showTemplateModal && editingTemplate && (
        <TemplateModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete ${deleteConfirm.type === 'comedian' ? 'Comedian' : 'Template'}?`}
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

interface ComedianModalProps {
  comedian: Comedian;
  onSave: (comedian: Comedian) => void;
  onClose: () => void;
}

function ComedianModal({ comedian, onSave, onClose }: ComedianModalProps) {
  const [formData, setFormData] = useState(comedian);
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
    } catch (err) {
      console.error('Audio processing error:', err);
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
    <Modal title={comedian.id ? 'Edit Comedian' : 'Add Comedian'} onClose={onClose}>
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
            value={formData.defaultDuration}
            onChange={(e) => { setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 0 }); setErrors(prev => ({ ...prev, duration: '' })); }}
            className={errors.duration ? 'input-error' : ''}
          />
          {errors.duration && <span className="field-error">{errors.duration}</span>}
          <span className="field-hint">How many minutes this comedian typically performs</span>
        </div>

        <div className="form-group">
          <label>Walk-On Music</label>
          <div className="audio-picker">
            <input
              ref={walkOnRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
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
          <span className="field-hint">Plays automatically when this comedian takes the stage</span>
        </div>

        <div className="form-group">
          <label>Walk-Off Music</label>
          <div className="audio-picker">
            <input
              ref={walkOffRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
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
          <span className="field-hint">Plays automatically when this comedian leaves the stage</span>
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

interface TemplateModalProps {
  template: Template;
  onSave: (template: Template) => void;
  onClose: () => void;
}

function TemplateModal({ template, onSave, onClose }: TemplateModalProps) {
  const [formData, setFormData] = useState(template);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.defaultDuration || formData.defaultDuration < 1) e.duration = 'Duration must be at least 1 minute';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Modal title={template.id ? 'Edit Template' : 'Add Template'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder="e.g. Host Intro"
            autoFocus
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            {TEMPLATE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <span className="field-hint">What kind of segment this is</span>
        </div>

        <div className="form-group">
          <label>Default Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={formData.defaultDuration}
            onChange={(e) => { setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 0 }); setErrors(prev => ({ ...prev, duration: '' })); }}
            className={errors.duration ? 'input-error' : ''}
          />
          {errors.duration && <span className="field-error">{errors.duration}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default LibraryScreen;
