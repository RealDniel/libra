# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback
import uuid

from services.transcription import transcribe_audio
from fallacmodel import analyze_audio_to_json, generate_json_from_text
from factchecker import FactCheckerAgent

app = Flask(__name__)
CORS(app)

# Initialize FactCheckerAgent
agent = FactCheckerAgent()

# -------------------- Test --------------------
@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"status": "ok", "message": "Backend is running!"})

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})

# -------------------- Transcribe Audio --------------------
@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "Missing 'audio' file"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        transcript = transcribe_audio(file.read(), mime_type=file.mimetype or "audio/wav")
        return jsonify({"transcript": transcript})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Transcription failed"}), 500

# -------------------- Analyze Audio --------------------
@app.route("/api/analyze_audio", methods=["POST"])
def analyze_audio():
    if "audio" not in request.files:
        return jsonify({"error": "Missing 'audio' file"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        result = analyze_audio_to_json(file.read(), mime_type=file.mimetype or "audio/wav")
        return jsonify(result)
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Audio analysis failed"}), 500

# -------------------- Analyze Text --------------------
@app.route("/api/analyze_text", methods=["POST"])
def analyze_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not text:
        return jsonify({"error": "Missing 'text'"}), 400
    try:
        result = generate_json_from_text(text)
        return jsonify(result)
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Text analysis failed"}), 500

# -------------------- Fallacy Detection --------------------
@app.route("/api/fallacies", methods=["POST"])
def detect_fallacies():
    data = request.get_json(silent=True) or {}
    transcript = data.get("transcript", "")
    if not transcript:
        return jsonify({"error": "Missing 'transcript'"}), 400

    try:
        result = generate_json_from_text(transcript)
        fallacies = result.get("fallacies", [])
        for f in fallacies:
            if "id" not in f:
                f["id"] = str(uuid.uuid4())
        return jsonify({"fallacies": fallacies})
    except Exception:
        traceback.print_exc()
        return jsonify({"fallacies": []}), 200

# -------------------- Factcheck --------------------
@app.route("/api/factcheck", methods=["POST"])
def factcheck():
    try:
        data = request.json or {}
        text = data.get("text") or data.get("statement", "")
        if not text.strip():
            return jsonify({"error": "No text/statement provided"}), 400

        results = agent.check_text(text)

        factchecks_out = []
        verdict_map = {"true": "verified", "false": "false", "unknown": "unverifiable"}

        for res in results:
            # Only include statements that were judged explicitly false
            verdict_raw = res.get("verdict", "unknown").lower()
            if verdict_raw != "false":
                continue

            verdict = verdict_map.get(verdict_raw, "false")
            sources = []
            for ev in res.get("evidence", []):
                if isinstance(ev, dict):
                    for item in ev.get("results", []):
                        sources.append({
                            "title": item.get("title", ""),
                            "url": item.get("link", ""),
                            "snippet": item.get("snippet", "")
                        })

            factchecks_out.append({
                "id": str(uuid.uuid4()),
                "claim": res.get("statement", text),
                "verdict": verdict,
                "explanation": res.get("explanation", ""),
                "confidence": 85,
                "sources": sources or None
            })

        return jsonify({"factChecks": factchecks_out})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "statement": text, "result": "error"}), 500

# -------------------- Run Server --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
