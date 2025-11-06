import { useState } from 'react';
import './SettingsScreen.css';

interface Settings {
  audioVolume: number;
  audioOutput: string;
  autoAdvanceSegments: boolean;
  showWarnings: boolean;
  fadeOutDuration: number;
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

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('appSettings', JSON.stringify(updated));
    onSettingsChange(updated);
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
              <option value="speaker">Speaker</option>
              <option value="headphones">Headphones</option>
            </select>
            <p className="setting-help">Select where audio should play</p>
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
            <p><strong>Version:</strong> 1.0.3</p>
            <p><strong>Works Offline:</strong> Yes</p>
            <p><strong>Database:</strong> SQLite (Local)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
