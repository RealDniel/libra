# backend/factchecker.py
import os
import dotenv
import requests
import json
import time
from openai import OpenAI

# Load environment variables
dotenv.load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_CSE_ID = os.getenv("CUSTOM_SEARCH_ENGINE_ID")
OPEN_AI_KEY = os.getenv("OPEN_AI_KEY")

if not all([GOOGLE_API_KEY, GOOGLE_CSE_ID, OPEN_AI_KEY]):
    raise ValueError("Missing required API keys in .env file")

client = OpenAI(api_key=OPEN_AI_KEY)


class FactCheckerAgent:
    """
    Option A pipeline:
      1) Extract factual statements from text
      2) Check each statement via Google + LLM
      3) Return structured JSON results
    """

    def __init__(self, max_iterations=3, google_results=5):
        self.max_iterations = max_iterations
        self.google_results = google_results

    # -------------------------
    # 1) Extract factual statements
    # -------------------------
    def extract_factual_statements(self, text: str):
        system_prompt = (
            "You are an assistant that extracts checkable factual claims from a text. You are trying to determine the truth of these claims, so claims that the user would gain nothing from lying about can be skipped. A factual claim is a statement that makes an assertion about the world, society, or measurable reality, which could in principle be verified or refuted. Exclude opinions, commands, vague statements, greetings, self-identifying information (like names, birthdays, or locations), or statements about personal experience that are irrelevant to broader factual knowledge. Respond only in JSON format:"
            "{"
            "\"statements\": ["
            "    ..."
            "]"
            "}"
        )
        user_prompt = f"Input text:\n\"\"\"{text}\"\"\"\nExtract statements of fact."

        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=800
            )
            raw_content = resp.choices[0].message.content
            if isinstance(raw_content, dict):
                data = raw_content
            else:
                data = json.loads(raw_content)

            statements = data.get("statements", [])
            cleaned = [s.strip().rstrip(".") for s in statements if isinstance(s, str) and s.strip()]
            return cleaned

        except Exception as e:
            print(f"Error extracting statements: {e}")
            # fallback split by sentences
            fallback = [s.strip() for s in text.split(".") if s.strip() and len(s) > 15]
            return fallback

    # -------------------------
    # 2) Google Search
    # -------------------------
    def google_search(self, query: str):
        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": GOOGLE_API_KEY,
                "cx": GOOGLE_CSE_ID,
                "q": query,
                "num": self.google_results
            }
            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            data = res.json()
            snippets = []
            if "items" in data:
                for item in data["items"][:self.google_results]:
                    snippets.append({
                        "title": item.get("title", ""),
                        "snippet": item.get("snippet", ""),
                        "link": item.get("link", "")
                    })
            return {"query": query, "results": snippets}
        except requests.exceptions.RequestException as e:
            return {"query": query, "error": str(e), "results": []}
        except Exception as e:
            return {"query": query, "error": str(e), "results": []}

    # -------------------------
    # 3) LLM verdict
    # -------------------------
    def call_llm_for_verdict(self, statement: str, evidence_list: list, force_final=False):
        system_prompt = (
            "You are a careful fact-checker. Determine if the statement is 'true', 'false', "
            "or 'unknown' based on evidence. Respond with JSON only. "
            "Fields: {action:'final', result:'true'|'false'|'unknown', explanation:'...'}"
            "If multiple sources support the statement, then it is reasonable to conclude the statement is true. If no sources support the statement or if there are more sources against the statementthan there are supporting it, it is reasonable to conclude the statement is false. Only return unknown if the statement is vague and no sources exist to support or deny the statement"
        )

        evidence_text = ""
        for idx, ev in enumerate(evidence_list, 1):
            evidence_text += f"\n--- Search {idx}: {ev.get('query','N/A')} ---\n"
            if ev.get("error"):
                evidence_text += f"Error: {ev['error']}\n"
            for j, r in enumerate(ev.get("results", []), 1):
                evidence_text += (
                    f"\nResult {j}:\nTitle: {r.get('title','N/A')}\n"
                    f"Snippet: {r.get('snippet','N/A')}\nLink: {r.get('link','N/A')}\n"
                )

        user_prompt = f"Statement:\n{statement}\nEvidence:{evidence_text}\n"
        if force_final:
            user_prompt += "You must return a final verdict even if evidence is limited."

        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.15,
                max_tokens=800
            )
            raw = resp.choices[0].message.content
            if isinstance(raw, dict):
                data = raw
            else:
                data = json.loads(raw)
            # Ensure 'action' exists
            if "action" not in data:
                data["action"] = "final"
                data["result"] = data.get("result", "unknown")
                data["explanation"] = data.get("explanation", "")
            return data
        except Exception as e:
            print(f"LLM verdict error: {e}")
            return {"action": "final", "result": "unknown", "explanation": str(e)}

    # -------------------------
    # 4) Single statement check
    # -------------------------
    def check_single_statement(self, statement: str):
        all_evidence = []
        iteration = 0

        initial = self.google_search(statement)
        all_evidence.append(initial)

        while iteration < self.max_iterations:
            llm_resp = self.call_llm_for_verdict(
                statement, all_evidence, force_final=(iteration == self.max_iterations - 1)
            )

            if llm_resp.get("action") == "final":
                result = llm_resp.get("result", "unknown").lower()
                explanation = llm_resp.get("explanation", "")
                if result not in ("true", "false", "unknown"):
                    result = "unknown"
                return {
                    "statement": statement,
                    "verdict": result,
                    "explanation": explanation,
                    "evidence": all_evidence
                }

            # If action==search
            iteration += 1
            query = llm_resp.get("query") or statement
            new_res = self.google_search(query)
            all_evidence.append(new_res)

        # fallback
        return {
            "statement": statement,
            "verdict": "unknown",
            "explanation": f"Unable to conclude after {self.max_iterations} iterations.",
            "evidence": all_evidence
        }

    # -------------------------
    # 5) Main entrypoint
    # -------------------------
    def check_text(self, text: str):
        statements = self.extract_factual_statements(text)
        results = []
        for s in statements:
            print(f"Checking statement: {s}")
            res = self.check_single_statement(s)
            results.append(res)
            time.sleep(0.3)
        return results


# -------------------------
# Manual test
# -------------------------
if __name__ == "__main__":
    agent = FactCheckerAgent(max_iterations=3, google_results=5)

    sample_text = (
        "The Eiffel Tower is in Berlin. The Moon is made of cheese. "
        "The global population surpassed 8 billion in 2022. Dogs have four legs."
    )

    print("Running fact-check on sample text...\n")
    out = agent.check_text(sample_text)
    print("\nRESULTS:")
    print(json.dumps(out, indent=2))
