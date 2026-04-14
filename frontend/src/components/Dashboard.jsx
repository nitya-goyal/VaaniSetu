import React, { useEffect, useState } from 'react';
import { getStats, getHealth } from '../api';

export default function Dashboard({ onNav }) {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getStats().then(d => setStats(d.stats)).catch(() => { });
    getHealth().then(d => setHealth(d)).catch(() => { });
  }, []);

  const uptimeStr = health
    ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
    : '—';

  return (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
        <p>System performance metrics and activity summary for Vaani Setu's sign language recognition engine.</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Recognitions', value: stats?.totalRecognitions ?? '—', sub: 'Cumulative all-time', icon: '◈', color: 'var(--accent-primary)' },
          { label: 'Session Recognitions', value: stats?.todayRecognitions ?? '—', sub: 'Current session', icon: '◷', color: 'var(--accent-secondary)' },
          { label: 'Model Accuracy', value: stats ? `${stats.accuracy}%` : '—', sub: 'CNN-LSTM v1.0 benchmark', icon: '◎', color: 'var(--accent-green)' },
          { label: 'Server Uptime', value: uptimeStr, sub: health?.status ?? '—', icon: '⬡', color: 'var(--accent-warn)' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Architecture Overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Inference Pipeline</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { step: '01', label: 'Input Acquisition', desc: 'Webcam or uploaded media file', color: 'var(--accent-primary)' },
              { step: '02', label: 'Frame Sampling', desc: '20–40 frames extracted per gesture', color: 'var(--accent-secondary)' },
              { step: '03', label: 'CNN Feature Extraction', desc: 'Spatial encoding via MobileNetV2', color: 'var(--accent-green)' },
              { step: '04', label: 'LSTM Temporal Modelling', desc: 'Sequential gesture pattern analysis', color: '#ff9f43' },
              { step: '05', label: 'Softmax Classification', desc: 'Confidence-scored gesture output', color: 'var(--accent-warn)' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: item.color + '22', border: `1px solid ${item.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: 'var(--font-mono)', color: item.color, flexShrink: 0
                }}>{item.step}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Navigation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '◈', label: 'Live Recognition', desc: 'Real-time gesture inference via webcam', page: 'recognize', color: 'var(--accent-primary)' },
              { icon: '✦', label: 'Learning Hub', desc: 'Explore and practice sign language visually', page: 'gestures', color: 'var(--accent-green)' },
              { icon: '◉', label: 'Performance Analytics', desc: 'Charts, confidence trends, and insights', page: 'analytics', color: 'var(--accent-warn)' },
            ].map(item => (
              <button
                key={item.page}
                onClick={() => onNav(item.page)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', background: 'var(--bg-2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  color: 'var(--text-primary)', width: '100%'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 20, color: item.color, width: 28, textAlign: 'center' }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>→</div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Gestures */}
        {stats?.topGestures?.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <span className="card-title">Most Frequent Gestures</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {stats.topGestures.map((g, i) => (
                <div key={g.gesture} style={{
                  flex: 1, background: 'var(--bg-2)', borderRadius: 'var(--radius)',
                  padding: '14px', textAlign: 'center', border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>#{i + 1}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>{g.gesture}</div>
                  <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{g.count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
