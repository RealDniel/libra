import json
import os
from typing import Any, Dict, Optional

from openai import OpenAI

from services.transcription import transcribe_audio


def _get_openai_client() -> OpenAI:
	"""
	Initialize and return an OpenAI client using OPENAI_API_KEY from env.
	"""
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		raise ValueError("OPENAI_API_KEY is not set")
	return OpenAI(api_key=api_key)


def _get_model_id() -> str:
	"""
	Read the fine-tuned model id from env OPENAI_MODEL_ID.
	The user will provide this value.
	"""
	model_id = os.getenv("OPENAI_MODEL_ID")
	if not model_id:
		raise ValueError("OPENAI_MODEL_ID is not set")
	return model_id


def generate_json_from_text(text: str, system_preamble: Optional[str] = None) -> Dict[str, Any]:
	"""
	Send the provided text to the fine-tuned model and return parsed JSON.
	If the model does not return valid JSON, raise a clear error.
	"""
	if not text or not text.strip():
		raise ValueError("Empty text")

	client = _get_openai_client()
	model_id = _get_model_id()

	system_msg = system_preamble or (
		"You must respond with a single valid JSON object only. "
		"No markdown, no code fences, no prose. Return strictly JSON."
	)

	# Attempt to enforce JSON output via response_format when supported
	response = client.chat.completions.create(
		model=model_id,
		response_format={"type": "json_object"},
		messages=[
			{"role": "system", "content": system_msg},
			{"role": "user", "content": text},
		],
	)

	content = response.choices[0].message.content if response.choices else ""
	if not content:
		raise RuntimeError("Model returned empty content")

	try:
		return json.loads(content)
	except json.JSONDecodeError as e:
		# Provide actionable message for the caller
		raise RuntimeError("Model response was not valid JSON") from e


def analyze_audio_to_json(audio_bytes: bytes, mime_type: Optional[str] = None) -> Dict[str, Any]:
	"""
	Transcribe audio with ElevenLabs, then send transcript to the fine-tuned model.
	Return the model's JSON.
	"""
	transcript = transcribe_audio(audio_bytes=audio_bytes, mime_type=mime_type)
	return generate_json_from_text(transcript)


