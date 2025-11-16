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
	Uses sentence-by-sentence classification as expected by the fine-tuned model.
	"""
	if not text or not text.strip():
		raise ValueError("Empty text")

	client = _get_openai_client()
	model_id = _get_model_id()

	# Split text into sentences (basic split by punctuation)
	import re
	sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
	
	# Number the sentences
	numbered_sentences = "\n".join([f"{i+1}. {s}" for i, s in enumerate(sentences)])
	
	# System prompt matching your friend's model training
	system_msg = (
		"Classify each sentence into exactly one label from the allowed set. "
		"Use the full paragraph context. Only label a fallacy if clear, else 'none'. "
		"Respond ONLY in JSON: results=[{index,label,confidence}] (confidence 0..1)."
	)
	
	# Allowed labels from the fine-tuned model
	allowed_labels = (
		"ad hominem, ad populum, appeal to emotion, circular reasoning, equivocation, "
		"fallacy of credibility, fallacy of extension, fallacy of logic, fallacy of relevance, "
		"false causality, false dilemma, faulty generalization, intentional, miscellaneous, none"
	)
	
	# User prompt format matching training data
	user_msg = (
		f"Allowed labels: {allowed_labels}.\n"
		f"Paragraph: {text}\n"
		f"Sentences (numbered):\n{numbered_sentences}\n\n"
		f"Return JSON with array 'results', each item: {{index, label, confidence}}."
	)

	# Call the fine-tuned model
	response = client.chat.completions.create(
		model=model_id,
		temperature=0,
		response_format={"type": "json_object"},
		messages=[
			{"role": "system", "content": system_msg},
			{"role": "user", "content": user_msg},
		],
	)

	content = response.choices[0].message.content if response.choices else ""
	if not content:
		raise RuntimeError("Model returned empty content")

	try:
		result = json.loads(content)
		
		# Transform model output to our expected format
		# Model returns: {"results": [{"index": 1, "label": "ad hominem", "confidence": 0.95}, ...]}
		# We need: {"fallacies": [{"type": "Ad Hominem", "quote": "...", "explanation": "..."}, ...]}
		
		fallacies = []
		if "results" in result:
			for item in result["results"]:
				label = item.get("label", "none").strip().lower()
				if label != "none":
					sentence_idx = item.get("index", 1) - 1  # Convert to 0-based
					quote = sentences[sentence_idx] if 0 <= sentence_idx < len(sentences) else text
					
					# Convert label to title case
					fallacy_type = label.replace("_", " ").title()
					
					fallacies.append({
						"type": fallacy_type,
						"quote": quote,
						"explanation": f"This statement contains {fallacy_type.lower()}, which undermines logical reasoning.",
						"confidence": item.get("confidence", 0)
					})
		
		return {"fallacies": fallacies}
		
	except json.JSONDecodeError as e:
		raise RuntimeError("Model response was not valid JSON") from e


def analyze_audio_to_json(audio_bytes: bytes, mime_type: Optional[str] = None) -> Dict[str, Any]:
	"""
	Transcribe audio with ElevenLabs, then send transcript to the fine-tuned model.
	Return the model's JSON.
	"""
	transcript = transcribe_audio(audio_bytes=audio_bytes, mime_type=mime_type)
	return generate_json_from_text(transcript)


