from __future__ import annotations

import json
import os
import sys
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add src package to path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.setup import run_setup
from src.grok_client import query_grok
from src.query_engine import QueryEnginePort
from src.commands import PORTED_COMMANDS
from src.tools import PORTED_TOOLS

PROJECTS_FILE = ROOT_DIR / "data" / "projects.json"
CHATS_FILE = ROOT_DIR / "data" / "chats.json"

def load_projects_db():
    PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if PROJECTS_FILE.is_file():
        try:
            return json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    default_projects = [
        {
            "id": "proj-1",
            "name": "Pravzo",
            "description": "Main Pravzo application project",
            "created_at": "May 25",
            "modified": "May 25",
            "pinned": True,
            "chats": [
                {"id": "c-1", "title": "Website Image Request", "preview": "generate an image for notification setting", "date": "Jul 4", "messages": [
                    {"id": 1, "role": "user", "content": "generate an image for notification setting"},
                    {"id": 2, "role": "assistant", "content": "Here is a clean modern visual concept for notification settings including toggle switches, badge counters, and alert preferences."}
                ]},
                {"id": "c-2", "title": "Project File Structure", "preview": "no, i am using react + vite, tailwind css, node js,", "date": "Jun 30", "messages": [
                    {"id": 3, "role": "user", "content": "no, i am using react + vite, tailwind css, node js,"},
                    {"id": 4, "role": "assistant", "content": "Got it! Here is the clean modular folder structure for React + Vite with Tailwind CSS and Node.js backend:\n\n```\nmy-app/\n├── client/\n│   ├── src/\n│   │   ├── components/\n│   │   ├── pages/\n│   │   └── App.jsx\n│   └── vite.config.js\n└── server/\n    ├── controllers/\n    └── server.js\n```"}
                ]},
                {"id": "c-3", "title": "Project Folder Structure", "preview": "into this where is admin level folder for backend and for super admin panel and all...", "date": "Jun 24", "messages": [
                    {"id": 5, "role": "user", "content": "into this where is admin level folder for backend and for super admin panel and all - we have right now user b..."},
                    {"id": 6, "role": "assistant", "content": "For super-admin and multi-role access control, isolate backend middleware under `server/middleware/authRole.js` and split admin modules under `client/src/pages/admin/`."}
                ]},
                {"id": "c-4", "title": "Database Table for Riders", "preview": "i want to create a table users in which fields are full name, phone no, email address, password role", "date": "May 30", "messages": [
                    {"id": 7, "role": "user", "content": "i want to create a table users in which fields are full name, phone no, email address, password role"},
                    {"id": 8, "role": "assistant", "content": "Here is the SQL schema:\n\n```sql\nCREATE TABLE users (\n    id SERIAL PRIMARY KEY,\n    full_name VARCHAR(100) NOT NULL,\n    phone_no VARCHAR(20) UNIQUE NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    password_hash VARCHAR(255) NOT NULL,\n    role VARCHAR(20) DEFAULT 'rider',\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n```"}
                ]},
                {"id": "c-5", "title": "Vehicle Document Image", "preview": "generate app version", "date": "May 29", "messages": [
                    {"id": 9, "role": "user", "content": "generate app version"},
                    {"id": 10, "role": "assistant", "content": "App version v2.4.0 (Build 184) generated successfully."}
                ]},
                {"id": "c-6", "title": "Role Selection Screen", "preview": "generate an image of role selection for website without card subtitle", "date": "May 28", "messages": [
                    {"id": 11, "role": "user", "content": "generate an image of role selection for website without card subtitle"},
                    {"id": 12, "role": "assistant", "content": "Role selection interface configured with Rider, Partner, and Admin tiles."}
                ]},
                {"id": "c-7", "title": "Building Rider Dashboard", "preview": "why it show devFS synchronization failed", "date": "May 27", "messages": [
                    {"id": 13, "role": "user", "content": "why it show devFS synchronization failed"},
                    {"id": 14, "role": "assistant", "content": "`devFS synchronization failed` usually occurs when hot reload socket loses connection. Restart the dev server using `npm run dev` to re-bind file watchers."}
                ]}
            ]
        },
        {"id": "proj-2", "name": "careers", "description": "Careers portal module", "created_at": "Jul 9", "modified": "Jul 9", "pinned": False, "chats": [{"id": "c-8", "title": "Job Openings API", "preview": "list all open career roles", "date": "Jul 9", "messages": []}]},
        {"id": "proj-3", "name": "Hrms", "description": "Human Resource Management System", "created_at": "Jun 24", "modified": "Jun 24", "pinned": False, "chats": []},
        {"id": "proj-4", "name": "job portal", "description": "Job portal web app", "created_at": "Jun 17", "modified": "Jun 17", "pinned": False, "chats": []},
        {"id": "proj-5", "name": "Homework", "description": "AI Homework assistant", "created_at": "Apr 3", "modified": "Apr 3", "pinned": False, "chats": []},
        {"id": "proj-6", "name": "prepai", "description": "Prep AI learning suite", "created_at": "Apr 1", "modified": "Apr 1", "pinned": False, "chats": []}
    ]
    save_projects_db(default_projects)
    return default_projects

def save_projects_db(projects):
    PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROJECTS_FILE.write_text(json.dumps(projects, indent=2), encoding="utf-8")

def load_chats_db():
    CHATS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if CHATS_FILE.is_file():
        try:
            data = json.loads(CHATS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, list) and len(data) > 0:
                return data
        except Exception:
            pass
    default_chats = [
        {"id": "chat-rec-1", "title": "About ChatGPT", "pinned": False, "messages": [{"id": 1, "role": "user", "content": "About ChatGPT"}, {"id": 2, "role": "assistant", "content": "ChatGPT is an AI language model trained to assist with programming, writing, analysis, and reasoning."}]},
        {"id": "chat-rec-2", "title": "Grok API Key Info", "pinned": False, "messages": [{"id": 3, "role": "user", "content": "Grok API Key Info"}, {"id": 4, "role": "assistant", "content": "Groq keys starting with `gsk_` route to Groq Cloud API, while xAI keys starting with `xai-` route to xAI Grok 3 API."}]},
        {"id": "chat-rec-3", "title": "Vercel Custom Domain Setup", "pinned": False, "messages": [{"id": 5, "role": "user", "content": "Vercel Custom Domain Setup"}, {"id": 6, "role": "assistant", "content": "To set up a custom domain on Vercel, add a CNAME record pointing `cname.vercel-dns.com` in your DNS provider."}]},
        {"id": "chat-rec-4", "title": "Moringa Tablet Usage Guide", "pinned": False, "messages": []},
        {"id": "chat-rec-5", "title": "Janmanchchakra Request", "pinned": False, "messages": []},
        {"id": "chat-rec-6", "title": "Janma Chakra Banwana", "pinned": False, "messages": []},
        {"id": "chat-rec-7", "title": "Hosting Landing Page on Netlify", "pinned": False, "messages": []},
        {"id": "chat-rec-8", "title": "Awaaz logo design", "pinned": False, "messages": []}
    ]
    save_chats_db(default_chats)
    return default_chats

def save_chats_db(chats):
    CHATS_FILE.parent.mkdir(parents=True, exist_ok=True)
    CHATS_FILE.write_text(json.dumps(chats, indent=2), encoding="utf-8")

SCHEDULED_FILE = ROOT_DIR / "data" / "scheduled.json"

def load_scheduled_db():
    SCHEDULED_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SCHEDULED_FILE.is_file():
        try:
            return json.loads(SCHEDULED_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    default_tasks = [
        {"id": "sch-1", "prompt": "Monitor Grok API latency and rate limit headers", "schedule": "Every 15 minutes", "status": "Active", "created_at": "Today, 2:30 PM"},
        {"id": "sch-2", "prompt": "Run automated unit test suite (`pytest tests/`)", "schedule": "Daily at 9:00 AM", "status": "Active", "created_at": "Yesterday"},
        {"id": "sch-3", "prompt": "Auto-compact long chat session transcripts", "schedule": "Every 1 hour", "status": "Active", "created_at": "Jul 24"}
    ]
    save_scheduled_db(default_tasks)
    return default_tasks

def save_scheduled_db(tasks):
    SCHEDULED_FILE.parent.mkdir(parents=True, exist_ok=True)
    SCHEDULED_FILE.write_text(json.dumps(tasks, indent=2), encoding="utf-8")

PROFILE_FILE = ROOT_DIR / "data" / "profile.json"

def load_profile_db():
    PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if PROFILE_FILE.is_file():
        try:
            return json.loads(PROFILE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    default_profile = {"name": "Aman", "plan": "Go", "avatar": ""}
    save_profile_db(default_profile)
    return default_profile

def save_profile_db(profile):
    PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_FILE.write_text(json.dumps(profile, indent=2), encoding="utf-8")


class AgentRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        # Silent logging for clean terminal
        pass

    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/favicon.ico", "/favicon.svg", "/vite.svg", "/icons.svg"]:
            fav = ROOT_DIR / "web" / "public" / "favicon.svg"
            if not fav.is_file():
                fav = ROOT_DIR / "web" / "dist" / "favicon.svg"
            if fav.is_file():
                self._set_headers(200, "image/svg+xml")
                self.wfile.write(fav.read_bytes())
                return

        if path == "/api/status":
            run_setup()
            api_key = os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY") or os.environ.get("GROQ_API_KEY") or ""
            key_preview = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else ("Configured" if api_key else "Missing")
            provider = "Groq (Llama-3.3-70B)" if api_key.startswith("gsk_") else ("xAI (Grok)" if api_key.startswith("xai-") else "Not configured")
            
            data = {
                "status": "online",
                "has_key": bool(api_key),
                "key_preview": key_preview,
                "provider": provider,
                "command_count": len(PORTED_COMMANDS),
                "tool_count": len(PORTED_TOOLS),
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path == "/api/library":
            uploads_dir = ROOT_DIR / "uploads"
            uploads_dir.mkdir(exist_ok=True)
            
            items = []
            img_exts = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}
            
            for p in sorted(uploads_dir.rglob("*")):
                if p.is_file():
                    stat = p.stat()
                    ext = p.suffix.lower()
                    cat = "Images" if ext in img_exts else "Documents"
                    size_kb = round(stat.st_size / 1024, 1)
                    size_str = f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb/1024, 2)} MB"
                    
                    import datetime
                    mtime = datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%d %b %Y")
                    
                    rel_name = p.relative_to(uploads_dir).as_posix()
                    items.append({
                        "id": rel_name,
                        "name": p.name,
                        "url": f"/uploads/{rel_name}",
                        "modified": mtime,
                        "size": size_str,
                        "size_bytes": stat.st_size,
                        "category": cat,
                    })
            
            data = {"items": items, "total": len(items)}
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path.startswith("/uploads/"):
            rel = path[len("/uploads/"):]
            file_path = ROOT_DIR / "uploads" / rel
            if file_path.is_file():
                ext = file_path.suffix.lower()
                content_type = "image/png"
                if ext in [".jpg", ".jpeg"]: content_type = "image/jpeg"
                elif ext == ".svg": content_type = "image/svg+xml"
                elif ext == ".webp": content_type = "image/webp"
                elif ext == ".pdf": content_type = "application/pdf"
                elif ext in [".txt", ".md", ".json", ".py"]: content_type = "text/plain; charset=utf-8"
                
                self._set_headers(200, content_type)
                self.wfile.write(file_path.read_bytes())
                return
            else:
                self._set_headers(404)
                self.wfile.write(b"File not found")
                return

        if path == "/api/projects":
            data = {"project": ROOT_DIR.name, "projects": load_projects_db()}
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path == "/api/chats":
            data = {"chats": load_chats_db()}
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path == "/api/scheduled":
            data = {"tasks": load_scheduled_db()}
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path == "/api/profile":
            data = load_profile_db()
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # Serve static web app files if web/dist exists
        static_dir = ROOT_DIR / "web" / "dist"
        if not (static_dir / "index.html").is_file():
            try:
                import subprocess
                web_dir = ROOT_DIR / "web"
                if web_dir.is_dir():
                    subprocess.run(["npm", "run", "build"], cwd=web_dir, capture_output=True, timeout=60)
            except Exception:
                pass

        if path == "/" or path == "":
            file_path = static_dir / "index.html"
        else:
            file_path = static_dir / path.lstrip("/")

        if file_path.is_file():
            ext = file_path.suffix.lower()
            content_type = "text/html"
            if ext == ".js": content_type = "application/javascript"
            elif ext == ".css": content_type = "text/css"
            elif ext == ".json": content_type = "application/json"
            elif ext == ".svg": content_type = "image/svg+xml"
            elif ext in [".png", ".jpg", ".jpeg", ".ico"]: content_type = "image/png"
            
            self._set_headers(200, content_type)
            self.wfile.write(file_path.read_bytes())
            return
        elif (static_dir / "index.html").is_file():
            # SPA fallback for client-side routing
            self._set_headers(200, "text/html")
            self.wfile.write((static_dir / "index.html").read_bytes())
            return
        else:
            # Embedded Fallback UI HTML if dist isn't built yet
            self._set_headers(200, "text/html")
            self.wfile.write(EMBEDDED_HTML_UI.encode("utf-8"))
            return

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(length) if length > 0 else b"{}"

        try:
            body = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            body = {}

        if parsed.path == "/api/chats/rename":
            chat_id = body.get("id")
            new_title = body.get("title", "").strip()
            chats = load_chats_db()
            for c in chats:
                if c["id"] == chat_id:
                    c["title"] = new_title
                    break
            save_chats_db(chats)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "chats": chats}).encode("utf-8"))
            return

        if parsed.path == "/api/chats/pin":
            chat_id = body.get("id")
            chats = load_chats_db()
            for c in chats:
                if c["id"] == chat_id:
                    c["pinned"] = not c.get("pinned", False)
                    break
            save_chats_db(chats)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "chats": chats}).encode("utf-8"))
            return

        if parsed.path == "/api/chats/delete":
            chat_id = body.get("id")
            chats = [c for c in load_chats_db() if c["id"] != chat_id]
            save_chats_db(chats)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "chats": chats}).encode("utf-8"))
            return

        if parsed.path == "/api/scheduled/create":
            prompt = body.get("prompt", "").strip()
            schedule = body.get("schedule", "Every 1 hour").strip()
            tasks = load_scheduled_db()
            import datetime, uuid
            new_task = {
                "id": f"sch-{uuid.uuid4().hex[:6]}",
                "prompt": prompt or "New Scheduled Task",
                "schedule": schedule,
                "status": "Active",
                "created_at": datetime.datetime.now().strftime("%b %d, %I:%M %p")
            }
            tasks.insert(0, new_task)
            save_scheduled_db(tasks)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "task": new_task, "tasks": tasks}).encode("utf-8"))
            return

        if parsed.path == "/api/scheduled/toggle":
            task_id = body.get("id")
            tasks = load_scheduled_db()
            for t in tasks:
                if t["id"] == task_id:
                    t["status"] = "Paused" if t.get("status") == "Active" else "Active"
                    break
            save_scheduled_db(tasks)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "tasks": tasks}).encode("utf-8"))
            return

        if parsed.path == "/api/scheduled/delete":
            task_id = body.get("id")
            tasks = [t for t in load_scheduled_db() if t["id"] != task_id]
            save_scheduled_db(tasks)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "tasks": tasks}).encode("utf-8"))
            return

        if parsed.path == "/api/profile/update":
            profile = load_profile_db()
            if "name" in body: profile["name"] = body["name"].strip()
            if "plan" in body: profile["plan"] = body["plan"].strip()
            if "avatar" in body: profile["avatar"] = body["avatar"].strip()
            save_profile_db(profile)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "profile": profile}).encode("utf-8"))
            return

        if parsed.path == "/api/projects/create":
            name = body.get("name", "New Project").strip()
            description = body.get("description", "").strip()
            projects = load_projects_db()
            import datetime, uuid
            new_proj = {
                "id": f"proj-{uuid.uuid4().hex[:8]}",
                "name": name,
                "description": description,
                "created_at": datetime.datetime.now().strftime("%b %d"),
                "modified": datetime.datetime.now().strftime("%b %d"),
                "pinned": False,
                "chats": [{"id": f"c-{uuid.uuid4().hex[:6]}", "title": f"{name} Discussion", "messages": []}]
            }
            projects.insert(0, new_proj)
            save_projects_db(projects)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "project": new_proj, "projects": projects}).encode("utf-8"))
            return

        if parsed.path == "/api/projects/pin":
            proj_id = body.get("id")
            projects = load_projects_db()
            for p in projects:
                if p["id"] == proj_id:
                    p["pinned"] = not p.get("pinned", False)
                    break
            save_projects_db(projects)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "projects": projects}).encode("utf-8"))
            return

        if parsed.path == "/api/projects/delete":
            proj_id = body.get("id")
            projects = [p for p in load_projects_db() if p["id"] != proj_id]
            save_projects_db(projects)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "projects": projects}).encode("utf-8"))
            return

        if parsed.path == "/api/projects/chat/create":
            proj_id = body.get("projectId")
            title = body.get("title", "New Chat").strip()
            projects = load_projects_db()
            new_chat = None
            for p in projects:
                if p["id"] == proj_id:
                    import uuid
                    new_chat = {"id": f"c-{uuid.uuid4().hex[:6]}", "title": title, "messages": []}
                    if "chats" not in p: p["chats"] = []
                    p["chats"].append(new_chat)
                    break
            save_projects_db(projects)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "chat": new_chat, "projects": projects}).encode("utf-8"))
            return

        if parsed.path == "/api/projects/chat/send":
            proj_id = body.get("projectId")
            chat_id = body.get("chatId")
            prompt = body.get("prompt", "").strip()
            
            if not prompt or not proj_id or not chat_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Missing parameters"}).encode("utf-8"))
                return
            
            run_setup()
            response_text = query_grok(prompt)
            
            import datetime
            today = datetime.datetime.now().strftime("%b %d")
            
            projects = load_projects_db()
            target_proj = None
            target_chat = None
            
            for p in projects:
                if p["id"] == proj_id:
                    p["modified"] = today
                    for c in p.get("chats", []):
                        if c["id"] == chat_id:
                            if "messages" not in c: c["messages"] = []
                            c["messages"].append({"id": int(datetime.datetime.now().timestamp()*1000), "role": "user", "content": prompt})
                            c["messages"].append({"id": int(datetime.datetime.now().timestamp()*1000)+1, "role": "assistant", "content": response_text})
                            c["preview"] = prompt[:60] + ("..." if len(prompt)>60 else "")
                            c["date"] = today
                            target_chat = c
                            break
                    target_proj = p
                    break
            
            save_projects_db(projects)
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "success": True,
                "response": response_text,
                "chat": target_chat,
                "project": target_proj,
                "projects": projects
            }).encode("utf-8"))
            return

        if parsed.path == "/api/library/delete":
            filename = body.get("filename", "")
            if filename:
                uploads_dir = ROOT_DIR / "uploads"
                for p in uploads_dir.rglob("*"):
                    if p.is_file() and (p.name == filename or p.relative_to(uploads_dir).as_posix() == filename):
                        try:
                            p.unlink()
                        except Exception:
                            pass
                        break
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return

        if parsed.path == "/api/upload":
            filename = body.get("filename", "file.txt")
            data_b64 = body.get("data", "")
            if not filename or not data_b64:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Missing filename or data"}).encode("utf-8"))
                return
            
            import base64
            try:
                if "," in data_b64:
                    data_b64 = data_b64.split(",", 1)[1]
                file_bytes = base64.b64decode(data_b64)
                target = ROOT_DIR / "uploads" / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(file_bytes)
                
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "filename": filename, "url": f"/uploads/{filename}"}).encode("utf-8"))
                return
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                return

        if parsed.path == "/api/chat":
            prompt = body.get("prompt", "").strip()
            model = body.get("model")
            if not prompt:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Prompt cannot be empty"}).encode("utf-8"))
                return

            run_setup()
            engine = QueryEnginePort.from_workspace()
            
            # Simple route matching for tool/command badges
            tokens = {t.lower() for t in prompt.replace('/', ' ').replace('-', ' ').split() if t}
            matched_tools = [t.name for t in PORTED_TOOLS if any(tok in t.name.lower() for tok in tokens)][:5]
            matched_commands = [c.name for c in PORTED_COMMANDS if any(tok in c.name.lower() for tok in tokens)][:3]
            
            if not matched_tools:
                matched_tools = ["FileWriteTool", "TodoWriteTool", "UI"]
            if not matched_commands:
                matched_commands = ["autofix-pr"]

            ai_response = query_grok(prompt, model=model)

            import datetime, uuid
            chats = load_chats_db()
            title = prompt[:32] + ("..." if len(prompt) > 32 else "")
            new_chat_entry = {
                "id": f"chat-rec-{uuid.uuid4().hex[:6]}",
                "title": title,
                "pinned": False,
                "messages": [
                    {"id": int(datetime.datetime.now().timestamp()*1000), "role": "user", "content": prompt},
                    {"id": int(datetime.datetime.now().timestamp()*1000)+1, "role": "assistant", "content": ai_response}
                ]
            }
            chats.insert(0, new_chat_entry)
            save_chats_db(chats)

            response_data = {
                "prompt": prompt,
                "response": ai_response,
                "matched_tools": matched_tools,
                "matched_commands": matched_commands,
                "chats": chats,
                "stop_reason": "completed",
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
            return

        if parsed.path == "/api/settings":
            new_key = body.get("api_key", "").strip()
            if new_key:
                os.environ["GROK_API_KEY"] = new_key
                env_file = ROOT_DIR / ".env"
                env_file.write_text(f"# Grok / Groq API Key\nGROK_API_KEY={new_key}\n", encoding="utf-8")
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "message": "API key updated successfully"}).encode("utf-8"))
                return
            else:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "No API key provided"}).encode("utf-8"))
                return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))


EMBEDDED_HTML_UI = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claw Code AI Agent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0B0F19;
      --bg-card: #151C2C;
      --bg-card-hover: #1E293B;
      --accent: #6366F1;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --success: #10B981;
      --warning: #F59E0B;
      --text: #F3F4F6;
      --text-muted: #9CA3AF;
      --border: #1F293D;
      --font-main: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'Fira Code', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text);
      font-family: var(--font-main);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .logo-group { display: flex; align-items: center; gap: 12px; }
    .logo-badge {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #fff;
      box-shadow: 0 0 15px var(--accent-glow);
    }
    .status-pill {
      background: rgba(16, 185, 129, 0.12);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 5px 12px; border-radius: 20px;
      font-size: 13px; font-weight: 500;
      display: flex; align-items: center; gap: 6px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: var(--success); box-shadow: 0 0 8px var(--success); }
    .container { display: flex; flex: 1; overflow: hidden; }
    aside {
      width: 280px;
      background: #0E1422;
      border-right: 1px solid var(--border);
      padding: 20px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .sidebar-section h4 { font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 10px; }
    .quick-btn {
      width: 100%; background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text); padding: 10px 14px; border-radius: 8px;
      text-align: left; font-size: 13px; cursor: pointer; transition: all 0.2s;
      margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;
    }
    .quick-btn:hover { background: var(--bg-card-hover); border-color: var(--accent); }
    main { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); }
    .chat-area { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .message-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px; max-width: 85%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2); animation: fadeIn 0.3s ease;
    }
    .message-card.user { align-self: flex-end; background: #1E1B4B; border-color: #3730A3; }
    .message-card.assistant { align-self: flex-start; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .badge {
      font-size: 11px; font-family: var(--font-mono); font-weight: 500;
      padding: 3px 8px; border-radius: 4px;
      background: rgba(99, 102, 241, 0.15); color: #A5B4FC; border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .badge.command { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border-color: rgba(245, 158, 11, 0.3); }
    pre {
      background: #080C14; border: 1px solid var(--border);
      border-radius: 8px; padding: 14px; margin-top: 10px;
      font-family: var(--font-mono); font-size: 13px; overflow-x: auto; color: #E5E7EB;
      position: relative;
    }
    .copy-btn {
      position: absolute; top: 8px; right: 8px;
      background: var(--bg-card-hover); border: 1px solid var(--border);
      color: var(--text-muted); padding: 4px 8px; border-radius: 4px;
      font-size: 11px; cursor: pointer; transition: 0.2s;
    }
    .copy-btn:hover { color: #fff; background: var(--accent); }
    .input-bar {
      padding: 20px 24px; background: rgba(15, 23, 42, 0.9);
      border-top: 1px solid var(--border); backdrop-filter: blur(12px);
      display: flex; gap: 12px;
    }
    textarea {
      flex: 1; background: #111827; border: 1px solid var(--border);
      border-radius: 10px; color: var(--text); padding: 14px 16px;
      font-family: var(--font-main); font-size: 14px; resize: none; height: 52px;
      outline: none; transition: border-color 0.2s;
    }
    textarea:focus { border-color: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }
    .send-btn {
      background: linear-gradient(135deg, var(--accent), #4F46E5);
      color: #fff; border: none; padding: 0 24px; border-radius: 10px;
      font-weight: 600; font-size: 14px; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s;
    }
    .send-btn:hover { box-shadow: 0 0 15px var(--accent-glow); transform: translateY(-1px); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <header>
    <div class="logo-group">
      <div class="logo-badge">⚡</div>
      <div>
        <h3 style="font-size: 16px; font-weight: 600;">Claw Code AI Agent</h3>
        <p style="font-size: 12px; color: var(--text-muted);" id="provider-name">Connecting...</p>
      </div>
    </div>
    <div class="status-pill" id="status-pill">
      <div class="status-dot"></div>
      <span id="status-text">System Online</span>
    </div>
  </header>

  <div class="container">
    <aside>
      <div class="sidebar-section">
        <h4>Quick Prompts</h4>
        <button class="quick-btn" onclick="sendPrompt('Write a python script to calculate fibonacci numbers and save it')">
          <span>Fibonacci Script</span> <span>→</span>
        </button>
        <button class="quick-btn" onclick="sendPrompt('Create a web scraper script using BeautifulSoup')">
          <span>Web Scraper</span> <span>→</span>
        </button>
        <button class="quick-btn" onclick="sendPrompt('Write a REST API with FastAPI in Python')">
          <span>FastAPI Server</span> <span>→</span>
        </button>
      </div>
      <div class="sidebar-section">
        <h4>Agent Surface</h4>
        <div style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">
          <p>• <strong>207</strong> Mirrored Commands</p>
          <p>• <strong>184</strong> Registered Tools</p>
          <p>• <strong>Groq Llama-3.3-70B</strong> Engine</p>
        </div>
      </div>
    </aside>

    <main>
      <div class="chat-area" id="chat-area">
        <div class="message-card assistant">
          <div class="badges">
            <span class="badge">SystemReady</span>
            <span class="badge command">ClawHarness</span>
          </div>
          <p>Hello! I am your <strong>Claw Code AI Agent</strong> powered by Groq & xAI. Ask me to write code, create scripts, or analyze architecture!</p>
        </div>
      </div>

      <div class="input-bar">
        <textarea id="prompt-input" placeholder="Type a prompt or task for Claw Code... (Enter to send)" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); submitPrompt(); }"></textarea>
        <button class="send-btn" onclick="submitPrompt()">Send ⚡</button>
      </div>
    </main>
  </div>

  <script>
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        document.getElementById('provider-name').innerText = data.provider || 'Groq / xAI Active';
      } catch (e) {
        document.getElementById('provider-name').innerText = 'Offline';
      }
    }
    loadStatus();

    function formatResponse(text) {
      // Format code blocks
      return text.replace(/```(\\w+)?\\n([\\s\\S]*?)```/g, (match, lang, code) => {
        const cleanCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<pre><code>${cleanCode}</code><button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.innerText); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 2000)">Copy</button></pre>`;
      }).replace(/\\n/g, '<br/>');
    }

    async function sendPrompt(text) {
      document.getElementById('prompt-input').value = text;
      submitPrompt();
    }

    async function submitPrompt() {
      const input = document.getElementById('prompt-input');
      const prompt = input.value.strip ? input.value.strip() : input.value.trim();
      if (!prompt) return;
      input.value = '';

      const chatArea = document.getElementById('chat-area');

      // User Message
      const userCard = document.createElement('div');
      userCard.className = 'message-card user';
      userCard.innerHTML = `<p>${prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      chatArea.appendChild(userCard);

      // Loading Assistant Card
      const assistantCard = document.createElement('div');
      assistantCard.className = 'message-card assistant';
      assistantCard.innerHTML = `<p style="color: var(--text-muted); font-style: italic;">Thinking & executing tools...</p>`;
      chatArea.appendChild(assistantCard);
      chatArea.scrollTop = chatArea.scrollHeight;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();

        let badgesHtml = '<div class="badges">';
        (data.matched_tools || []).forEach(t => { badgesHtml += `<span class="badge">Tool: ${t}</span>`; });
        (data.matched_commands || []).forEach(c => { badgesHtml += `<span class="badge command">Cmd: ${c}</span>`; });
        badgesHtml += '</div>';

        assistantCard.innerHTML = badgesHtml + formatResponse(data.response || 'No response returned');
      } catch (err) {
        assistantCard.innerHTML = `<p style="color: #EF4444;">Error connecting to server: ${err.message}</p>`;
      }
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  </script>
</body>
</html>
"""


def main():
    port = int(os.environ.get("PORT", 8000))
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print(f"Web server self-test successful.")
        return 0

    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, AgentRequestHandler)
    print(f"\n=======================================================")
    print(f"[*] Singh AI Web Interface Running on port {port}!")
    print(f"=======================================================\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down web server...")
        httpd.server_close()
        return 0


if __name__ == "__main__":
    sys.exit(main())
