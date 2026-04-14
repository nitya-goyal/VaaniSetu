import React, { useRef, useState, useCallback, useEffect } from 'react';
import { recognizeSequence } from '../api';
import toast from 'react-hot-toast';

export default function Recognize() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [drawnImage, setDrawnImage] = useState(null);
  
  // Accessibility & Translation State
  const [targetLang, setTargetLang] = useState('en-US');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setRecording(false);
    setProgress(0);
  }, []);

  // Capture single frame
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 224;
    canvas.height = video.videoHeight || 224;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Translate result using MyMemory API
  const translateAndSpeak = async (text, lang) => {
    if (lang === 'en-US') {
      setTranslatedText(text);
      speakResult(text, 'en-US');
      return;
    }
    
    setIsTranslating(true);
    const shortLang = lang.split('-')[0]; // "hi-IN" -> "hi"
    
    try {
      const resp = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${shortLang}`);
      const data = await resp.json();
      const translation = data.responseData.translatedText;
      setTranslatedText(translation);
      speakResult(translation, lang);
    } catch (err) {
      toast.error("Translation API failed");
      setTranslatedText(text);
      speakResult(text, 'en-US');
    } finally {
      setIsTranslating(false);
    }
  };

  // Speak result (TTS Accessibility)
  const speakResult = (text, langCode) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Record exactly 30 frames
  const startRecordingSequence = useCallback(() => {
    setRecording(true);
    setProgress(0);
    setResult(null);
    setDrawnImage(null);
    setTranslatedText('');
    
    let frames = [];
    let frameCount = 0;
    
    toast('Recording sign gesture in 3... 2... 1...');
    
    setTimeout(() => {
      const interval = setInterval(async () => {
        const frameData = captureFrame();
        if (frameData) {
          frames.push(frameData);
          frameCount++;
          setProgress(Math.round((frameCount / 30) * 100));
        }
        
        if (frameCount >= 30) {
          clearInterval(interval);
          toast('Processing model inference...');
          try {
            const res = await recognizeSequence(frames);
            setResult(res);
            if (res.drawn_image) {
              setDrawnImage(res.drawn_image);
            }
            if (res.confidence > 0.5 && res.gesture !== 'Nothing') {
              translateAndSpeak(res.gesture, targetLang);
            }
          } catch (e) {
            toast.error('Sequence prediction failed');
          } finally {
            setRecording(false);
          }
        }
      }, 50); // 50ms interval ~20 FPS (30 frames = 1.5 seconds)
    }, 800); 
  }, [captureFrame, targetLang]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const conf = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Sign to Voice Translator</h1>
          <p>Record exactly 30 frames to analyze a sign and instantly translate and speak it.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Target Audio Language</label>
          <select 
            value={targetLang} 
            onChange={e => setTargetLang(e.target.value)}
            className="btn btn-outline"
            style={{ width: '200px' }}
          >
            <option value="en-US">English (US)</option>
            <option value="hi-IN">Hindi (India)</option>
            <option value="pa-IN">Punjabi (India)</option>
            <option value="te-IN">Telugu (India)</option>
            <option value="kn-IN">Kannada (India)</option>
            <option value="es-ES">Spanish</option>
          </select>
        </div>
      </div>

      <div className="recognize-grid">
        {/* Camera panel */}
        <div>
          <div className="webcam-wrapper" style={{ position: 'relative' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />
            {drawnImage && (
              <img src={drawnImage} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', zIndex: 10 }} alt="drawn inference keypoints" />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {streaming && !drawnImage && (
              <div className="webcam-overlay">
                {(recording || progress > 0) && (
                   <div style={{ position: 'absolute', top: 0, left: 0, height: 6, background: '#ff4444', width: `${progress}%`, transition: 'width 0.1s' }} />
                )}
                <div className="scan-frame" style={recording ? { borderColor: '#ff4444' } : {}} />
                {recording && <div className="scan-line" style={{ background: 'rgba(255,0,0,0.4)', boxShadow: '0 0 10px #ff0000' }} />}
                <div className="webcam-badge" style={recording ? { color: '#ff4444' } : {}}>
                  <span className="status-dot" style={recording ? { background: '#ff4444', boxShadow: '0 0 8px #ff4444' } : {}}/>
                  {recording ? `RECORDING ${progress}%` : 'CAMERA READY'}
                </div>
              </div>
            )}
            
            {!streaming && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', gap: 14 }}>
                <span style={{ fontSize: 56, opacity: 0.3 }}>📷</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Camera feed inactive</p>
              </div>
            )}
          </div>

          <div className="webcam-controls">
            {!streaming ? (
              <button className="btn btn-primary" onClick={startCamera}>
                ▶ Start Camera
              </button>
            ) : (
              <button className="btn btn-outline" onClick={stopCamera}>
                ■ Stop Camera
              </button>
            )}
            
            <button className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`} style={recording ? { opacity: 0.7 } : {}} onClick={startRecordingSequence} disabled={!streaming || recording}>
              {recording ? '🔴 Recording Sequence...' : '🔴 Record Sign'}
            </button>
            
            {drawnImage && (
              <button className="btn btn-outline" onClick={() => { setDrawnImage(null); setResult(null); setTranslatedText(''); }}>
                ↻ Clear View
              </button>
            )}
          </div>
        </div>

        {/* Result panel */}
        <div className="result-panel">
          <div className={`gesture-result ${result && result.confidence > 0.5 ? 'has-result' : ''}`}>
            {result ? (
              <>
                <span className="gesture-emoji">{result.emoji}</span>
                <div className="gesture-label">{result.gesture}</div>
                
                {translatedText && translatedText !== result.gesture && (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontSize: 24, fontWeight: 'bold' }}>
                    {isTranslating ? 'Translating...' : translatedText}
                    <div style={{ fontSize: 12, fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: 4 }}>Translated Output</div>
                  </div>
                )}
                
                <div className="gesture-desc" style={{ marginTop: 16 }}>Identified Original Sequence</div>
                <div className="confidence-bar-wrap">
                  <div className="confidence-label">
                    <span>Confidence</span>
                    <span>{conf}%</span>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: `${conf}%`, background: conf > 50 ? 'var(--accent-primary)' : '#ff4444' }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🌐</span>
                <p>Record a sequence. It will be identified, translated to the selected language, and spoken out loud!</p>
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
                  <div className="meta-val" style={{ fontSize: 12, textTransform: 'capitalize' }}>{result.gesture}</div>
                  <div className="meta-key">Label</div>
                </div>
                <div className="meta-item">
                  <div className="meta-val" style={{ fontSize: 12 }}>{targetLang}</div>
                  <div className="meta-key">Language</div>
                </div>
                <div className="meta-item">
                  <div className="meta-val" style={{ fontSize: 12 }}>Enabled</div>
                  <div className="meta-key">Audio TTS</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
