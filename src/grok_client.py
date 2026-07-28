from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


def query_grok(prompt: str, model: str | None = None, system_prompt: str | None = None) -> str:
    api_key = (
        os.environ.get("OPENROUTER_API_KEY")
        or os.environ.get("GROK_API_KEY")
        or os.environ.get("XAI_API_KEY")
        or os.environ.get("GROQ_API_KEY")
    )
    if not api_key:
        return "[Error: OPENROUTER_API_KEY or GROK_API_KEY is not set in environment or .env file]"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    if api_key.startswith("sk-or-v1-") or "OPENROUTER_API_KEY" in os.environ:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers["HTTP-Referer"] = "https://singh-ai.onrender.com"
        headers["X-Title"] = "Singh AI"
        
        model_map = {
            "Singh AI 3": "meta-llama/llama-3.3-70b-instruct:free",
            "Singh AI Flash": "google/gemini-2.0-flash-exp:free",
            "Singh AI Pro": "deepseek/deepseek-r1:free",
            "DeepSeek R1": "deepseek/deepseek-r1:free",
            "Llama 3.3": "meta-llama/llama-3.3-70b-instruct:free",
            "Gemini 2.0 Flash": "google/gemini-2.0-flash-exp:free",
        }
        use_model = model_map.get(model, model or "meta-llama/llama-3.3-70b-instruct:free")
    elif api_key.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        use_model = model or "llama-3.3-70b-versatile"
    else:
        url = "https://api.x.ai/v1/chat/completions"
        use_model = model or "grok-2"

    sys_msg = system_prompt or "You are an expert AI coding assistant. Provide clean, correct, and fully working code with clear explanations."
    payload = {
        "model": use_model,
        "messages": [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return resp_data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        if e.code in (401, 403):
            return (
                "⚠️ **Invalid or Expired API Key (HTTP 401/403)**\n\n"
                "Your OpenRouter/Groq API key is invalid or revoked.\n\n"
                "👉 **To fix this:**\n"
                "1. Get a free API key from [https://openrouter.ai/keys](https://openrouter.ai/keys) (starts with `sk-or-v1-`) or [https://console.groq.com/keys](https://console.groq.com/keys).\n"
                "2. Open `.env` and set:\n"
                "   ```env\n"
                "   OPENROUTER_API_KEY=sk-or-v1-...\n"
                "   ```\n"
                "3. Restart the server or update it on Render dashboard."
            )
        return f"[HTTP Error {e.code}: {body}]"
    except Exception as e:
        return f"[Connection Error: {e}]"
