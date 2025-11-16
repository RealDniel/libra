# Libra - Quick Start

Simple, step-by-step setup for macOS and Windows.

## Backend setup (Flask)
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

## Environment
Create backend/.env with your ElevenLabs key:
```bash
echo ELEVENLABS_API_KEY=YOUR_KEY_HERE > backend/.env   # macOS
```
On Windows, create backend\.env and add:
```
ELEVENLABS_API_KEY=YOUR_KEY_HERE
```

## Run backend
```bash
cd backend
source venv/bin/activate            # macOS
# venv\Scripts\activate             # Windows
python app.py
```

## Frontend setup (Expo)
```bash
cd frontend
npm install
npm start
```
