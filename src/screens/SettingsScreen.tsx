import { useState, useEffect } from 'react';
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
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.volume = settings.audioVolume;
    if (settings.audioOutput && settings.audioOutput !== 'default') {
      (audio as any).setSinkId?.(settings.audioOutput);
    }
    audio.play().catch(err => console.error('Test audio failed:', err));
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
              value={settings.fadeOutDuration}
              onChange={(e) => handleSettingChange('fadeOutDuration', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>Audio Output Device</label>
            <select
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
                🔊 Test Audio
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
          <h2>Application Info</h2>
          <div className="info-item">
            <p><strong>Version:</strong> 1.0.4</p>
            <p><strong>Works Offline:</strong> Yes</p>
            <p><strong>Database:</strong> SQLite (Local)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
