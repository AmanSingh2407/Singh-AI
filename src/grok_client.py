from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


def query_grok(prompt: str, model: str | None = None, system_prompt: str | None = None) -> str:
    from pathlib import Path
    from .setup import load_env_file
    root_dir = Path(__file__).resolve().parent.parent
    load_env_file(root_dir)

    openrouter_key = (os.environ.get("OPENROUTER_API_KEY") or "").strip().replace('"', '').replace("'", "")
    grok_key = (os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY") or os.environ.get("GROQ_API_KEY") or "").strip().replace('"', '').replace("'", "")

    providers_to_try = []

    if openrouter_key.startswith("sk-or-v1-"):
        providers_to_try.append(("openrouter", openrouter_key))
    if grok_key.startswith("gsk_"):
        providers_to_try.append(("groq", grok_key))
    if grok_key.startswith("sk-or-v1-") and ("openrouter", grok_key) not in providers_to_try:
        providers_to_try.append(("openrouter", grok_key))
    if openrouter_key and ("openrouter", openrouter_key) not in providers_to_try:
        providers_to_try.append(("openrouter", openrouter_key))
    if grok_key and not grok_key.startswith("gsk_") and not grok_key.startswith("sk-or-v1-"):
        providers_to_try.append(("xai", grok_key))

    if not providers_to_try:
        return "[Error: Neither OPENROUTER_API_KEY nor GROK_API_KEY is configured]"

    sys_msg = system_prompt or "You are an expert AI coding assistant. Provide clean, correct, and fully working code with clear explanations."
    last_error_body = ""

    for provider_type, api_key in providers_to_try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        if provider_type == "openrouter":
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers["HTTP-Referer"] = "https://singh-ai.onrender.com"
            headers["X-Title"] = "Singh AI"
            model_map = {
                "Singh AI 3": "meta-llama/llama-3.3-70b-instruct:free",
                "Singh AI Flash": "google/gemini-2.0-flash-exp:free",
                "Singh AI Pro": "meta-llama/llama-3.3-70b-instruct:free",
                "DeepSeek R1": "deepseek/deepseek-r1:free",
                "Llama 3.3": "meta-llama/llama-3.3-70b-instruct:free",
            }
            use_model = model_map.get(model, "meta-llama/llama-3.3-70b-instruct:free")
            fallback_models = [
                use_model,
                "meta-llama/llama-3.3-70b-instruct:free",
                "google/gemini-2.0-flash-lite-preview-02-05:free",
                "google/gemini-2.0-flash-exp:free",
                "qwen/qwen-2.5-coder-32b-instruct:free",
                "mistralai/mistral-7b-instruct:free",
                "meta-llama/llama-3.3-70b-instruct",
            ]
        elif provider_type == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            use_model = model or "llama-3.3-70b-versatile"
            fallback_models = [use_model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
        else:
            url = "https://api.x.ai/v1/chat/completions"
            use_model = model or "grok-2"
            fallback_models = [use_model]

        for try_model in fallback_models:
            payload = {
                "model": try_model,
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
                last_error_body = e.read().decode("utf-8", errors="ignore")
                continue
            except Exception as e:
                last_error_body = str(e)
                continue

    return f"[API Error: {last_error_body or 'All provider attempts failed'}]"
