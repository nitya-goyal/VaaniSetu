import React, { useState, useRef } from 'react';
import { recognizeFrame, recognizeVideo } from '../api';
import toast from 'react-hot-toast';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) {
      toast.error('Only image or video files accepted');
      return;
    }
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview({ url, isVideo: f.type.startsWith('video/') });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      const isVideo = file.type.startsWith('video/');
      if (isVideo) {
        fd.append('video', file);
        const res = await recognizeVideo(fd);
        setResult(res.result);
      } else {
        fd.append('frame', file);
        const res = await recognizeFrame(fd);
        setResult(res.result);
      }
      toast.success('Recognition complete!');
    } catch (e) {
      toast.error(e.error || 'Recognition failed');
    } finally {
      setLoading(false);
    }
  };

  const conf = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>File Analysis</h1>
        <p>Submit an image or video file for gesture recognition using the CNN–LSTM inference engine.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dropzone */}
          <div
            className={`dropzone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <span className="dropzone-icon">⬆</span>
            <p>Drag &amp; drop or click to select a file</p>
            <small>Accepted formats: JPG, PNG, MP4, MOV, WebM</small>
          </div>

          {/* Preview */}
          {preview && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Preview</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{file?.name}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg-2)', color: 'var(--accent-secondary)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {preview.isVideo ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', maxHeight: 300 }}>
                {preview.isVideo ? (
                  <video src={preview.url} controls style={{ width: '100%', maxHeight: 300 }} />
                ) : (
                  <img src={preview.url} alt="preview" style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? '⏳ Processing…' : '◈ Run Analysis'}
                </button>
                <button className="btn btn-outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  ✕ Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="result-panel">
          <div className={`gesture-result ${result ? 'has-result' : ''}`}>
            {result ? (
              <>
                <span className="gesture-emoji">{result.emoji}</span>
                <div className="gesture-label">{result.gesture}</div>
                <div className="gesture-desc">{result.description}</div>
                <div className="confidence-bar-wrap">
                  <div className="confidence-label">
                    <span>Confidence</span><span>{conf}%</span>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: `${conf}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📁</span>
                <p>Submit a file to view inference results.</p>
              </div>
            )}
          </div>

          {result && (
            <div className="card">
              <div className="card-header"><span className="card-title">Inference Report</span></div>
              <div className="meta-grid">
                <div className="meta-item">
                  <div className="meta-val">{conf}%</div>
                  <div className="meta-key">Confidence</div>
                </div>
                <div className="meta-item">
                  <div className="meta-val">{result.processingMs}ms</div>
                  <div className="meta-key">Processing</div>
                </div>
                {result.framesProcessed && (
                  <div className="meta-item">
                    <div className="meta-val">{result.framesProcessed}</div>
                    <div className="meta-key">Frames</div>
                  </div>
                )}
                <div className="meta-item">
                  <div className="meta-val" style={{ fontSize: 12, textTransform: 'capitalize' }}>{result.type}</div>
                  <div className="meta-key">Type</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
