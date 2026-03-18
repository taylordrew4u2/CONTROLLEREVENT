import { useState, useEffect } from 'react';
import { Comedian, Template } from '../types';
import * as storage from '../storage';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
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
    } else {
      storage.addComedian(comedian);
    }
    setShowComedianModal(false);
    setEditingComedian(null);
    loadComedians();
  };

  const handleDeleteComedian = (id: number) => {
    if (confirm('Delete this comedian?')) {
      storage.deleteComedian(id);
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

  const handleSaveTemplate = (template: Template) => {
    if (template.id) {
      storage.updateTemplate(template.id, template);
    } else {
      storage.addTemplate(template);
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Delete this template?')) {
      storage.deleteTemplate(id);
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
                    {comedian.audioFilePath && ' · Audio attached'}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-secondary" onClick={() => handleEditComedian(comedian)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDeleteComedian(comedian.id!)}>Delete</button>
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
                  <button className="btn-danger" onClick={() => handleDeleteTemplate(template.id!)}>Delete</button>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Default Set Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={formData.defaultDuration}
            onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Type</label>
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
          <label>Default Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={formData.defaultDuration}
            onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
            required
          />
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
