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
  audioFadeInDuration: number;
  audioFadeOutDuration: number;
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
    if (saved) {
      try {
        return { ...{
          audioVolume: 0.8,
          audioOutput: 'default',
          autoAdvanceSegments: true,
          showWarnings: true,
          fadeOutDuration: 2,
          audioFadeInDuration: 2,
          audioFadeOutDuration: 3
        }, ...JSON.parse(saved) };
      } catch {
        /* corrupted settings — use defaults */
      }
    }
    return {
      audioVolume: 0.8,
      audioOutput: 'default',
      autoAdvanceSegments: true,
      showWarnings: true,
      fadeOutDuration: 2,
      audioFadeInDuration: 2,
      audioFadeOutDuration: 3
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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440;
    gainNode.gain.value = settings.audioVolume;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 500);
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
            <label>Audio File Fade-In (seconds)</label>
            <div className="volume-control">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                title="Fade-in duration baked into uploaded audio files"
                value={settings.audioFadeInDuration}
                onChange={(e) => handleSettingChange('audioFadeInDuration', parseFloat(e.target.value))}
              />
              <span className="volume-value">{settings.audioFadeInDuration}s</span>
            </div>
            <p className="setting-help">Smooth fade-in baked into every uploaded audio file. Adjust before uploading new files.</p>
          </div>

          <div className="setting-item">
            <label>Audio File Fade-Out (seconds)</label>
            <div className="volume-control">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                title="Fade-out duration baked into uploaded audio files"
                value={settings.audioFadeOutDuration}
                onChange={(e) => handleSettingChange('audioFadeOutDuration', parseFloat(e.target.value))}
              />
              <span className="volume-value">{settings.audioFadeOutDuration}s</span>
            </div>
            <p className="setting-help">Smooth fade-out baked into every uploaded audio file. Adjust before uploading new files.</p>
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
            <label htmlFor="auto-advance">Auto-advance to next performer</label>
            <p className="setting-help">Automatically move to the next performer when time expires</p>
          </div>

          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="show-warnings"
              checked={settings.showWarnings}
              onChange={(e) => handleSettingChange('showWarnings', e.target.checked)}
            />
            <label htmlFor="show-warnings">Show 30-second warnings</label>
            <p className="setting-help">Vibrate when 30 seconds remain for current performer</p>
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
          <h2>Application Info</h2>
          <div className="info-item">
            <p><strong>Version:</strong> 2.1.0</p>
            <p><strong>Storage:</strong> Local (persistent)</p>
            <p><strong>Data Protection:</strong> Persistent storage requested — your data won't be auto-deleted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
