import React, { useEffect, useState } from 'react';
import { getGestures } from '../api';

export default function Gestures() {
  const [gestures, setGestures] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getGestures().then(d => setGestures(d.gestures)).catch(() => { });
  }, []);

  // Load generated 3D avatar images (Thumbnails)
  const getThumbnail = (label) => `/avatars/${label}.png`;
  
  // Load animated videos/GIFs (Detail Modal)
  const getAnimation = (label) => `/avatars/${label}.gif`;

  return (
    <div>
      <div className="page-header">
        <h1>Learning Hub</h1>
        <p>Explore and learn the {gestures.length} foundational signs integrated into Vaani Setu.</p>
      </div>

      <div className="gestures-grid">
        {gestures.map(g => (
          <div
            key={g.id}
            className="gesture-card"
            onClick={() => setSelected(g)}
            style={selected?.id === g.id ? { borderColor: 'var(--accent-primary)', background: 'rgba(124,92,252,0.08)' } : {}}
          >
            <div style={{ height: '120px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', backgroundImage: `url(${getThumbnail(g.label)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ padding: 16 }}>
              <span className="gesture-card-emoji">{g.emoji}</span>
              <div className="gesture-card-label">{g.label.replace(/_/g, ' ')}</div>
              <div className="gesture-card-desc">{g.description}</div>
              <div className="gesture-card-id">ID #{String(g.id).padStart(3, '0')}</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(10px)'
        }} onClick={() => setSelected(null)}>
          <div className="card" style={{ width: 400, textAlign: 'center', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <img 
              src={getAnimation(selected.label)} 
              alt={selected.label} 
              style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
              onError={(e) => { 
                // Fallback to the 3D .png if the .gif is not found
                e.target.onerror = null; 
                e.target.src = getThumbnail(selected.label); 
              }}
            />
            
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{selected.emoji}</div>
              <h2 style={{ textTransform: 'capitalize', fontSize: 24, marginBottom: 8 }}>
                {selected.label.replace(/_/g, ' ')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>{selected.description}</p>
              
              <div style={{
                display: 'flex', gap: 12, justifyContent: 'center',
                padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                marginBottom: 16
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Assigned ID: <span style={{ color: 'var(--accent-secondary)' }}>#{selected.id}</span>
                </span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sequence: <span style={{ color: 'var(--accent-green)' }}>30 Frames</span>
                </span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelected(null)}>Close Tutorial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
