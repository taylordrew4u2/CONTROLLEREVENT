import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
          <h1>Pins & Needles Show Controller</h1>
          <div className="nav-links">
            <Link to="/" className="nav-link">Library</Link>
            <Link to="/builder" className="nav-link">Show Builder</Link>
            <Link to="/controller" className="nav-link">Live Controller</Link>
            <Link to="/settings" className="nav-link">⚙️ Settings</Link>
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
