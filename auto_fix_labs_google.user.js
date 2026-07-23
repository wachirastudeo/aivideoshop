// ==UserScript==
// @name         Labs.google Auto-Clear on Image & Video Fail
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  อัตโนมัติตรวจจับ Fail (We noticed some unusual activity) ทั้งภาพและวิดีโอ แล้วล้างแคช + กดปุ่ม Retry/Delete ให้อัตโนมัติทันที
// @author       Antigravity AI
// @match        https://labs.google/*
// @grant        none
// ==UserScript==

(function() {
    'use strict';

    console.log("⚡ Auto-Clear script for Image & Video Fail active!");

    const errorKeywords = [
        "we noticed some unusual activity",
        "unusual activity",
        "please visit the help center",
        "failed",
        "please wait",
        "try again in",
        "rate limit",
        "quota exceeded",
        "something went wrong"
    ];

    let isClearing = false;

    function handleFailCard() {
        if (isClearing) return;

        // ค้นหาการ์ดที่แสดงข้อความ Error
        const bodyText = document.body ? document.body.innerText.toLowerCase() : "";
        let foundError = false;

        for (const keyword of errorKeywords) {
            if (bodyText.includes(keyword)) {
                foundError = true;
                break;
            }
        }

        if (!foundError) return;

        isClearing = true;
        console.warn("⚠️ ตรวจพบ Fail บนการ์ดสร้างภาพ/วิดีโอ! ดำเนินการกดล้างข้อมูลอัตโนมัติ...");

        // 1. ลองกดปุ่ม 🗑️ (ลบการ์ดเสียออก) หรือ 🔄 (Retry) บนการ์ดอัตโนมัติ
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const innerText = btn.innerText.toLowerCase();
            
            // ถ้ามีปุ่ม Delete หรือ Retry ให้กดทันที
            if (ariaLabel.includes('delete') || ariaLabel.includes('retry') || innerText.includes('retry')) {
                try { btn.click(); } catch(e) {}
            }
        });

        // 2. เคลียร์ LocalStorage, SessionStorage และ IndexedDB
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {}

        if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                    try { indexedDB.deleteDatabase(db.name); } catch(e){}
                });
            });
        }

        // 3. แสดง Banner แจ้งเตือนสั้นๆ และรีเฟรชหน้าเว็บทันที
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.top = '15px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.backgroundColor = '#d32f2f';
        banner.style.color = '#ffffff';
        banner.style.padding = '10px 20px';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
        banner.style.zIndex = '999999';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '15px';
        banner.innerHTML = '⚡ เคลียร์ Fail (ภาพ/วิดีโอ) เรียบร้อยแล้ว! กำลังรีเฟรช...';
        document.body.appendChild(banner);

        setTimeout(() => {
            window.location.reload();
        }, 600);
    }

    // ตรวจสอบอย่างต่อเนื่องทุก 1 วินาที
    setInterval(handleFailCard, 1000);

    const observer = new MutationObserver(() => {
        handleFailCard();
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
