42
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { URL } = require('url');

// Register protocol before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-audio',
    privileges: {
      bypassCSP: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: false,
      secure: true
    }
  }
]);

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
      notes TEXT,
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
      FOREIGN KEY (comedian_id) REFERENCES comedians(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_segments_show_id ON segments(show_id);
    CREATE INDEX IF NOT EXISTS idx_show_template_segments_template_id ON show_template_segments(show_template_id);
  `);

  // Add notes column if it doesn't exist (migration for existing databases)
  try {
    db.exec('ALTER TABLE segments ADD COLUMN notes TEXT');
    console.log('Added notes column to segments table');
  } catch (err) {
    // Column already exists or error - ignore
    console.log('Notes column already exists or error:', err.message);
  }

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
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Disable for local protocol access
      allowRunningInsecureContent: false
    }
  });

  // Allow audio autoplay
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      console.log('Renderer loaded, audio system ready');
    `);
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Register local-audio protocol handler with stream support
  protocol.handle('local-audio', async (request) => {
    try {
      const url = request.url;
      const filePath = decodeURIComponent(url.replace('local-audio://', ''));
      
      console.log('Loading audio file:', filePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('Audio file not found:', filePath);
        return new Response('File not found', { status: 404 });
      }
      
      // Read file and return as response with proper headers
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Determine MIME type
      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac'
      };
      
      const mimeType = mimeTypes[ext] || 'audio/mpeg';
      
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': data.length.toString(),
          'Accept-Ranges': 'bytes'
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      return new Response('Error loading audio', { status: 500 });
    }
  });

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
  const comedians = db.prepare('SELECT * FROM comedians ORDER BY name').all();
  // Map snake_case database fields to camelCase for React
  return comedians.map(c => ({
    id: c.id,
    name: c.name,
    audioFilePath: c.audio_file_path,
    defaultDuration: c.default_duration
  }));
});

ipcMain.handle('add-comedian', (event, comedian) => {
  console.log('Adding comedian:', comedian);
  const stmt = db.prepare('INSERT INTO comedians (name, audio_file_path, default_duration) VALUES (?, ?, ?)');
  const result = stmt.run(comedian.name, comedian.audioFilePath || null, comedian.defaultDuration);
  console.log('Comedian added with ID:', result.lastInsertRowid);
  return { id: result.lastInsertRowid, ...comedian };
});

ipcMain.handle('update-comedian', (event, id, comedian) => {
  console.log('Updating comedian:', id, comedian);
  const stmt = db.prepare('UPDATE comedians SET name = ?, audio_file_path = ?, default_duration = ? WHERE id = ?');
  stmt.run(comedian.name, comedian.audioFilePath || null, comedian.defaultDuration, id);
  console.log('Comedian updated');
  return { id, ...comedian };
});

ipcMain.handle('delete-comedian', (event, id) => {
  db.prepare('DELETE FROM comedians WHERE id = ?').run(id);
  return true;
});

// Templates
ipcMain.handle('get-templates', () => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY name').all();
  // Map snake_case database fields to camelCase for React
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    audioFilePath: t.audio_file_path,
    defaultDuration: t.default_duration,
    type: t.type
  }));
});

ipcMain.handle('add-template', (event, template) => {
  console.log('Adding template:', template);
  const stmt = db.prepare('INSERT INTO templates (name, audio_file_path, default_duration, type) VALUES (?, ?, ?, ?)');
  const result = stmt.run(template.name, template.audioFilePath || null, template.defaultDuration, template.type);
  console.log('Template added with ID:', result.lastInsertRowid);
  return { id: result.lastInsertRowid, ...template };
});

ipcMain.handle('update-template', (event, id, template) => {
  console.log('Updating template:', id, template);
  const stmt = db.prepare('UPDATE templates SET name = ?, audio_file_path = ?, default_duration = ?, type = ? WHERE id = ?');
  stmt.run(template.name, template.audioFilePath || null, template.defaultDuration, template.type, id);
  console.log('Template updated');
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
  const shows = db.prepare('SELECT * FROM shows ORDER BY created_date DESC').all();
  return shows.map(show => ({
    ...show,
    createdDate: show.created_date,
    totalDuration: show.total_duration
  }));
});

ipcMain.handle('get-show', (event, id) => {
  const show = db.prepare('SELECT * FROM shows WHERE id = ?').get(id);
  if (!show) return null;
  
  const segments = db.prepare('SELECT * FROM segments WHERE show_id = ? ORDER BY order_index').all(id);
  
  // Map snake_case database fields to camelCase for React
  const mappedSegments = segments.map(seg => ({
    id: seg.id,
    name: seg.name,
    duration: seg.duration,
    audioFilePath: seg.audio_file_path,
    orderIndex: seg.order_index,
    calculatedStartTime: seg.calculated_start_time,
    comedianId: seg.comedian_id,
    templateId: seg.template_id,
    showId: seg.show_id,
    notes: seg.notes
  }));
  
  return {
    ...show,
    createdDate: show.created_date,
    totalDuration: show.total_duration,
    segments: mappedSegments
  };
});

ipcMain.handle('save-show', (event, show) => {
  try {
    console.log('Saving show:', show);
    
    // Ensure totalDuration is a valid number
    const totalDuration = show.totalDuration || 0;
    
    const transaction = db.transaction(() => {
      const stmt = db.prepare('INSERT INTO shows (name, created_date, total_duration) VALUES (?, ?, ?)');
      const result = stmt.run(show.name, new Date().toISOString(), totalDuration);
      const showId = result.lastInsertRowid;
      
      const insertSegment = db.prepare(
        'INSERT INTO segments (show_id, name, duration, audio_file_path, order_index, calculated_start_time, comedian_id, template_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      
      show.segments.forEach((seg, index) => {
        insertSegment.run(
          showId,
          seg.name || '',
          seg.duration || 1,
          seg.audioFilePath || null,
          index,
          seg.calculatedStartTime || 0,
          seg.comedianId || null,
          seg.templateId || null,
          seg.notes || null
        );
      });
      
      return showId;
    });
    
    return transaction();
  } catch (err) {
    console.error('Error saving show:', err);
    throw err;
  }
});

ipcMain.handle('update-show', (event, id, show) => {
  try {
    console.log('Updating show:', id, show);
    
    // Ensure totalDuration is a valid number
    const totalDuration = show.totalDuration || 0;
    
    const transaction = db.transaction(() => {
      db.prepare('UPDATE shows SET name = ?, total_duration = ? WHERE id = ?').run(show.name, totalDuration, id);
      db.prepare('DELETE FROM segments WHERE show_id = ?').run(id);
      
      const insertSegment = db.prepare(
        'INSERT INTO segments (show_id, name, duration, audio_file_path, order_index, calculated_start_time, comedian_id, template_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      
      show.segments.forEach((seg, index) => {
        insertSegment.run(
          id,
          seg.name || '',
          seg.duration || 1,
          seg.audioFilePath || null,
          index,
          seg.calculatedStartTime || 0,
          seg.comedianId || null,
          seg.templateId || null,
          seg.notes || null
        );
      });
      
      return id;
    });
    
    return transaction();
  } catch (err) {
    console.error('Error updating show:', err);
    throw err;
  }
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
