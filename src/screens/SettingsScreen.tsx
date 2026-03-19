import { useState, useEffect, useRef } from 'react';
import { exportAllData, importAllData } from '../storage';
import { showToast } from '../components/Toast';
import './SettingsScreen.css';

interface Settings {
  audioVolume: number;
  audioOutput: string;
  autoAdvanceSegments: boolean;
  showWarnings: boolean;
  fadeOutDuration: number;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface SettingsScreenProps {
  onSettingsChange: (settings: Settings) => void;
}

function SettingsScreen({ onSettingsChange }: SettingsScreenProps) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      audioVolume: 0.8,
      audioOutput: 'default',
      autoAdvanceSegments: true,
      showWarnings: true,
      fadeOutDuration: 2
    };
  });

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `show-controller-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importAllData(ev.target?.result as string);
        showToast('Data imported — reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    // Get available audio output devices
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setAudioDevices(audioOutputs);
      } catch (err) {
        console.error('Error getting audio devices:', err);
        // Fallback devices if enumeration fails
        setAudioDevices([
          { deviceId: 'default', label: 'System Default', kind: 'audiooutput' },
          { deviceId: 'speaker', label: 'Speaker', kind: 'audiooutput' },
          { deviceId: 'headphones', label: 'Headphones', kind: 'audiooutput' }
        ]);
      }
    };

    getAudioDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('appSettings', JSON.stringify(updated));
    onSettingsChange(updated);
  };

  const testAudio = () => {
    console.log('Testing audio with volume:', settings.audioVolume);
    
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = settings.audioVolume;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      console.log('Test audio played');
    }, 500);
  };

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <h1>Settings</h1>
        
        <div className="settings-section">
          <h2>Audio Settings</h2>
          
          <div className="setting-item">
            <label>Master Volume</label>
            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                title="Master volume"
                value={settings.audioVolume}
                onChange={(e) => handleSettingChange('audioVolume', parseFloat(e.target.value))}
              />
              <span className="volume-value">{Math.round(settings.audioVolume * 100)}%</span>
            </div>
          </div>

          <div className="setting-item">
            <label>Fade-Out Duration (seconds)</label>
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.5"
              title="Fade-out duration in seconds"
              value={settings.fadeOutDuration}
              onChange={(e) => handleSettingChange('fadeOutDuration', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>Audio Output Device</label>
            <select
              title="Audio output device"
              value={settings.audioOutput}
              onChange={(e) => handleSettingChange('audioOutput', e.target.value)}
            >
              <option value="default">System Default</option>
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Audio Device ${device.deviceId}`}
                </option>
              ))}
            </select>
            <div className="audio-device-controls">
              <button className="btn-secondary" onClick={testAudio}>
                Test Audio
              </button>
            </div>
            <p className="setting-help">Select where audio should play. Click "Test Audio" to verify output.</p>
          </div>
        </div>

        <div className="settings-section">
          <h2>Show Behavior</h2>
          
          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="auto-advance"
              checked={settings.autoAdvanceSegments}
              onChange={(e) => handleSettingChange('autoAdvanceSegments', e.target.checked)}
            />
            <label htmlFor="auto-advance">Auto-advance to next segment</label>
            <p className="setting-help">Automatically move to the next segment when time expires</p>
          </div>

          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="show-warnings"
              checked={settings.showWarnings}
              onChange={(e) => handleSettingChange('showWarnings', e.target.checked)}
            />
            <label htmlFor="show-warnings">Show 30-second warnings</label>
            <p className="setting-help">Vibrate when 30 seconds remain in current segment</p>
          </div>
        </div>

        <div className="settings-section">
          <h2>Backup & Restore</h2>
          <p className="setting-help backup-help">Export your data to a file so you never lose it. Import to restore on this or another device.</p>
          <div className="backup-actions">
            <button className="btn-primary" onClick={handleExport}>Export Data</button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import Data</button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              title="Import backup file"
              className="file-input-hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Download Desktop App</h2>
          <p className="setting-help backup-help">
            Get the desktop version for your computer. Not sure which one? 
            {navigator.userAgent.includes('Mac') ? ' You\'re on a Mac — grab the macOS download.' : navigator.userAgent.includes('Win') ? ' You\'re on Windows — grab the Windows download.' : ' Pick the one that matches your computer.'}
          </p>

          <div className="download-options">
            <div className={`download-card${navigator.userAgent.includes('Win') ? ' download-recommended' : ''}`}>
              {navigator.userAgent.includes('Win') && <span className="download-badge">Recommended for you</span>}
              <a
                href="https://github.com/taylordrew4u2/CONTROLLEREVENT/releases/latest/download/Pins-Needles-Controller-Setup.exe"
                className="btn-download"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="download-icon">🪟</span>
                <span>
                  <strong>Download for Windows</strong>
                  <small>.exe installer — works on Windows 10 &amp; 11</small>
                </span>
              </a>
              <ol className="install-steps">
                <li>Click the button above to download the <code>.exe</code> file</li>
                <li>Open the downloaded file and click <strong>"Install"</strong></li>
                <li>The app will open automatically — a desktop shortcut is created too</li>
              </ol>
            </div>

            <div className={`download-card${navigator.userAgent.includes('Mac') ? ' download-recommended' : ''}`}>
              {navigator.userAgent.includes('Mac') && <span className="download-badge">Recommended for you</span>}
              <a
                href="https://github.com/taylordrew4u2/CONTROLLEREVENT/releases/latest/download/Pins-Needles-Controller.dmg"
                className="btn-download"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="download-icon">🍎</span>
                <span>
                  <strong>Download for Mac</strong>
                  <small>.dmg installer — works on macOS 11+</small>
                </span>
              </a>
              <ol className="install-steps">
                <li>Click the button above to download the <code>.dmg</code> file</li>
                <li>Open it and drag the app icon into your <strong>Applications</strong> folder</li>
                <li>First launch: right-click the app → <strong>"Open"</strong> → click <strong>"Open"</strong> again</li>
              </ol>
            </div>

            <details className="download-more">
              <summary>Other download options</summary>
              <a
                href="https://github.com/taylordrew4u2/CONTROLLEREVENT/releases/latest"
                className="btn-download btn-download-alt"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="download-icon">📦</span>
                <span>
                  <strong>All Downloads &amp; Older Versions</strong>
                  <small>Portable builds, zip files, and past releases</small>
                </span>
              </a>
            </details>
          </div>
        </div>

        <div className="settings-section">
          <h2>Application Info</h2>
          <div className="info-item">
            <p><strong>Version:</strong> 2.0.0</p>
            <p><strong>Works Offline:</strong> Yes (PWA)</p>
            <p><strong>Storage:</strong> Local (persistent)</p>
            <p><strong>Data Protection:</strong> Persistent storage requested — browser won't auto-delete your data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
