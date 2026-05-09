import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import ViewerScreen from './screens/ViewerScreen';
import AdminScreen from './screens/AdminScreen';
import './web.css';

function TopBar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <div className="web-topbar">
      <div className="web-brand">Pins & Needles Live</div>
      <div className="web-links">
        {isAdmin ? <Link to="/" className="web-link">Viewer</Link> : <Link to="/admin" className="web-link">Admin</Link>}
      </div>
    </div>
  );
}

export default function WebApp() {
  return (
    <BrowserRouter>
      <div className="web-shell">
        <TopBar />
        <Routes>
          <Route path="/" element={<ViewerScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

