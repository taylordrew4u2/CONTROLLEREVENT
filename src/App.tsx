import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LibraryScreen from './screens/LibraryScreen';
import ShowBuilderScreen from './screens/ShowBuilderScreen';
import LiveControllerScreen from './screens/LiveControllerScreen';
import SettingsScreen from './screens/SettingsScreen';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <h1>P&N Controller</h1>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Library</NavLink>
            <NavLink to="/builder" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Builder</NavLink>
            <NavLink to="/controller" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Live</NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Settings</NavLink>
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
