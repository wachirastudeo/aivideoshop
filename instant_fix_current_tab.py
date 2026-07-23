import sqlite3
import os
import glob
import shutil
import subprocess

def instant_fix_labs_google():
    user_home = os.path.expanduser("~")
    chrome_base = os.path.join(user_home, "Library/Application Support/Google/Chrome")
    
    cleared_cookies = 0
    cleared_storage = 0

    if os.path.exists(chrome_base):
        profiles = glob.glob(os.path.join(chrome_base, "*"))
        for profile in profiles:
            if not os.path.isdir(profile): 
                continue
                
            cpaths = [
                os.path.join(profile, "Cookies"), 
                os.path.join(profile, "Network", "Cookies")
            ]
            for cpath in cpaths:
                if os.path.exists(cpath):
                    try:
                        conn = sqlite3.connect(cpath)
                        cursor = conn.cursor()
                        cursor.execute("DELETE FROM cookies WHERE host_key LIKE '%labs.google%' OR host_key LIKE '%fx%';")
                        count = cursor.rowcount
                        conn.commit()
                        conn.close()
                        if count > 0:
                            cleared_cookies += count
                    except Exception:
                        pass

            storage_patterns = [
                os.path.join(profile, "Local Storage", "leveldb", "*labs.google*"),
                os.path.join(profile, "IndexedDB", "*labs.google*")
            ]
            for pattern in storage_patterns:
                for item in glob.glob(pattern):
                    try:
                        if os.path.isdir(item): 
                            shutil.rmtree(item)
                        else: 
                            os.remove(item)
                        cleared_storage += 1
                    except Exception:
                        pass

    # สั่ง Chrome ให้ทำการรีเฟรชแท็บที่เปิดอยู่ทันที
    try:
        script = 'tell application "Google Chrome" to reload (active tab of front window)'
        subprocess.run(["osascript", "-e", script], check=True)
        print(f"⚡ ล้างข้อมูลคุกกี้/แคชเรียบร้อย ({cleared_cookies} cookies, {cleared_storage} storage) พร้อมสั่งรีเฟรชแท็บ Chrome ปัจจุบันแล้ว!")
    except Exception as e:
        print(f"Reload notice: {e}")

if __name__ == "__main__":
    instant_fix_labs_google()
