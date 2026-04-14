import React from 'react';

const navItems = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'recognize', icon: '◈', label: 'Recognize' },
  { id: 'gestures', icon: '✦', label: 'Learning Hub' },
  { id: 'analytics', icon: '◉', label: 'Analytics' },
];

export default function Sidebar({ active, onNav, apiOnline }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🤟</div>
          <span className="logo-text">Vaani Setu</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-badge">
          <span className="status-dot" style={apiOnline ? {} : { background: '#ff4444', boxShadow: '0 0 8px #ff4444' }} />
          {apiOnline ? 'Model Online' : 'API Offline'}
        </div>
      </div>
    </aside>
  );
}
