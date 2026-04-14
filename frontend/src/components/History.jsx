import React, { useEffect, useState } from 'react';
import { getHistory, clearHistory } from '../api';
import toast from 'react-hot-toast';

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (t = type) => {
    setLoading(true);
    try {
      const res = await getHistory(50, t || undefined);
      setHistory(res.history);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all history?')) return;
    await clearHistory();
    setHistory([]);
    toast.success('History cleared');
  };

  const filtered = type ? history.filter(h => h.type === type) : history;

  return (
    <div>
      <div className="page-header">
        <h1>Recognition History</h1>
        <p>Log of all gesture recognitions in this session</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'realtime', 'frame', 'video'].map(t => (
              <button
                key={t}
                className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setType(t); load(t); }}
              >
                {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => load()}>↻ Refresh</button>
            <button className="btn btn-danger btn-sm" onClick={handleClear}>✕ Clear</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◷</span>
            <p>No recognition history yet</p>
          </div>
        ) : (
          <div className="history-list">
            {filtered.map(item => (
              <div className="history-item" key={item.id}>
                <span className="history-emoji">{item.emoji}</span>
                <div className="history-info">
                  <div className="history-gesture">{item.gesture?.replace(/_/g, ' ')}</div>
                  <div className="history-meta">
                    {item.type} · {item.processingMs}ms · {timeAgo(item.timestamp)}
                    {item.framesProcessed ? ` · ${item.framesProcessed} frames` : ''}
                  </div>
                </div>
                <span className="conf-pill">{Math.round(item.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
