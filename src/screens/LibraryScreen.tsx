import React, { useState, useEffect } from 'react';
import { Comedian, Template } from '../types';
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

  useEffect(() => {
    loadComedians();
    loadTemplates();
  }, []);

  const loadComedians = async () => {
    const data = await window.electronAPI.getComedians();
    setComedians(data);
  };

  const loadTemplates = async () => {
    const data = await window.electronAPI.getTemplates();
    setTemplates(data);
  };

  const handleAddComedian = () => {
    setEditingComedian({ name: '', defaultDuration: 8 });
    setShowComedianModal(true);
  };

  const handleEditComedian = (comedian: Comedian) => {
    setEditingComedian(comedian);
    setShowComedianModal(true);
  };

  const handleSaveComedian = async (comedian: Comedian) => {
    if (comedian.id) {
      await window.electronAPI.updateComedian(comedian.id, comedian);
    } else {
      await window.electronAPI.addComedian(comedian);
    }
    setShowComedianModal(false);
    setEditingComedian(null);
    loadComedians();
  };

  const handleDeleteComedian = async (id: number) => {
    if (confirm('Delete this comedian?')) {
      await window.electronAPI.deleteComedian(id);
      loadComedians();
    }
  };

  const handleAddTemplate = () => {
    setEditingTemplate({ name: '', defaultDuration: 5, type: 'Custom' });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (template: Template) => {
    if (template.id) {
      await window.electronAPI.updateTemplate(template.id, template);
    } else {
      await window.electronAPI.addTemplate(template);
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Delete this template?')) {
      await window.electronAPI.deleteTemplate(id);
      loadTemplates();
    }
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
          <h2>Comedian Database</h2>
          <button className="btn-primary" onClick={handleAddComedian}>
            + Add Comedian
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search comedians..."
          value={searchComedian}
          onChange={(e) => setSearchComedian(e.target.value)}
          className="search-input"
        />

        <div className="items-list">
          {filteredComedians.map(comedian => (
            <div key={comedian.id} className="list-item">
              <div className="item-info">
                <div className="item-name">{comedian.name}</div>
                <div className="item-details">
                  Duration: {comedian.defaultDuration} min
                  {comedian.audioFilePath && ' • Has audio'}
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEditComedian(comedian)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteComedian(comedian.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="library-section">
        <div className="section-header">
          <h2>Segment Templates</h2>
          <button className="btn-primary" onClick={handleAddTemplate}>
            + Add Template
          </button>
        </div>

        <input
          type="text"
          placeholder="Search templates..."
          value={searchTemplate}
          onChange={(e) => setSearchTemplate(e.target.value)}
          className="search-input"
        />

        <div className="items-list">
          {filteredTemplates.map(template => (
            <div key={template.id} className="list-item">
              <div className="item-info">
                <div className="item-name">{template.name}</div>
                <div className="item-details">
                  Type: {template.type} • Duration: {template.defaultDuration} min
                  {template.audioFilePath && ' • Has audio'}
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEditTemplate(template)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteTemplate(template.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showComedianModal && editingComedian && (
        <ComedianModal
          comedian={editingComedian}
          onSave={handleSaveComedian}
          onClose={() => {
            setShowComedianModal(false);
            setEditingComedian(null);
          }}
        />
      )}

      {showTemplateModal && editingTemplate && (
        <TemplateModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
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

  const handlePickAudio = async () => {
    const filePath = await window.electronAPI.pickAudioFile();
    if (filePath) {
      setFormData({ ...formData, audioFilePath: filePath });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{comedian.id ? 'Edit Comedian' : 'Add Comedian'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Default Set Duration (minutes) *</label>
            <input
              type="number"
              min="1"
              value={formData.defaultDuration}
              onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Walk-on Audio</label>
            <div className="file-picker">
              <input
                type="text"
                value={formData.audioFilePath || ''}
                readOnly
                placeholder="No file selected"
              />
              <button type="button" className="btn-secondary" onClick={handlePickAudio}>
                Browse...
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TemplateModalProps {
  template: Template;
  onSave: (template: Template) => void;
  onClose: () => void;
}

function TemplateModal({ template, onSave, onClose }: TemplateModalProps) {
  const [formData, setFormData] = useState(template);

  const handlePickAudio = async () => {
    const filePath = await window.electronAPI.pickAudioFile();
    if (filePath) {
      setFormData({ ...formData, audioFilePath: filePath });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{template.id ? 'Edit Template' : 'Add Template'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              {TEMPLATE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Default Duration (minutes) *</label>
            <input
              type="number"
              min="1"
              value={formData.defaultDuration}
              onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Audio File</label>
            <div className="file-picker">
              <input
                type="text"
                value={formData.audioFilePath || ''}
                readOnly
                placeholder="No file selected"
              />
              <button type="button" className="btn-secondary" onClick={handlePickAudio}>
                Browse...
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LibraryScreen;
