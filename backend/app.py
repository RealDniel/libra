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
from factchecker import FactCheckerAgent
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

agent = FactCheckerAgent()

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
    except Exception:
        return jsonify({"error": "Transcription failed"}), 500

# Fact checker function
@app.route("/api/factcheck", methods=["POST"])
def factcheck():
    try:
        print("\n" + "="*60)
        print("Received factcheck request")
        print("="*60)
        
        data = request.json
        print(f"Request data: {data}")
        
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({'error': 'No data provided'}), 400
        
        # Accept both "text" and "statement" for compatibility
        text = data.get("text") or data.get("statement", "")
        print(f"Text to check: {text}")
        
        if not text or not text.strip():
            print("ERROR: No text/statement in request")
            return jsonify({'error': 'No text or statement provided'}), 400
        
        # Use check_statement for single statements (better for fact-checking)
        result = agent.check_statement(text)
        
        print(f"\nReturning result: {result['result']}")
        print("="*60 + "\n")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"\nERROR in factcheck endpoint: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'statement': text if 'text' in locals() else 'unknown',
            'result': 'error'
        }), 500

@app.route("/api/test", methods=["GET"])
def test():
    """Simple test endpoint to verify server is running"""
    return jsonify({'status': 'ok', 'message': 'Backend is running!'})

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Starting Flask server...")
    print("Backend will be available at: http://0.0.0.0:5001")
    print("Test it by visiting: http://localhost:5001/api/test")
    print("="*60 + "\n")
    # Listen on all network interfaces so your phone can reach it
    app.run(host="0.0.0.0", port=5001, debug=True)