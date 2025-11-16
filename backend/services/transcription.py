import os
import json
from typing import Optional

import requests


def _get_api_key() -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY is not set")
    return api_key


def _get_stt_url() -> str:
    # Default to ElevenLabs Scribe v1 REST endpoint (override via env if needed)
    return os.getenv("ELEVENLABS_STT_URL", "https://api.elevenlabs.io/v1/speech-to-text")


def transcribe_audio(audio_bytes: bytes, mime_type: Optional[str] = None) -> str:
    """
    Send raw audio bytes to ElevenLabs Scribe and return the transcript text.
    Expects 'text' field in JSON response.
    """
    if not audio_bytes:
        raise ValueError("Empty audio payload")

    api_key = _get_api_key()
    url = _get_stt_url()

    headers = {
        "xi-api-key": api_key
    }

    files = {
        "file": ("audio", audio_bytes, mime_type or "application/octet-stream")
    }
    # Provide model selection; default to scribe v1 for batch accuracy
    data = {
        "model_id": os.getenv("ELEVENLABS_STT_MODEL_ID", "scribe_v1")
    }

    response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
    try:
        response.raise_for_status()
    except requests.HTTPError as http_err:
        # Try to surface API error body if available
        try:
            payload = response.json()
        except Exception:
            payload = {"error": response.text}
        raise RuntimeError(f"ElevenLabs STT error: {payload}") from http_err

    try:
        body = response.json()
    except json.JSONDecodeError:
        raise RuntimeError("Invalid JSON response from ElevenLabs")

    text = body.get("text")
    if not text:
        # some responses may nest results; fallback to entire payload for debugging
        raise RuntimeError("Transcription returned no text")

    return text


