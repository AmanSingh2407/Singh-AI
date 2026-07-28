from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


def query_grok(prompt: str, model: str | None = None, system_prompt: str | None = None) -> str:
    api_key = os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        return "[Error: GROK_API_KEY is not set in environment or .env file]"

    if api_key.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        use_model = model or "llama-3.3-70b-versatile"
    else:
        url = "https://api.x.ai/v1/chat/completions"
        use_model = model or "grok-2"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
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
            return "⚠️ **Invalid or Expired API Key (HTTP 401/403)**\n\nYour API key is invalid, revoked, or expired.\n\n👉 **To fix this:**\n1. Get a free API key from [https://console.groq.com/keys](https://console.groq.com/keys) (starts with `gsk_`) or xAI [https://console.x.ai/](https://console.x.ai/) (starts with `xai-`).\n2. Open your `.env` file and update your key:\n   ```env\n   GROK_API_KEY=your_new_key_here\n   ```\n3. Restart the server or update it on Render dashboard."
        return f"[HTTP Error {e.code}: {body}]"
    except Exception as e:
        return f"[Connection Error: {e}]"
