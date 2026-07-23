import sqlite3
import os
import glob
import shutil
import time

def clear_labs_google_instant():
    user_home = os.path.expanduser("~")
    chrome_base = os.path.join(user_home, "Library/Application Support/Google/Chrome")
    
    if not os.path.exists(chrome_base):
        return 0

    cleared = 0
    profiles = glob.glob(os.path.join(chrome_base, "*"))
    
    for profile in profiles:
        if not os.path.isdir(profile):
            continue

        # 1. ลบ Cookies ที่เกี่ยวกับ labs.google
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
                        cleared += count
                except Exception:
                    pass

        # 2. ลบ LocalStorage / IndexedDB / ServiceWorker
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
                    cleared += 1
                except Exception:
                    pass

    return cleared

if __name__ == "__main__":
    print("⚡ เริ่มต้นระบบเฝ้าระวังอัตโนมัติ (Auto-Bypass Countdown Monitor)...")
    res = clear_labs_google_instant()
    print(f"✅ ล้างข้อมูลค้างเก่าเรียบร้อยทันที ({res} รายการ)! ไม่ต้องรอนับถอยหลังอีกต่อไป")
