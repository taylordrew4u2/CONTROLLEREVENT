import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LibraryScreen from './screens/LibraryScreen';
import ShowBuilderScreen from './screens/ShowBuilderScreen';
import LiveControllerScreen from './screens/LiveControllerScreen';
import SettingsScreen from './screens/SettingsScreen';
import ToastContainer from './components/Toast';
import './App.css';

function NavIcon({ type }: { type: 'library' | 'builder' | 'live' | 'settings' }) {
  const props = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'library':
      return <svg {...props} viewBox="0 0 22 22"><line x1="4" y1="6" x2="18" y2="6"/><line x1="4" y1="11" x2="18" y2="11"/><line x1="4" y1="16" x2="18" y2="16"/></svg>;
    case 'builder':
      return <svg {...props} viewBox="0 0 22 22"><rect x="3" y="3" width="6.5" height="6.5" rx="1.5"/><rect x="12.5" y="3" width="6.5" height="6.5" rx="1.5"/><rect x="3" y="12.5" width="6.5" height="6.5" rx="1.5"/><rect x="12.5" y="12.5" width="6.5" height="6.5" rx="1.5"/></svg>;
    case 'live':
      return <svg {...props} viewBox="0 0 22 22"><circle cx="11" cy="11" r="8"/><path d="M9 7L16 11L9 15Z" fill="currentColor" stroke="none"/></svg>;
    case 'settings':
      return <svg {...props} viewBox="0 0 22 22"><line x1="4" y1="7.5" x2="18" y2="7.5"/><circle cx="8" cy="7.5" r="2.5" fill="currentColor"/><line x1="4" y1="14.5" x2="18" y2="14.5"/><circle cx="14" cy="14.5" r="2.5" fill="currentColor"/></svg>;
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
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
