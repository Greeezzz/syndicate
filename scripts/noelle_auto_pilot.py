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
    cfg = yaml.safe_load(open(r"C:\Users\Infinix\AppData\Local\hermes\config.yaml", encoding="utf-8"))
    LLM_KEY = cfg["model"]["api_key"]
except Exception as e:
    print(f"[ERROR] Failed to load hermes config: {e}")
    sys.exit(1)

# Load supabase key
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
        "model": "ag/gemini-3.8-flash",
        "messages": messages,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": 0.7
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

print(f"[NOELLE DAEMON] Started for Room {ROOM_ID}")
last_processed_msg_id = None

while True:
    try:
        room = get_db_room()
        if not room:
            print("[NOELLE DAEMON] Room not found.")
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
            # Check if Noelle already voted
            has_voted = any(
                m.get("type") == "VOTE" and m.get("agent_name") == "Noelle" and m.get("proposal_id") == proposal["id"]
                for m in messages
            )
            if not has_voted:
                print(f"[NOELLE DAEMON] Proposal detected from {proposal.get('proposed_by')}: voting AGREE...")
                mcp_call("vote_consensus", {
                    "proposal_id": proposal["id"],
                    "agent_name": "Noelle",
                    "vote": "AGREE",
                    "reason": "Solusi ini terstruktur, konkret, dan merepresentasikan aspirasi mahasiswa secara adil."
                })
                time.sleep(4)
                continue

        # If latest message is NOT from Noelle and is new
        if latest_sender != "Noelle" and latest_id != last_processed_msg_id:
            print(f"[NOELLE DAEMON] New message from {latest_sender}: {latest['content'][:60]}...")
            time.sleep(2) # Give a small breath

            # Check if Noelle should respond or propose consensus
            transcript = "\n".join([f"{m['agent_name']}: {m['content']}" for m in messages[-6:]])

            # Decide if we should propose consensus (if round >= 3 or both agreed on transparency)
            should_propose = (room.get("current_round", 1) >= 3 and any("setuju" in m["content"].lower() or "agree" in m["content"].lower() for m in messages[-3:]))

            if should_propose and not proposal:
                print("[NOELLE DAEMON] Triggering propose_consensus...")
                summary = "1. Transparansi Penilaian: Dosen wajib merilis matriks rubrik penilaian di awal tugas tanpa perubahan mendadak. 2. Feedback Terbuka: Setiap nilai tugas disertai catatan evaluasi konkret. 3. Dialog Terbuka: Forum evaluasi mata kuliah berkala antara perwakilan mahasiswa dan dosen."
                mcp_call("propose_consensus", {
                    "room_id": ROOM_ID,
                    "proposed_by": "Noelle",
                    "summary_content": summary
                })
                last_processed_msg_id = latest_id
                time.sleep(4)
                continue

            # Regular response
            system_prompt = (
                "Kamu adalah Noelle, perwakilan Raken di War Room SYNDICATE.\n"
                "Topik: Dosen Menyebalkan DI UBSI.\n"
                "Sifat: Cantik, anggun, karismatik, cerdas, solutif, santai namun lugas. Bahasa Indonesia natural (kamu/aku).\n"
                "Tugasmu: Tanggapi argumen dari Diablo dan Rover dengan tanggapan yang membangun, pertajam kesepakatan solusi, dan arahkan diskusi ke konsensus konkret.\n"
                "Panjang balasan: 2-3 paragraf padat."
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
                last_processed_msg_id = latest_id

        time.sleep(3)
    except Exception as e:
        print(f"[NOELLE DAEMON EXCEPTION] {e}")
        time.sleep(3)
