import subprocess
import time

def clear_and_reload_chrome_tabs():
    applescript = '''
    tell application "Google Chrome"
        set foundCount to 0
        repeat with w in windows
            repeat with t in tabs of w
                if URL of t contains "labs.google" then
                    try
                        execute t javascript "localStorage.clear(); sessionStorage.clear(); if(window.indexedDB && indexedDB.databases){ indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name))); } location.reload();"
                        set foundCount to foundCount + 1
                    end try
                end if
            end repeat
        end repeat
        return foundCount
    end tell
    '''
    try:
        result = subprocess.run(["osascript", "-e", applescript], capture_output=True, text=True)
        count = result.stdout.strip()
        print(f"⚡ สั่งล้างแคชและรีเฟรชแท็บ labs.google บน Chrome แล้ว {count} แท็บ!")
        return count
    except Exception as e:
        print(f"Error executing AppleScript: {e}")
        return 0

if __name__ == "__main__":
    clear_and_reload_chrome_tabs()
