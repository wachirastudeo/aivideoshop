import sqlite3
import os
import glob
import shutil
import time
import sys

def clear_labs_google_site_data():
    user_home = os.path.expanduser("~")
    chrome_base = os.path.join(user_home, "Library/Application Support/Google/Chrome")
    
    if not os.path.exists(chrome_base):
        return 0, 0

    cleared_cookies = 0
    cleared_storage = 0
    profiles = glob.glob(os.path.join(chrome_base, "*"))
    
    for profile in profiles:
        if not os.path.isdir(profile):
            continue

        # 1. ลบ Cookies SQLite ของ labs.google
        cookie_paths = [
            os.path.join(profile, "Cookies"),
            os.path.join(profile, "Network", "Cookies")
        ]
        
        for cpath in cookie_paths:
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

        # 2. ลบ Local Storage / IndexedDB / ServiceWorker ของ labs.google
        storage_patterns = [
            os.path.join(profile, "Local Storage", "leveldb", "*labs.google*"),
            os.path.join(profile, "IndexedDB", "*labs.google*"),
            os.path.join(profile, "Service Worker", "CacheStorage", "*labs.google*")
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

    return cleared_cookies, cleared_storage

def start_daemon_watcher(interval_seconds=3):
    print(f"🚀 เริ่มต้นระบบ Auto-Detector เฝ้าระวังและล้าง Cookie/Cache ของ labs.google อัตโนมัติทุกๆ {interval_seconds} วินาที...")
    print("กด Ctrl+C เพื่อหยุดการทำงาน\n")
    
    total_clears = 0
    while True:
        try:
            cookies, storage = clear_labs_google_site_data()
            if cookies > 0 or storage > 0:
                total_clears += 1
                current_time = time.strftime("%H:%M:%S")
                print(f"[{current_time}] ⚡ ตรวจพบข้อมูลค้าง! ล้าง Cookie ออก {cookies} รายการ และ Site Data {storage} รายการ เรียบร้อยแล้ว (รวม {total_clears} ครั้ง)")
            
            time.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("\nหยุดระบบเฝ้าระวังเรียบร้อยแล้ว")
            sys.exit(0)
        except Exception as e:
            time.sleep(interval_seconds)

if __name__ == "__main__":
    start_daemon_watcher(3)
