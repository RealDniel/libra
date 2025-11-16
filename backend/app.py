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
from fallacmodel import analyze_audio_to_json, generate_json_from_text
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

# Transcribe audio and run through fine-tuned model, return JSON
@app.route("/api/analyze_audio", methods=["POST"])
def analyze_audio():
    if "audio" not in request.files:
        return jsonify({"error": "Missing 'audio' file in form-data"}), 400

    audio_file = request.files["audio"]
    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        audio_bytes = audio_file.read()
        mime_type = audio_file.mimetype or "application/octet-stream"
        result_json = analyze_audio_to_json(audio_bytes=audio_bytes, mime_type=mime_type)
        return jsonify(result_json)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        # Typically JSON parsing or API response issues
        return jsonify({"error": str(re)}), 422
    except Exception:
        return jsonify({"error": "Model analysis failed"}), 500

# Send plain text directly to fine-tuned model, return JSON
@app.route("/api/analyze_text", methods=["POST"])
def analyze_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not text:
        return jsonify({"error": "Missing 'text' in JSON body"}), 400
    try:
        result_json = generate_json_from_text(text)
        return jsonify(result_json)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        return jsonify({"error": str(re)}), 422
    except Exception:
        return jsonify({"error": "Model analysis failed"}), 500

# Fallacy detection endpoint (frontend expects this)
@app.route("/api/fallacies", methods=["POST"])
def detect_fallacies():
    data = request.get_json(silent=True) or {}
    transcript = data.get("transcript", "")
    speaker = data.get("speaker", "A")
    
    if not transcript:
        return jsonify({"error": "Missing 'transcript' in JSON body"}), 400
    
    try:
        print(f"\n🔍 Analyzing fallacies for speaker {speaker}...")
        print(f"Transcript: {transcript[:100]}...")
        
        # Call your fallacy model
        result_json = generate_json_from_text(transcript)
        
        # The model should return fallacies in the expected format
        # If it doesn't, transform it here
        fallacies = result_json.get("fallacies", [])
        
        print(f"✅ Found {len(fallacies)} fallacies")
        return jsonify({"fallacies": fallacies})
    except Exception as e:
        print(f"❌ Fallacy detection error: {e}")
        traceback.print_exc()
        return jsonify({"fallacies": []}), 200  # Return empty array instead of error

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
        
        # Frontend expects an array of fact-checks matching FactCheck interface
        # Transform backend result to frontend format
        import uuid
        
        # Map backend result to frontend verdict format
        verdict_map = {
            "true": "verified",
            "false": "false", 
            "unknown": "unverifiable",
            "error": "unverifiable"
        }
        
        # Transform evidence to sources format
        sources = []
        for ev in result.get("evidence", []):
            if isinstance(ev, dict) and "url" in ev:
                sources.append({
                    "title": ev.get("title", "Source"),
                    "url": ev.get("url", ""),
                    "snippet": ev.get("snippet", "")
                })
        
        fact_check = {
            "id": str(uuid.uuid4()),
            "claim": result.get("statement", text),
            "verdict": verdict_map.get(result.get("result", "unknown").lower(), "unverifiable"),
            "explanation": result.get("explanation", "No explanation provided"),
            "confidence": 85,  # Default confidence score
            "sources": sources if sources else None
        }
        
        return jsonify({"factChecks": [fact_check]})
        
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