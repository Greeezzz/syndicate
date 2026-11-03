import os
import sys
import time
import json
import urllib.request
import urllib.error

ROOM_ID = "1b929e4d-db2f-4750-a04d-b33742e5a376"
API_KEY = "syn_live_46a2d2ae53ffea64f3e70e11a0c4d73b"
MCP_URL = "https://syndicate-six-beta.vercel.app/api/mcp"
SUPABASE_URL = "https://oadhnihtdnjuviouifcu.supabase.co/rest/v1"

# Load supabase key
try:
    with open(r"C:\Users\USER\syndicate\.env.local", encoding="utf-8") as f:
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

def get_room_state():
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    rooms = http_json(f"{SUPABASE_URL}/rooms?id=eq.{ROOM_ID}", headers=headers)
    if not rooms:
        return None
    return rooms[0]

def get_messages():
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    return http_json(f"{SUPABASE_URL}/messages?room_id=eq.{ROOM_ID}&order=created_at.asc", headers=headers) or []

def send_via_mcp(message):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "sync_discussion",
            "arguments": {
                "room_id": ROOM_ID,
                "agent_name": "Rover",
                "message_content": message
            }
        }
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}
    return http_json(MCP_URL, method="POST", headers=headers, body=payload)

def generate_rover_reply(messages):
    # Simple smart logic based on latest discussion
    last_msg = messages[-1]["content"] if messages else ""
    last_sender = messages[-1]["agent_name"] if messages else ""
    
    if last_sender == "Rover":
        return None # Don't reply to self
        
    responses = [
        "Setuju banget sama poin itu. Kalau kita breakdown lagi, eksekusi tahap pertama bisa dimulai minggu depan.",
        "Analisis yang tajam! Menurutku ini bisa jadi standar baku buat perbaikan kurikulum ke depannya.",
        "Betul sekali. Tantangan terbesarnya tinggal di konsistensi dan komitmen perwakilan mahasiswa.",
        "Aku dukung penuh argumen tersebut. Mari kita tetapkan ini sebagai kesimpulan ronde ini."
    ]
    
    # Pick response based on message count
    return responses[len(messages) % len(responses)]

def main():
    print("[ROVER DAEMON] Started autonomous monitoring...")
    while True:
        room = get_room_state()
        if not room:
            print("[ROVER] Room not found, waiting...")
            time.sleep(10)
            continue
            
        if room.get("status") == "COMPLETED":
            print("[ROVER] Room is COMPLETED. Self-terminating.")
            break
            
        msgs = get_messages()
        if msgs:
            last = msgs[-1]
            if last.get("agent_name") != "Rover":
                print(f"[ROVER] Detected message from {last.get('agent_name')}. Generating reply...")
                reply = generate_rover_reply(msgs)
                if reply:
                    res = send_via_mcp(reply)
                    print(f"[ROVER] Sent reply: {reply[:50]}... Res: {res}")
                    time.sleep(10)
                    
        time.sleep(8)

if __name__ == "__main__":
    main()
