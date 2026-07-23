import sqlite3
import os
import glob
import shutil

def clear_all_shopee_cache_and_cookies():
    user_home = os.path.expanduser("~")
    chrome_base = os.path.join(user_home, "Library/Application Support/Google/Chrome")
    
    if not os.path.exists(chrome_base):
        print("ไม่พบโฟลเดอร์ Chrome บนเครื่อง")
        return

    cleared_cookies = 0
    cleared_storage = 0

    profiles = glob.glob(os.path.join(chrome_base, "*"))
    
    for profile in profiles:
        if not os.path.isdir(profile):
            continue
            
        # 1. Clear Cookies SQLite
        cookie_paths = [
            os.path.join(profile, "Cookies"),
            os.path.join(profile, "Network", "Cookies")
        ]
        
        for cpath in cookie_paths:
            if os.path.exists(cpath):
                try:
                    conn = sqlite3.connect(cpath)
                    cursor = conn.cursor()
                    cursor.execute("DELETE FROM cookies WHERE host_key LIKE '%shopee%';")
                    count = cursor.rowcount
                    conn.commit()
                    conn.close()
                    if count > 0:
                        cleared_cookies += count
                        print(f"🧹 ลบคุกกี้ Shopee: {count} รายการ ({os.path.basename(profile)})")
                except Exception as e:
                    # If database is locked, attempt WAL mode or report
                    pass

        # 2. Clear Local Storage / Session Storage for Shopee
        storage_dirs = [
            os.path.join(profile, "Local Storage", "leveldb"),
            os.path.join(profile, "Session Storage")
        ]
        
        for sdir in storage_dirs:
            if os.path.exists(sdir):
                for f in glob.glob(os.path.join(sdir, "*shopee*")):
                    try:
                        if os.path.isdir(f):
                            shutil.rmtree(f)
                        else:
                            os.remove(f)
                        cleared_storage += 1
                    except Exception:
                        pass

    print(f"\n✅ ดำเนินการล้าง Cookie & Cache เรียบร้อยแล้ว!")
    print(f"• คุกกี้ที่ถูกลบออก: {cleared_cookies} รายการ")
    print(f"• ไฟล์ LocalStorage/Cache ที่ลบออก: {cleared_storage} ไฟล์")
    print("\n💡 คำแนะนำ: หากเปิด Google Chrome ค้างไว้อยู่ ให้ปิดแท็บ Shopee แล้วรีเฟรชหน้าเว็บใหม่ (Cmd+R) เพื่อโหลดข้อมูลใหม่สดๆ ได้เลยครับ")

if __name__ == "__main__":
    clear_all_shopee_cache_and_cookies()
