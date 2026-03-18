import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LibraryScreen from './screens/LibraryScreen';
import ShowBuilderScreen from './screens/ShowBuilderScreen';
import LiveControllerScreen from './screens/LiveControllerScreen';
import SettingsScreen from './screens/SettingsScreen';
import './App.css';

function NavIcon({ type }: { type: 'library' | 'builder' | 'live' | 'settings' }) {
  const props = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'library':
      return <svg {...props} viewBox="0 0 18 18"><line x1="3" y1="4.5" x2="15" y2="4.5"/><line x1="3" y1="9" x2="15" y2="9"/><line x1="3" y1="13.5" x2="15" y2="13.5"/></svg>;
    case 'builder':
      return <svg {...props} viewBox="0 0 18 18"><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="10.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="10.5" width="5.5" height="5.5" rx="1"/><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1"/></svg>;
    case 'live':
      return <svg {...props} viewBox="0 0 18 18"><circle cx="9" cy="9" r="7"/><path d="M7.5 5.5L13 9L7.5 12.5Z" fill="currentColor" stroke="none"/></svg>;
    case 'settings':
      return <svg {...props} viewBox="0 0 18 18"><line x1="3" y1="6" x2="15" y2="6"/><circle cx="6.5" cy="6" r="2" fill="currentColor"/><line x1="3" y1="12" x2="15" y2="12"/><circle cx="11.5" cy="12" r="2" fill="currentColor"/></svg>;
  }
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <h1>P&N Controller</h1>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><NavIcon type="library" /></span>
              <span className="nav-label">Library</span>
            </NavLink>
            <NavLink to="/builder" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><NavIcon type="builder" /></span>
              <span className="nav-label">Builder</span>
            </NavLink>
            <NavLink to="/controller" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><NavIcon type="live" /></span>
              <span className="nav-label">Live</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><NavIcon type="settings" /></span>
              <span className="nav-label">Settings</span>
            </NavLink>
          </div>
        </nav>
        
        <div className="app-content">
          <Routes>
            <Route path="/" element={<LibraryScreen />} />
            <Route path="/builder" element={<ShowBuilderScreen />} />
            <Route path="/controller" element={<LiveControllerScreen />} />
            <Route path="/settings" element={<SettingsScreen onSettingsChange={() => {}} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
