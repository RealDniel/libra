# backend/factchecker.py
import os
import dotenv
import requests
import json
from openai import OpenAI

# Load env variables
dotenv.load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_CSE_ID = os.getenv("CUSTOM_SEARCH_ENGINE_ID")
OPEN_AI_KEY = os.getenv("OPEN_AI_KEY")

# Debug: Print to verify keys are loaded (remove in production)
print(f"Google API Key loaded: {bool(GOOGLE_API_KEY)}")
print(f"Google CSE ID loaded: {bool(GOOGLE_CSE_ID)}")
print(f"OpenAI Key loaded: {bool(OPEN_AI_KEY)}")

if not all([GOOGLE_API_KEY, GOOGLE_CSE_ID, OPEN_AI_KEY]):
    raise ValueError("Missing required API keys in .env file")

client = OpenAI(api_key=OPEN_AI_KEY)

class FactCheckerAgent:
    """
    Fact-checking agent that:
    1. Uses Google to gather evidence
    2. Sends evidence + claim to an LLM
    3. The LLM may request additional searches
    4. Returns final verdict with explanation
    """

    def __init__(self):
        self.max_iterations = 3  # Prevent infinite loops

    def google_search(self, query):
        """Perform a Google Custom Search and extract relevant snippets."""
        try:
            print(f"Searching Google for: {query}")
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": GOOGLE_API_KEY,
                "cx": GOOGLE_CSE_ID,
                "q": query,
                "num": 5  # Get top 5 results
            }
            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            
            data = res.json()
            
            # Extract only relevant information
            if "items" in data:
                snippets = []
                for item in data["items"][:5]:  # Limit to 5 results
                    snippets.append({
                        "title": item.get("title", ""),
                        "snippet": item.get("snippet", ""),
                        "link": item.get("link", "")
                    })
                print(f"Found {len(snippets)} results")
                return {"query": query, "results": snippets}
            else:
                print("No results found")
                return {"query": query, "results": [], "error": "No results found"}
                
        except requests.exceptions.Timeout:
            print("Google Search timeout")
            return {"query": query, "error": "Search timeout", "results": []}
        except requests.exceptions.RequestException as e:
            print(f"Google Search Error: {e}")
            return {"query": query, "error": str(e), "results": []}
        except Exception as e:
            print(f"Unexpected error in google_search: {e}")
            return {"query": query, "error": str(e), "results": []}

    def call_llm(self, claim, evidence):
        """
        Send the claim + evidence to the LLM.
        The LLM decides:
            - true / false / unknown
            - if it needs another search
        """
        try:
            system_prompt = """You are a fact-checking AI. You are given:
1. A claim to verify
2. Evidence from Google search results

Your tasks:
- Carefully analyze the evidence to determine if the claim is TRUE, FALSE, or UNKNOWN
- Explain your reasoning based on the evidence
- If the evidence is insufficient or unclear, request more information by responding with:
    {"action": "search", "query": "specific search query to find more information"}

Otherwise, respond with:
    {"action": "final", "result": "true", "explanation": "detailed explanation"}
    OR
    {"action": "final", "result": "false", "explanation": "detailed explanation"}
    OR
    {"action": "final", "result": "unknown", "explanation": "detailed explanation"}

IMPORTANT: 
- Always respond with valid JSON only
- The "result" field must be exactly "true", "false", or "unknown" (lowercase)
- Be specific in your explanations and cite evidence when possible
"""
            
            # Format evidence in a readable way
            evidence_text = ""
            for i, search_result in enumerate(evidence, 1):
                evidence_text += f"\n--- Search {i}: {search_result.get('query', 'N/A')} ---\n"
                if search_result.get('error'):
                    evidence_text += f"Error: {search_result['error']}\n"
                for j, result in enumerate(search_result.get('results', []), 1):
                    evidence_text += f"\nResult {j}:\n"
                    evidence_text += f"Title: {result.get('title', 'N/A')}\n"
                    evidence_text += f"Snippet: {result.get('snippet', 'N/A')}\n"
                    evidence_text += f"Source: {result.get('link', 'N/A')}\n"

            user_prompt = f"""Claim to verify:
{claim}

Evidence from searches:
{evidence_text}

Based on this evidence, determine if the claim is true, false, or unknown. Respond in JSON format only."""
            
            print("Calling OpenAI API...")
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using the correct model name
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent responses
                max_tokens=1000
            )
            
            result = json.loads(response.choices[0].message.content)
            print(f"LLM Response: {result}")
            
            # Validate response format
            if "action" not in result:
                print("Warning: LLM response missing 'action' field")
                return {
                    "action": "final",
                    "result": "unknown",
                    "explanation": "Invalid LLM response format"
                }
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response: {response.choices[0].message.content if 'response' in locals() else 'N/A'}")
            return {
                "action": "final",
                "result": "unknown",
                "explanation": "Error parsing LLM response"
            }
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "action": "final",
                "result": "unknown",
                "explanation": f"LLM error: {str(e)}"
            }

    def check_statement(self, statement):
        """
        Run iterative fact-checking:
        - Search Google
        - Ask LLM to evaluate
        - Repeat if needed (up to max_iterations)
        """
        try:
            if not statement or not statement.strip():
                return {
                    "statement": statement,
                    "result": "error",
                    "explanation": "Empty statement provided",
                    "evidence": []
                }
            
            all_evidence = []
            iteration = 0
            
            print(f"\n{'='*60}")
            print(f"Fact-checking: {statement}")
            print(f"{'='*60}")
            
            # First search
            search_results = self.google_search(statement)
            all_evidence.append(search_results)

            # Ask LLM to analyze
            llm_response = self.call_llm(statement, all_evidence)

            # Loop: model requests more searches
            while llm_response.get("action") == "search" and iteration < self.max_iterations:
                iteration += 1
                query = llm_response.get("query", statement)
                print(f"\nIteration {iteration}: LLM requested additional search")
                print(f"Query: {query}")
                
                new_results = self.google_search(query)
                all_evidence.append(new_results)
                
                # Ask again with more evidence
                llm_response = self.call_llm(statement, all_evidence)

            # Final response
            if llm_response.get("action") == "final":
                result = {
                    "statement": statement,
                    "result": llm_response.get("result", "unknown").lower(),
                    "explanation": llm_response.get("explanation", "No explanation provided"),
                    "evidence": all_evidence,
                }
                print(f"\nFinal verdict: {result['result'].upper()}")
                print(f"{'='*60}\n")
                return result

            # Fallback if max iterations reached
            print(f"\nMax iterations ({self.max_iterations}) reached")
            return {
                "statement": statement,
                "result": "unknown",
                "explanation": f"Unable to reach conclusion after {self.max_iterations} searches. {llm_response.get('explanation', '')}",
                "evidence": all_evidence,
            }
            
        except Exception as e:
            print(f"Error in check_statement: {e}")
            import traceback
            traceback.print_exc()
            return {
                "statement": statement,
                "result": "error",
                "explanation": f"Error during fact-checking: {str(e)}",
                "evidence": [],
            }

    def check_text(self, text):
        """Fact-check multiple statements from a long input."""
        # Split by periods, but be smarter about it
        statements = []
        for sentence in text.split("."):
            sentence = sentence.strip()
            if sentence and len(sentence) > 10:  # Ignore very short fragments
                statements.append(sentence)
        
        results = []
        for i, statement in enumerate(statements, 1):
            print(f"\nChecking statement {i}/{len(statements)}")
            res = self.check_statement(statement)
            results.append(res)
        
        return results


# Test function (optional - remove in production)
if __name__ == "__main__":
    print("Testing FactCheckerAgent...")
    agent = FactCheckerAgent()
    
    # Test with a simple claim
    result = agent.check_statement("The Earth is round")
    print("\n" + "="*60)
    print("TEST RESULT:")
    print(json.dumps(result, indent=2))
    print("="*60)