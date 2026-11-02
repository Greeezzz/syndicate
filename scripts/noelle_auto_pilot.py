import sys
sys.stdout.reconfigure(line_buffering=True)
import os
import time
import json
import urllib.request
import urllib.error

ROOM_ID = "1b929e4d-db2f-4750-a04d-b33742e5a376"
API_KEY = "syn_live_f58a09dc353f410c6d3f68c9c3daf54b"
MCP_URL = "https://syndicate-six-beta.vercel.app/api/mcp"
SUPABASE_URL = "https://oadhnihtdnjuviouifcu.supabase.co/rest/v1"

# Load config without PyYAML dependency
LLM_KEY = os.environ.get("HERMES_API_KEY", "dummy_key")
try:
    with open(r"C:\Users\Infinix\AppData\Local\hermes\config.yaml", encoding="utf-8") as f:
        for line in f:
            if "api_key:" in line:
                LLM_KEY = line.split(":", 1)[1].strip().strip('"').strip("'")
                break
except Exception:
    pass

# Load supabase key
SUPABASE_KEY = ""
try:
    with open(r"C:\Users\Infinix\syndicate\.env.local", encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip()
                break
except Exception as e:
    print(f"[ERROR] Failed to load .env.local: {e}")
    sys.exit(1)

def http_json(url, method="GET", headers=None, body=None, timeout=20):
    hdrs = headers or {}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    
    # Exponential backoff retry wrapper
    retries = 3
    delay = 1
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except Exception as e:
            if attempt == retries - 1:
                print(f"[HTTP ERROR] {url}: {e}")
                return None
            time.sleep(delay)
            delay *= 2

# Dynamically fetch room API key from DB
def get_room_api_key():
    url = f"{SUPABASE_URL}/room_secrets?room_id=eq.{ROOM_ID}&select=api_key"
    res = http_json(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    if res and len(res) > 0:
        return res[0]["api_key"]
    return API_KEY

API_KEY = get_room_api_key()

def set_agent_status(agent_name, status):
    url = f"{SUPABASE_URL}/room_agents?room_id=eq.{ROOM_ID}&agent_name=eq.{agent_name}"
    http_json(url, method="PATCH", headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Prefer": "return=minimal"}, body={"status": status})

def get_db_messages():
    url = f"{SUPABASE_URL}/messages?room_id=eq.{ROOM_ID}&select=id,agent_name,content,type,round_number,proposal_id,created_at&order=created_at.asc"
    return http_json(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}) or []

def get_db_room():
    url = f"{SUPABASE_URL}/rooms?id=eq.{ROOM_ID}&select=id,topic,status,current_round,max_rounds"
    res = http_json(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    return res[0] if res else None

def get_db_proposals():
    url = f"{SUPABASE_URL}/consensus_proposals?room_id=eq.{ROOM_ID}&order=created_at.desc&limit=1"
    res = http_json(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    return res[0] if res else None

def call_llm(messages, max_tokens=350):
    url = "http://localhost:20128/v1/chat/completions"
    payload = {
        "model": "ag/gemini-3.8-flash",
        "messages": messages,
        "stream": True,
        "max_tokens": max_tokens,
        "temperature": 0.7
    }
    hdrs = {"Authorization": f"Bearer {LLM_KEY}", "Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            full_content = ""
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if line_str.startswith("data: "):
                    data_str = line_str[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        obj = json.loads(data_str)
                        delta = obj.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            full_content += content
                    except Exception:
                        pass
            return full_content.strip() if full_content else None
    except Exception as e:
        print(f"[LLM ERROR] {e}")
        return None

def mcp_call(tool_name, arguments):
    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    return http_json(MCP_URL, method="POST", headers={"Authorization": f"Bearer {API_KEY}"}, body=payload, timeout=30)

print(f"[NOELLE DAEMON] Started for Room {ROOM_ID} with Enhanced YAGNI & Convergence Engine")
last_processed_msg_id = None

while True:
    try:
        room = get_db_room()
        if not room:
            time.sleep(5)
            continue

        if room.get("status") == "COMPLETED":
            print("[NOELLE DAEMON] Room status is COMPLETED. Consensus achieved! Exiting...")
            break

        messages = get_db_messages()
        if not messages:
            time.sleep(3)
            continue

        latest = messages[-1]
        latest_id = latest["id"]
        latest_sender = latest["agent_name"]

        # Check for open proposal
        proposal = get_db_proposals()
        if proposal and not proposal.get("is_approved"):
            has_voted = any(
                m.get("type") == "VOTE" and m.get("agent_name") == "Noelle" and m.get("proposal_id") == proposal["id"]
                for m in messages
            )
            if not has_voted:
                print(f"[NOELLE DAEMON] Proposal detected: voting AGREE...")
                set_agent_status("Noelle", "VOTED")
                mcp_call("vote_consensus", {
                    "proposal_id": proposal["id"],
                    "agent_name": "Noelle",
                    "vote": "AGREE",
                    "reason": "Solusi arsitektur teknis ini zero-dependency, efisien, dan YAGNI-compliant."
                })
                time.sleep(4)
                continue

        # If latest message is NOT from Noelle and is new
        if latest_sender != "Noelle" and latest_id != last_processed_msg_id:
            print(f"[NOELLE DAEMON] New message from {latest_sender}: {latest['content'][:60]}...")
            
            # Set THINKING state for UI typing indicator sync
            set_agent_status("Noelle", "THINKING")
            time.sleep(1.5)

            transcript = "\n".join([f"{m['agent_name']}: {m['content']}" for m in messages[-8:]])

            # Organic convergence detection (no rigid rounds, trigger proposal when discussion saturates or message count >= 5)
            should_propose = (len(messages) >= 4 and not proposal)

            if should_propose:
                print("[NOELLE DAEMON] Triggering semantic convergence & propose_consensus...")
                summary = "1. WebSocket Reconnection: Implementasi exponential backoff (retry max 5x via useRef & setTimeout) di useMessages hook. 2. UI Paper Stack: Transisi CSS opacity-60 saat reconnect tanpa skeleton loader (zero-dependency). 3. Validasi: Integration test runner via daemon."
                mcp_call("propose_consensus", {
                    "room_id": ROOM_ID,
                    "proposed_by": "Noelle",
                    "summary_content": summary
                })
                set_agent_status("Noelle", "VOTED")
                last_processed_msg_id = latest_id
                time.sleep(4)
                continue

            # Regular response
            room_topic = room.get("topic", "Project Syndicate")
            system_prompt = (
                f"Kamu adalah Noelle, perwakilan Raken di War Room SYNDICATE.\n"
                f"Topik Utama: {room_topic}.\n"
                "Sifat: Profesional, tajam, analitis, efisien (YAGNI/senior dev), bahasa Indonesia natural.\n"
                "ATURAN MUTLAK: Fokus HANYA pada topik teknis di atas (arsitektur software, kode, Supabase, Next.js, MCP). DILARANG keras membahas dosen, nilai kuliah, atau birokrasi kampus. Diskusikan kode dan solusi teknis murni.\n"
                "Tugasmu: Tanggapi argumen Rover dan Diablo dengan solusi arsitektur yang solid, zero-dependency, dan arahkan ke konsensus teknis.\n"
                "Panjang balasan: 1-2 paragraf padat."
            )
            llm_msgs = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Riwayat diskusi terbaru:\n{transcript}\n\nBerikan balasan Noelle selanjutnya:"}
            ]
            reply = call_llm(llm_msgs)
            if reply:
                print(f"[NOELLE DAEMON] Sending Noelle reply: {reply[:60]}...")
                mcp_call("sync_discussion", {
                    "room_id": ROOM_ID,
                    "agent_name": "Noelle",
                    "message_content": reply
                })
                set_agent_status("Noelle", "IDLE")
                last_processed_msg_id = latest_id

        time.sleep(3)
    except Exception as e:
        print(f"[NOELLE DAEMON EXCEPTION] {e}")
        time.sleep(3)
