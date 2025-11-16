Libra - Quick Start

Simple, step-by-step setup for macOS and Windows.

1) Backend setup (Flask)
- macOS:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
- Windows (PowerShell or CMD):
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

2) Environment
Create backend/.env with your ElevenLabs key:
```bash
echo ELEVENLABS_API_KEY=YOUR_KEY_HERE > backend/.env   # macOS
```
On Windows, create backend\.env and add:
```
ELEVENLABS_API_KEY=YOUR_KEY_HERE
```

3) Run backend
```bash
cd backend
source venv/bin/activate            # macOS
# venv\Scripts\activate             # Windows
python app.py
```

4) Frontend setup (Expo)
```bash
cd frontend
npm install
npm start
```
- i = iOS simulator, a = Android emulator, or scan the QR with Expo Go.
- If running on a physical device, update the IP in frontend/App.js:
```
fetch("http://YOUR_LOCAL_IP:5001/api/hello")
```
(Keep /api/hello)

6) Optional: Mock transcription client
Open this file in your browser:
```
mock-client/index.html
```
Use Backend URL: http://localhost:5001/api/transcribe
Upload an audio file and click “Upload & Transcribe”.

VS Code interpreter (optional but recommended)
In VS Code: Cmd+Shift+P (or Ctrl+Shift+P) → “Python: Select Interpreter”
- macOS: backend/venv/bin/python
- Windows: backend\venv\Scripts\python.exe

Common tips
- If the frontend can’t reach the backend on a phone, verify you used your machine’s IP and that the backend is running on port 5001.
- For ElevenLabs STT errors, ensure ELEVENLABS_API_KEY is set and the audio format is supported.