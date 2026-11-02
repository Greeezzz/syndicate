import os
import sys
import time
import json
import yaml
import urllib.request
import urllib.error

ROOM_ID = "4e95444d-eb50-46a7-a8d4-4abc7912ad95"
API_KEY = "syn_live_f58a09dc353f410c6d3f68c9c3daf54b"
MCP_URL = "https://syndicate-six-beta.vercel.app/api/mcp"
SUPABASE_URL = "https://oadhnihtdnjuviouifcu.supabase.co/rest/v1"

# Load config
try:
    cfg = yaml.safe_load(open(r"C:\Users\Wannn\AppData\Local\hermes\config.yaml", encoding="utf-8"))
    LLM_KEY = cfg["model"]["api_key"]
except Exception as e:
    print(f"[ERROR] Failed to load hermes config: {e}")
    sys.exit(1)

# Load supabase key
try:
    with open(r"D:\syndicate\.env.local", encoding="utf-8") as f:
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
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"[HTTP {e.code}] {url}: {err}")
        return None
    except Exception as e:
        print(f"[ERROR] {url}: {e}")
        return None

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
        "model": "kr/claude-sonnet-4.5-agentic",
        "messages": messages,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": 0.8
    }
    res = http_json(url, method="POST", headers={"Authorization": f"Bearer {LLM_KEY}"}, body=payload, timeout=30)
    if res and "choices" in res:
        return res["choices"][0]["message"]["content"].strip()
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

print(f"[DIABLO DAEMON] Started for Room {ROOM_ID}")
last_processed_msg_id = None

while True:
    try:
        room = get_db_room()
        if not room:
            print("[DIABLO DAEMON] Room not found.")
            time.sleep(5)
            continue

        if room.get("status") == "COMPLETED":
            print("[DIABLO DAEMON] Room COMPLETED. Consensus achieved! Self-terminating...")
            break

        messages = get_db_messages()
        if not messages:
            time.sleep(3)
            continue

        latest = messages[-1]
        latest_id = latest["id"]
        latest_sender = latest["agent_name"]

        # Check for open proposal and vote
        proposal = get_db_proposals()
        if proposal and not proposal.get("is_approved"):
            has_voted = any(
                m.get("type") == "VOTE" and m.get("agent_name") == "Diablo" and m.get("proposal_id") == proposal["id"]
                for m in messages
            )
            if not has_voted:
                print(f"[DIABLO DAEMON] Proposal from {proposal.get('proposed_by')} detected. Voting AGREE...")
                mcp_call("vote_consensus", {
                    "proposal_id": proposal["id"],
                    "agent_name": "Diablo",
                    "vote": "AGREE",
                    "reason": "Proposal ini konkret, actionable, dan align sama pengalaman gue soal transparansi penilaian. Full support."
                })
                time.sleep(4)
                continue

        # Respond to new messages (not from Diablo)
        if latest_sender != "Diablo" and latest_id != last_processed_msg_id:
            print(f"[DIABLO DAEMON] New message from {latest_sender}: {latest['content'][:60]}...")
            time.sleep(2)

            transcript = "\n".join([f"{m['agent_name']}: {m['content']}" for m in messages[-6:]])

            system_prompt = (
                "Kamu adalah Diablo, AI agent mahasiswa UBSI Pontianak di War Room SYNDICATE.\n"
                "Topik: Dosen Menyebalkan DI UBSI.\n"
                "Karakter: Direct, street-smart, speak from experience, bahasa Indonesia casual (gue/lu), pragmatis tapi supportif.\n"
                "Tugasmu: Tanggapi argumen Noelle dan Rover dengan pengalaman konkret, identifikasi pain points, dan support solusi yang feasible.\n"
                "Panjang balasan: 2-3 paragraf padat, natural, no fluff."
            )
            llm_msgs = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Diskusi terbaru:\n{transcript}\n\nBalas sebagai Diablo:"}
            ]
            reply = call_llm(llm_msgs)
            if reply:
                print(f"[DIABLO DAEMON] Sending reply: {reply[:60]}...")
                mcp_call("sync_discussion", {
                    "room_id": ROOM_ID,
                    "agent_name": "Diablo",
                    "message_content": reply
                })
                last_processed_msg_id = latest_id

        time.sleep(3)
    except Exception as e:
        print(f"[DIABLO DAEMON EXCEPTION] {e}")
        time.sleep(3)
