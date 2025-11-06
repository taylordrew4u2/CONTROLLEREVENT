42
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function createDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'showcontroller.db');
  
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS comedians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      audio_file_path TEXT,
      default_duration INTEGER NOT NULL DEFAULT 8
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      audio_file_path TEXT,
      default_duration INTEGER NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS show_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS show_template_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_template_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      segment_type TEXT,
      FOREIGN KEY (show_template_id) REFERENCES show_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_date TEXT NOT NULL,
      total_duration INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      audio_file_path TEXT,
      order_index INTEGER NOT NULL,
      calculated_start_time INTEGER NOT NULL,
      comedian_id INTEGER,
      template_id INTEGER,
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
      FOREIGN KEY (comedian_id) REFERENCES comedians(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_segments_show_id ON segments(show_id);
    CREATE INDEX IF NOT EXISTS idx_show_template_segments_template_id ON show_template_segments(show_template_id);
  `);

  // Insert default show template if it doesn't exist
  const defaultTemplate = db.prepare('SELECT id FROM show_templates WHERE is_default = 1').get();
  if (!defaultTemplate) {
    const insertTemplate = db.prepare('INSERT INTO show_templates (name, is_default, created_date) VALUES (?, 1, ?)');
    const result = insertTemplate.run('Default Show Template', new Date().toISOString());
    const templateId = result.lastInsertRowid;

    const defaultSegments = [
      { name: 'Show open + host intro', duration: 5, order: 0, type: 'Host Intro' },
      { name: 'Opening Act 1', duration: 8, order: 1, type: 'Opening Act' },
      { name: 'Host transition', duration: 1, order: 2, type: 'Host Transition' },
      { name: 'Opening Act 2', duration: 8, order: 3, type: 'Opening Act' },
      { name: 'Host transition', duration: 1, order: 4, type: 'Host Transition' },
      { name: 'Opening Act 3', duration: 8, order: 5, type: 'Opening Act' },
      { name: 'Extended host bit/segment', duration: 11, order: 6, type: 'Extended Host Bit' },
      { name: 'Headliner intro', duration: 1, order: 7, type: 'Headliner Intro' },
      { name: 'Headliner set', duration: 15, order: 8, type: 'Headliner Set' },
      { name: 'Show close/announcements', duration: 2, order: 9, type: 'Show Close' }
    ];

    const insertSegment = db.prepare(
      'INSERT INTO show_template_segments (show_template_id, name, duration, order_index, segment_type) VALUES (?, ?, ?, ?, ?)'
    );

    for (const seg of defaultSegments) {
      insertSegment.run(templateId, seg.name, seg.duration, seg.order, seg.type);
    }
  }

  return db;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for database operations

// Comedians
ipcMain.handle('get-comedians', () => {
  return db.prepare('SELECT * FROM comedians ORDER BY name').all();
});

ipcMain.handle('add-comedian', (event, comedian) => {
  const stmt = db.prepare('INSERT INTO comedians (name, audio_file_path, default_duration) VALUES (?, ?, ?)');
  const result = stmt.run(comedian.name, comedian.audioFilePath, comedian.defaultDuration);
  return { id: result.lastInsertRowid, ...comedian };
});

ipcMain.handle('update-comedian', (event, id, comedian) => {
  const stmt = db.prepare('UPDATE comedians SET name = ?, audio_file_path = ?, default_duration = ? WHERE id = ?');
  stmt.run(comedian.name, comedian.audioFilePath, comedian.defaultDuration, id);
  return { id, ...comedian };
});

ipcMain.handle('delete-comedian', (event, id) => {
  db.prepare('DELETE FROM comedians WHERE id = ?').run(id);
  return true;
});

// Templates
ipcMain.handle('get-templates', () => {
  return db.prepare('SELECT * FROM templates ORDER BY name').all();
});

ipcMain.handle('add-template', (event, template) => {
  const stmt = db.prepare('INSERT INTO templates (name, audio_file_path, default_duration, type) VALUES (?, ?, ?, ?)');
  const result = stmt.run(template.name, template.audioFilePath, template.defaultDuration, template.type);
  return { id: result.lastInsertRowid, ...template };
});

ipcMain.handle('update-template', (event, id, template) => {
  const stmt = db.prepare('UPDATE templates SET name = ?, audio_file_path = ?, default_duration = ?, type = ? WHERE id = ?');
  stmt.run(template.name, template.audioFilePath, template.defaultDuration, template.type, id);
  return { id, ...template };
});

ipcMain.handle('delete-template', (event, id) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return true;
});

// Show Templates
ipcMain.handle('get-default-show-template', () => {
  const template = db.prepare('SELECT * FROM show_templates WHERE is_default = 1').get();
  if (!template) return null;
  
  const segments = db.prepare('SELECT * FROM show_template_segments WHERE show_template_id = ? ORDER BY order_index').all(template.id);
  return { ...template, segments };
});

ipcMain.handle('save-show-template', (event, name, segments) => {
  const transaction = db.transaction(() => {
    // Set all templates to not default
    db.prepare('UPDATE show_templates SET is_default = 0').run();
    
    // Create new template
    const stmt = db.prepare('INSERT INTO show_templates (name, is_default, created_date) VALUES (?, 1, ?)');
    const result = stmt.run(name, new Date().toISOString());
    const templateId = result.lastInsertRowid;
    
    // Insert segments
    const insertSegment = db.prepare(
      'INSERT INTO show_template_segments (show_template_id, name, duration, order_index, segment_type) VALUES (?, ?, ?, ?, ?)'
    );
    
    segments.forEach((seg, index) => {
      insertSegment.run(templateId, seg.name, seg.duration, index, seg.segmentType || '');
    });
    
    return templateId;
  });
  
  return transaction();
});

// Shows
ipcMain.handle('get-shows', () => {
  return db.prepare('SELECT * FROM shows ORDER BY created_date DESC').all();
});

ipcMain.handle('get-show', (event, id) => {
  const show = db.prepare('SELECT * FROM shows WHERE id = ?').get(id);
  if (!show) return null;
  
  const segments = db.prepare('SELECT * FROM segments WHERE show_id = ? ORDER BY order_index').all(id);
  return { ...show, segments };
});

ipcMain.handle('save-show', (event, show) => {
  const transaction = db.transaction(() => {
    const stmt = db.prepare('INSERT INTO shows (name, created_date, total_duration) VALUES (?, ?, ?)');
    const result = stmt.run(show.name, new Date().toISOString(), show.totalDuration);
    const showId = result.lastInsertRowid;
    
    const insertSegment = db.prepare(
      'INSERT INTO segments (show_id, name, duration, audio_file_path, order_index, calculated_start_time, comedian_id, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    show.segments.forEach((seg, index) => {
      insertSegment.run(
        showId,
        seg.name,
        seg.duration,
        seg.audioFilePath,
        index,
        seg.calculatedStartTime,
        seg.comedianId || null,
        seg.templateId || null
      );
    });
    
    return showId;
  });
  
  return transaction();
});

ipcMain.handle('update-show', (event, id, show) => {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE shows SET name = ?, total_duration = ? WHERE id = ?').run(show.name, show.totalDuration, id);
    db.prepare('DELETE FROM segments WHERE show_id = ?').run(id);
    
    const insertSegment = db.prepare(
      'INSERT INTO segments (show_id, name, duration, audio_file_path, order_index, calculated_start_time, comedian_id, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    show.segments.forEach((seg, index) => {
      insertSegment.run(
        id,
        seg.name,
        seg.duration,
        seg.audioFilePath,
        index,
        seg.calculatedStartTime,
        seg.comedianId || null,
        seg.templateId || null
      );
    });
    
    return id;
  });
  
  return transaction();
});

ipcMain.handle('delete-show', (event, id) => {
  db.prepare('DELETE FROM shows WHERE id = ?').run(id);
  return true;
});

// File picker
ipcMain.handle('pick-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
    ]
  });
  
  if (result.canceled) return null;
  return result.filePaths[0];
});
