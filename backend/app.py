from flask import Flask, jsonify, request
from flask_cors import CORS
import os

try:
    # Load environment variables from backend/.env if present
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional; safe to continue if not installed
    pass

from services.transcription import transcribe_audio

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})

@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "Missing 'audio' file in form-data"}), 400

    audio_file = request.files["audio"]
    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        audio_bytes = audio_file.read()
        mime_type = audio_file.mimetype or "application/octet-stream"
        transcript = transcribe_audio(audio_bytes=audio_bytes, mime_type=mime_type)
        return jsonify({"transcript": transcript})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Transcription failed"}), 500

if __name__ == "__main__":
    # Listen on all network interfaces so your phone can reach it
    # Set port explicitly to 5000
    app.run(host="0.0.0.0", port=5001, debug=True)

