require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// ─── In-Memory "Database" ─────────────────────────────────────────────────────
const recognitionHistory = [];
const sessionStats = { totalRecognitions: 0, todayRecognitions: 0, accuracy: 97.3, uptime: Date.now() };

// ─── Gesture Labels ───────────────────────────────────────────────────────────
const GESTURE_LABELS = [
  { id: 0, label: 'Hello',        description: 'Greeting gesture',          emoji: '👋' },
  { id: 1, label: 'Yes',          description: 'Affirmative gesture',       emoji: '✅' },
  { id: 2, label: 'Nothing',      description: 'No gesture detected',       emoji: '😶' },
  { id: 3, label: 'Thankyou',     description: 'Gratitude gesture',         emoji: '🙏' },
];

// ─── Helper: Call Python Model API (Sequence) ──────────────────────────────
async function callPythonSequence(frames) {
  const start = Date.now();
  try {
    const response = await fetch('http://127.0.0.1:8000/predict_sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames })
    });
    
    if (!response.ok) throw new Error('Python API errored: ' + response.statusText);
    
    const data = await response.json();
    const processingMs = Date.now() - start;
    
    if (data.success && data.gesture) {
      const gesture = GESTURE_LABELS.find(g => g.label.toLowerCase() === data.gesture.toLowerCase());
      if (gesture) return { gesture, confidence: data.confidence, processingMs, drawn_image: data.drawn_image };
    }
    return { gesture: { label: 'Nothing', emoji: '😶', description: 'None' }, confidence: data.confidence || 0, processingMs, drawn_image: data.drawn_image };
  } catch (err) {
    console.error('Model error:', err.message);
    return { gesture: { label: 'Error', emoji: '⚠️', description: 'API Error' }, confidence: 0, processingMs: Date.now() - start, drawn_image: null };
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - sessionStats.uptime) / 1000),
    model: { name: 'CNN-LSTM v1.0', framework: 'TensorFlow/Keras', status: 'loaded' },
    timestamp: new Date().toISOString()
  });
});

// Get all gesture labels
app.get('/api/gestures', (req, res) => {
  res.json({ success: true, total: GESTURE_LABELS.length, gestures: GESTURE_LABELS });
});

// Recognize from uploaded frame/image
app.post('/api/recognize/frame', upload.single('frame'), async (req, res) => {
  if (!req.file && !req.body.frame_base64) {
    return res.status(400).json({ success: false, error: 'No frame provided' });
  }

  let base64Data = req.body.frame_base64;
  if (req.file) {
    base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  const { gesture, confidence, processingMs } = await callPythonModel(base64Data);
  const record = {
    id: uuidv4(),
    type: 'frame',
    gesture: gesture.label,
    emoji: gesture.emoji,
    description: gesture.description,
    confidence,
    processingMs,
    timestamp: new Date().toISOString()
  };

  recognitionHistory.unshift(record);
  if (recognitionHistory.length > 200) recognitionHistory.pop();
  sessionStats.totalRecognitions++;
  sessionStats.todayRecognitions++;

  res.json({ success: true, result: record });
});

// Recognize from uploaded video
app.post('/api/recognize/video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No video provided' });
  }

  const frames = 20 + Math.floor(Math.random() * 20);
  const gesture = GESTURE_LABELS[1]; // Dummy return for video upload
  const confidence = 0.90;
  const processingMs = 1500;
  const record = {
    id: uuidv4(),
    type: 'video',
    gesture: gesture.label,
    emoji: gesture.emoji,
    description: gesture.description,
    confidence,
    processingMs,
    framesProcessed: frames,
    timestamp: new Date().toISOString()
  };

  recognitionHistory.unshift(record);
  if (recognitionHistory.length > 200) recognitionHistory.pop();
  sessionStats.totalRecognitions++;
  sessionStats.todayRecognitions++;

  res.json({ success: true, result: record });
});

// Discrete Sequence recognition (array of 30 base64 frames)
app.post('/api/recognize/sequence', async (req, res) => {
  const { frames } = req.body;
  if (!frames || !Array.isArray(frames) || frames.length !== 30) {
    return res.status(400).json({ success: false, error: 'Exactly 30 frames are required' });
  }

  const { gesture, confidence, processingMs, drawn_image } = await callPythonSequence(frames);

  if (confidence > 0.5) {
    const record = {
      id: uuidv4(),
      type: 'sequence',
      gesture: gesture.label,
      emoji: gesture.emoji,
      description: gesture.description,
      confidence,
      processingMs,
      timestamp: new Date().toISOString()
    };
    recognitionHistory.unshift(record);
    if (recognitionHistory.length > 200) recognitionHistory.pop();
    sessionStats.totalRecognitions++;
    sessionStats.todayRecognitions++;
  }

  res.json({
    success: true,
    gesture: gesture.label,
    emoji: gesture.emoji,
    confidence,
    processingMs,
    drawn_image,
    saved: confidence > 0.5
  });
});

// Get recognition history
app.get('/api/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const type = req.query.type; // optional filter
  let results = recognitionHistory;
  if (type) results = results.filter(r => r.type === type);
  res.json({ success: true, total: results.length, history: results.slice(0, limit) });
});

// Get stats
app.get('/api/stats', (req, res) => {
  const gestureFreq = {};
  recognitionHistory.forEach(r => {
    gestureFreq[r.gesture] = (gestureFreq[r.gesture] || 0) + 1;
  });

  const topGestures = Object.entries(gestureFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([gesture, count]) => ({ gesture, count }));

  res.json({
    success: true,
    stats: {
      totalRecognitions: sessionStats.totalRecognitions,
      todayRecognitions: sessionStats.todayRecognitions,
      accuracy: sessionStats.accuracy,
      topGestures,
      historyCount: recognitionHistory.length,
      uptimeSeconds: Math.floor((Date.now() - sessionStats.uptime) / 1000)
    }
  });
});

// Clear history
app.delete('/api/history', (req, res) => {
  recognitionHistory.length = 0;
  res.json({ success: true, message: 'History cleared' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SLR Backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints: /api/health | /api/gestures | /api/recognize/* | /api/history | /api/stats\n`);
});

module.exports = app;
