"""
Oxygen Sports — AI Service
Handles prompt construction and API calls to OpenAI or Gemini.
"""

import json
import re
import openai
import google.generativeai as genai
from config import Config


# ── Prompt Builder ────────────────────────────────────────────────────────────

def build_prompt(player: str, sport: str, format: str, level: str, notes: str) -> str:
    notes_text = notes.strip() if notes and notes.strip() else "None"

    prompt = f"""You are an elite sports performance coach working with Oxygen Sports.

Generate a pre-match preparation checklist for this athlete.

Player: {player}
Sport: {sport}
Match Format: {format}
Level: {level}
Notes: {notes_text}

Return a JSON object with exactly these 4 keys: equipment, warmup, nutrition, mental.
Each key must have an array of exactly 5 short actionable strings.
Items must be specific to {sport} ({format}) at {level} level.

Example:
{{
  "equipment": ["item1", "item2", "item3", "item4", "item5"],
  "warmup":    ["item1", "item2", "item3", "item4", "item5"],
  "nutrition": ["item1", "item2", "item3", "item4", "item5"],
  "mental":    ["item1", "item2", "item3", "item4", "item5"]
}}"""

    return prompt


# ── Response Parser ───────────────────────────────────────────────────────────

def parse_ai_response(raw_text: str) -> dict:
    clean = raw_text.strip()

    # Remove markdown fences
    clean = re.sub(r'```json\s*', '', clean)
    clean = re.sub(r'```\s*', '', clean)

    # Find last complete JSON object
    last_open  = clean.rfind('{')
    last_close = clean.rfind('}')

    if last_open == -1 or last_close == -1 or last_open > last_close:
        first_open = clean.find('{')
        if first_open != -1 and last_close != -1:
            clean = clean[first_open:last_close+1]
        else:
            raise ValueError(f"No JSON object found.\nRaw: {raw_text[:400]}")
    else:
        clean = clean[last_open:last_close+1]

    # Collapse whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()

    try:
        data = json.loads(clean)
    except json.JSONDecodeError:
        matches = re.findall(r'\{[^{}]*\}', raw_text, re.DOTALL)
        for match in reversed(matches):
            try:
                data = json.loads(re.sub(r'\s+', ' ', match))
                break
            except Exception:
                continue
        else:
            raise ValueError(f"Could not parse JSON.\nRaw: {raw_text[:400]}")

    required_keys = {"equipment", "warmup", "nutrition", "mental"}
    missing = required_keys - set(data.keys())
    if missing:
        raise ValueError(f"AI response missing keys: {missing}")

    for key in required_keys:
        if not isinstance(data[key], list) or len(data[key]) < 1:
            raise ValueError(f"Key '{key}' must be a non-empty list.")
        data[key] = [str(item).strip() for item in data[key]]

    return data


# ── OpenAI Call ───────────────────────────────────────────────────────────────

def call_openai(prompt: str) -> dict:
    client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

    response = client.chat.completions.create(
        model=Config.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an elite sports performance coach. Always respond with pure JSON only."},
            {"role": "user",   "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    raw_text = response.choices[0].message.content
    return parse_ai_response(raw_text)


# ── Gemini Call ───────────────────────────────────────────────────────────────

def call_gemini(prompt: str) -> dict:
    genai.configure(api_key=Config.GEMINI_API_KEY)

    model = genai.GenerativeModel(
        model_name=Config.GEMINI_MODEL,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
            max_output_tokens=2048,
        )
    )

    strict_prompt = """Return ONLY a JSON object. No markdown. No explanation. No thinking. Just JSON.

The JSON must have exactly these 4 keys: equipment, warmup, nutrition, mental.
Each key must have an array of exactly 5 strings.
Each string must be SHORT — maximum 10 words each.

""" + prompt

    response  = model.generate_content(strict_prompt)
    raw_text  = response.text.strip()

    # Remove ALL markdown fences
    raw_text = re.sub(r'```json', '', raw_text)
    raw_text = re.sub(r'```', '', raw_text)
    raw_text = raw_text.strip()

    # Find first { and last }
    start = raw_text.find('{')
    end   = raw_text.rfind('}')

    if start == -1 or end == -1:
        raise ValueError(f"No JSON found.\nRaw: {raw_text[:300]}")

    json_str = raw_text[start:end+1]

    # Fix multiline strings — replace newline+spaces inside the JSON
    json_str = re.sub(r',\s*\n\s*"', ', "', json_str)
    json_str = re.sub(r'\[\s*\n\s*"', '["', json_str)
    json_str = re.sub(r'"\s*\n\s*\]', '"]', json_str)
    json_str = re.sub(r'"\s*\n\s*,', '",', json_str)
    json_str = re.sub(r':\s*\n\s*\[', ': [', json_str)
    json_str = re.sub(r'\n', ' ', json_str)
    json_str = re.sub(r'\s{2,}', ' ', json_str)

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse failed: {e}\nCleaned: {json_str[:400]}")

    required_keys = {"equipment", "warmup", "nutrition", "mental"}
    missing = required_keys - set(data.keys())
    if missing:
        raise ValueError(f"Missing keys: {missing}")

    for key in required_keys:
        if not isinstance(data[key], list) or len(data[key]) < 1:
            raise ValueError(f"Key '{key}' must be a list.")
        data[key] = [str(item).strip() for item in data[key]]

    return data


# ── Main Dispatcher ───────────────────────────────────────────────────────────

def generate_checklist(player: str, sport: str, format: str, level: str, notes: str) -> dict:
    prompt   = build_prompt(player, sport, format, level, notes)
    provider = Config.AI_PROVIDER.lower()

    if provider == "openai":
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in .env")
        return call_openai(prompt)

    elif provider == "gemini":
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in .env")
        return call_gemini(prompt)

    else:
        raise ValueError(f"Unknown AI_PROVIDER '{provider}'. Use 'openai' or 'gemini'.")