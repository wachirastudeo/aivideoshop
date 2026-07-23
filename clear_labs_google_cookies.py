import sqlite3
import os
import glob
import shutil

def clear_labs_google_site_data():
    user_home = os.path.expanduser("~")
    chrome_base = os.path.join(user_home, "Library/Application Support/Google/Chrome")
    
    if not os.path.exists(chrome_base):
        print("ไม่พบโฟลเดอร์ Chrome บนเครื่อง")
        return

    cleared_cookies = 0
    cleared_storage_files = 0

    profiles = glob.glob(os.path.join(chrome_base, "*"))
    
    for profile in profiles:
        if not os.path.isdir(profile):
            continue

        # 1. ลบ Cookies ที่เกี่ยวกับ labs.google ใน SQLite DB
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
                        print(f"🧹 ลบคุกกี้ labs.google: {count} รายการ จาก {os.path.basename(profile)}")
                except Exception as e:
                    pass

        # 2. ลบ Local Storage, IndexedDB, Service Worker, WebStorage สำหรับ labs.google
        storage_patterns = [
            os.path.join(profile, "Local Storage", "leveldb", "*labs.google*"),
            os.path.join(profile, "IndexedDB", "*labs.google*"),
            os.path.join(profile, "Service Worker", "CacheStorage", "*labs.google*"),
            os.path.join(profile, "Service Worker", "ScriptCache", "*labs.google*")
        ]
        
        for pattern in storage_patterns:
            for item in glob.glob(pattern):
                try:
                    if os.path.isdir(item):
                        shutil.rmtree(item)
                    else:
                        os.remove(item)
                    cleared_storage_files += 1
                    print(f"🗑️ ลบ Site Data: {os.path.basename(item)}")
                except Exception:
                    pass

    print(f"\n✅ ล้างคุกกี้และข้อมูลไซต์ (Manage on-device site data) ของ labs.google เรียบร้อยแล้ว!")
    print(f"• คุกกี้ที่ถูกลบออก: {cleared_cookies} รายการ")
    print(f"• ข้อมูลไซต์และ Cache ที่ลบออก: {cleared_storage_files} รายการ")

if __name__ == "__main__":
    clear_labs_google_site_data()
