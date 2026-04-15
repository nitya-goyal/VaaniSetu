# 🤟 VaaniSetu – Multilingual Assistive Communication System

**VaaniSetu** is an AI-powered assistive communication platform that enables seamless interaction between individuals with hearing, speech, and visual impairments and the general public. 

The system leverages computer vision, deep learning (CNN-LSTM), and natural language processing (NLP) to accurately interpret gestures and speech, converting them into meaningful, accessible multiformat outputs.

## 🎥 Project Demo Video
https://github.com/user-attachments/assets/18b95228-feab-417c-9967-25d780e93dbe

## 🎯 Project Overview & Core Functionalities

This platform supports multimodal input and targets several core functionalities to bridge the communication gap:

- **Sign-to-Text & Speech:** Detect Indian Sign Language (ISL) gestures via real-time webcam tracking and convert them into readable text and natural audio.
- **Speech-to-Text (STT):** Convert spoken language into text in real time.
- **Text-to-Speech (TTS):** Generate voice output from text input using the browser `SpeechSynthesis` Web API.
- **Multilingual Translation:** Scalable support for multiple Indian languages (e.g., Hindi, English, Punjabi) to address linguistic diversity.
- **Multiformat Output:** 
  - *Text* (for hearing-impaired users)
  - *Audio* (for visually impaired users)
  - *Visual/Keypoint Representation* (for better comprehension and learning)

## 🚀 System Goals
- Enable real-time, low-latency communication.
- Ensure high accuracy in gesture and speech recognition using isolated sequence capturing.
- Provide a user-friendly and highly accessible interface.
- Support scalability across multiple languages and varying environments.

---

## 📁 Project Structure

```
slr-project/
├── python_backend/   # Python FastAPI + CNN-LSTM Model
│   ├── app.py        ← FastAPI server & /predict endpoint
│   ├── my_model.keras← Trained CNN-LSTM model weights
│   └── requirements.txt
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
└── frontend/         # React.js Web App
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Recognize.jsx   ← Live webcam recognition
    │   │   ├── Upload.jsx      ← File upload recognition
    │   │   ├── Gestures.jsx    ← Gesture dictionary / Learning Hub
    │   │   ├── History.jsx     ← Recognition log
    │   │   └── Analytics.jsx   ← Charts & insights
    │   ├── api.js
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ with pip
- A modern browser with webcam access

> **Start all three servers** in separate terminals. The recommended startup order is: Python Backend → Node Backend → Frontend.

### 1. Python Backend Setup (CNN-LSTM Model)

```bash
cd python_backend
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

Python backend runs at **http://localhost:8000**  
Key endpoint: `POST /predict` — accepts a base64 JPEG frame, returns `{ gesture, confidence }`

### 2. Node.js Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev          # development (with nodemon)
# or
npm start            # production
```

Node backend runs at **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000** (proxies API calls to port 5000)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health + model status |
| GET | `/api/gestures` | All supported gesture labels |
| GET | `/api/stats` | Recognition stats & top gestures |
| GET | `/api/history?limit=20&type=` | Recognition history |
| DELETE | `/api/history` | Clear history |
| POST | `/api/recognize/frame` | Recognize from image (multipart) |
| POST | `/api/recognize/video` | Recognize from video (multipart) |
| POST | `/api/recognize/realtime` | Recognize from base64 frame (JSON) |

### Example: Recognize a frame

```bash
curl -X POST http://localhost:5000/api/recognize/frame \
  -F "frame=@gesture.jpg"
```

### Example: Real-time frame (base64)

```bash
curl -X POST http://localhost:5000/api/recognize/realtime \
  -H "Content-Type: application/json" \
  -d '{"frame_data": "<base64_jpeg>", "session_id": "abc123"}'
```

---

## 🧠 Connecting the Real Python Model (FastAPI/TensorFlow)

The Node.js backend currently simulates inference. To connect the real CNN-LSTM model:

1. Run the Python FastAPI backend (see project PDF for implementation details)
2. In `backend/src/server.js`, replace the `simulateInference()` call with a real HTTP request:

```js
// In simulateInference(), replace with:
const pythonRes = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  body: frameBuffer,          // raw image bytes
  headers: { 'Content-Type': 'image/jpeg' }
});
const { gesture, confidence } = await pythonRes.json();
```

---

## 🎨 Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **Multer** — File upload handling
- **Helmet** — Security headers
- **CORS** — Cross-origin requests
- **Morgan** — Request logging
- **express-rate-limit** — Rate limiting

### Frontend
- **React 18** — UI framework
- **Recharts** — Analytics charts
- **react-hot-toast** — Notifications
- **Lucide React** — Icons
- **CSS Variables** — Design system

---

## 🤟 Supported Gestures (4)

| ID | Gesture | Emoji |
|----|---------|-------|
| 0 | Hello | 👋 |
| 1 | Yes | ✅ |
| 2 | Nothing | 😶 |
| 3 | Thankyou | 🙏 |

---

## 📸 Features

- **Live Webcam Recognition** — Real-time CNN-LSTM inference via webcam
- **Snapshot Mode** — Capture single frames for analysis
- **Live Mode** — Continuous automatic recognition (~0.8fps)
- **File Upload** — Analyze images or video files
- **Gesture Dictionary** — Browse all 4 supported gestures
- **History Log** — Full log of all recognition events
- **Analytics Dashboard** — Recharts-powered visualizations
- **API Health Monitoring** — Live backend status indicator

---

## 🔮 Future Enhancements (from project PDF)

- Sentence-level recognition with NLP integration
- Multilingual sign language support (BSL, ISL, etc.)
- Cloud deployment (AWS / GCP)
- Mobile app via React Native
- Real TensorFlow model integration
- Text-to-speech output
