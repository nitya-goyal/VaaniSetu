import React, { useEffect, useState } from 'react';
import { getStats, getHistory } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#7c5cfc', '#00e5ff', '#00ff9d', '#ff6b35', '#ff9f43', '#a29bfe'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 12
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getStats().then(d => setStats(d.stats)).catch(() => { });
    getHistory(100).then(d => setHistory(d.history)).catch(() => { });
  }, []);

  // Prepare bar chart data from topGestures
  const barData = stats?.topGestures?.map(g => ({ name: g.gesture.replace(/_/g, ' '), count: g.count })) || [];

  // Pie data: type distribution
  const typeMap = {};
  history.forEach(h => { typeMap[h.type] = (typeMap[h.type] || 0) + 1; });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  // Confidence histogram
  const confBuckets = { '50–60%': 0, '60–70%': 0, '70–80%': 0, '80–90%': 0, '90–100%': 0 };
  history.forEach(h => {
    const c = h.confidence * 100;
    if (c >= 90) confBuckets['90–100%']++;
    else if (c >= 80) confBuckets['80–90%']++;
    else if (c >= 70) confBuckets['70–80%']++;
    else if (c >= 60) confBuckets['60–70%']++;
    else confBuckets['50–60%']++;
  });
  const confData = Object.entries(confBuckets).map(([range, count]) => ({ range, count }));

  // Timeline (last 20 results confidence)
  const timelineData = history.slice(0, 20).reverse().map((h, i) => ({
    idx: i + 1,
    confidence: Math.round(h.confidence * 100)
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Performance Analytics</h1>
        <p>Statistical insights into gesture recognition patterns, confidence scores, and model performance trends.</p>
      </div>

      <div className="charts-grid">
        {/* Top Gestures Bar */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Gestures</span></div>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>◉</span>
              <p>No recognition data available. Perform some gestures to populate this chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8888aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#7c5cfc" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recognition Type Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recognition Types</span></div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>◈</span>
              <p>No data available yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Confidence Distribution */}
        <div className="card">
          <div className="card-header"><span className="card-title">Confidence Distribution</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confData} margin={{ left: -20 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#8888aa' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8888aa' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#00e5ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Timeline */}
        <div className="card">
          <div className="card-header"><span className="card-title">Confidence Over Time</span></div>
          {timelineData.length < 2 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>◷</span>
              <p>At least 2 recognition events are required to render the timeline.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,100,255,0.08)" />
                <XAxis dataKey="idx" tick={{ fontSize: 10, fill: '#8888aa' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#8888aa' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="confidence" stroke="#00ff9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
