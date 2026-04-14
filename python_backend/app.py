import os
import cv2
import numpy as np
import mediapipe as mp
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from typing import List

app = FastAPI(title="Vaani Setu Model API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model directly from the same folder
try:
    model_path = os.path.join(os.path.dirname(__file__), "my_model.keras")
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model from {model_path}: {e}")
    model = None

# MediaPipe Setup (Holistic)
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

ACTIONS = ['Hello', 'Yes', 'Nothing', 'Thankyou']

class SequenceRequest(BaseModel):
    frames: List[str]

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33 * 4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468 * 3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21 * 3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21 * 3)
    return np.concatenate([pose, face, lh, rh])

def draw_styled_landmarks(image, results):
    # Draw face connections
    if results.face_landmarks:
        mp_drawing.draw_landmarks(image, results.face_landmarks, mp_holistic.FACEMESH_TESSELATION, 
                                 mp_drawing.DrawingSpec(color=(80,110,10), thickness=1, circle_radius=1),
                                 mp_drawing.DrawingSpec(color=(80,256,121), thickness=1, circle_radius=1))
    # Draw pose connections
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
                                 mp_drawing.DrawingSpec(color=(80,22,10), thickness=2, circle_radius=4),
                                 mp_drawing.DrawingSpec(color=(80,44,121), thickness=2, circle_radius=2))
    # Draw hand connections
    if results.left_hand_landmarks:
        mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS, 
                                 mp_drawing.DrawingSpec(color=(121,22,76), thickness=2, circle_radius=4),
                                 mp_drawing.DrawingSpec(color=(121,44,250), thickness=2, circle_radius=2))
    if results.right_hand_landmarks:
        mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS, 
                                 mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=4),
                                 mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2))

@app.post("/predict_sequence")
async def predict_sequence(request: SequenceRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded.")
    if len(request.frames) != 30:
        raise HTTPException(status_code=400, detail="Must provide exactly 30 frames.")
        
    try:
        sequence = []
        last_drawn_image = None
        
        for idx, frame_data in enumerate(request.frames):
            encoded_data = frame_data.split(',')[1] if ',' in frame_data else frame_data
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False
            results = holistic.process(image_rgb)
            
            keypoints = extract_keypoints(results)
            sequence.append(keypoints)
            
            # For the last frame (or any frame), draw landmarks to return
            if idx == 29:
                image_rgb.flags.writeable = True
                image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
                draw_styled_landmarks(image_bgr, results)
                _, buffer = cv2.imencode('.jpg', image_bgr)
                last_drawn_image = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')
        
        # Predict on exactly this isolated 30-frame sequence
        res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
        action_idx = np.argmax(res)
        confidence = float(res[action_idx])
        gesture = ACTIONS[action_idx]
            
        return {
            "success": True,
            "gesture": gesture,
            "confidence": confidence,
            "drawn_image": last_drawn_image
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
