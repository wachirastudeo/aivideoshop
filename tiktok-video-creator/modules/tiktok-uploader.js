/**
 * tiktok-uploader.js
 * Direct TikTok upload ผ่าน session cookie — ไม่ต้องเปิด browser automation
 * ใช้ endpoint เดียวกับที่ www.tiktok.com/tiktokstudio/upload ใช้
 */

const TIKTOK_WEB_BASE = "https://www.tiktok.com";

// ── Endpoint patterns (ค้นพบจาก debugger intercept) ────────────────────────
// ถ้า learnedPattern ถูก set ไว้แล้ว ใช้ตัวนั้น; ไม่งั้นใช้ค่า default ที่รู้จาก reverse engineering
const DEFAULT_ENDPOINTS = {
  uploadInit:  `${TIKTOK_WEB_BASE}/api/v1/video/upload/file/`,
  uploadPart:  null,   // set จาก uploadInit response
  publishDraft:`${TIKTOK_WEB_BASE}/api/v1/post/publish/draft/`,
  csrfToken:   `${TIKTOK_WEB_BASE}/api/v1/h5/config/`,
};

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC: ส่งวิดีโอไป TikTok เป็น draft
// payload: { videoUrl, caption, hashtags[], learnedEndpoints? }
// ────────────────────────────────────────────────────────────────────────────
export async function sendToDraft(payload) {
  const { videoUrl, caption = "", hashtags = [], learnedEndpoints = {} } = payload;

  const endpoints = { ...DEFAULT_ENDPOINTS, ...learnedEndpoints };

  // 1. ดึง CSRF token จาก cookie
  const csrfToken = getCsrfToken();

  // 2. ดาวน์โหลด video blob (background ส่งมาเป็น URL)
  const videoBlob = await fetchVideoBlob(videoUrl);

  // 3. Init upload → รับ upload_url
  const initData = await initUpload(endpoints.uploadInit, videoBlob.size, csrfToken);

  // 4. อัปโหลด binary chunks
  await uploadChunks(initData.upload_url || initData.uploadUrl, videoBlob);

  // 5. Publish เป็น draft
  const result = await publishDraft({
    endpoint: endpoints.publishDraft,
    uploadId:  initData.upload_id || initData.uploadId || initData.video_id,
    caption,
    hashtags,
    csrfToken,
  });

  return { ok: true, draftId: result.draft_id || result.post_id || null };
}

// ── Step 2: ดึงวิดีโอ blob ────────────────────────────────────────────────
async function fetchVideoBlob(videoUrl) {
  const res = await fetch(videoUrl, { credentials: "omit" });
  if (!res.ok) throw new Error(`ดาวน์โหลดวิดีโอล้มเหลว: ${res.status}`);
  return await res.blob();
}

// ── Step 3: Init upload ───────────────────────────────────────────────────
async function initUpload(endpoint, fileSize, csrfToken) {
  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
      "Referer": `${TIKTOK_WEB_BASE}/tiktokstudio/upload`,
    },
    body: JSON.stringify({ file_size: fileSize }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Init upload ล้มเหลว (${res.status}): ${text}`);
  }

  const data = await res.json();
  const inner = data?.data || data;

  if (!inner?.upload_url && !inner?.uploadUrl) {
    throw new Error(
      "ไม่ได้รับ upload_url จาก TikTok — ลอง Learn Endpoint ใหม่อีกครั้ง\n" +
      "Response: " + JSON.stringify(inner).slice(0, 200)
    );
  }

  return inner;
}

// ── Step 4: Upload chunks ─────────────────────────────────────────────────
async function uploadChunks(uploadUrl, blob) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
  const total = blob.size;
  let offset = 0;
  let part = 0;

  while (offset < total) {
    const chunk = blob.slice(offset, offset + CHUNK_SIZE);
    const res = await fetch(uploadUrl, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${offset}-${offset + chunk.size - 1}/${total}`,
        "X-Part-Number": String(part),
      },
      body: chunk,
    });

    if (!res.ok && res.status !== 308) {
      throw new Error(`Upload chunk ${part} ล้มเหลว: ${res.status}`);
    }

    offset += chunk.size;
    part++;
  }
}

// ── Step 5: Publish draft ─────────────────────────────────────────────────
async function publishDraft({ endpoint, uploadId, caption, hashtags, csrfToken }) {
  const captionWithTags = [caption, ...hashtags.map(t => t.startsWith("#") ? t : `#${t}`)].join(" ").trim();

  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
      "Referer": `${TIKTOK_WEB_BASE}/tiktokstudio/upload`,
    },
    body: JSON.stringify({
      upload_id: uploadId,
      text: captionWithTags,
      is_draft: true,
      privacy_level: "SELF_ONLY",   // draft = private ไว้ก่อน user edit เอง
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Publish draft ล้มเหลว (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.data || data;
}

// ── CSRF token จาก cookie ─────────────────────────────────────────────────
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)tt_csrf_token=([^;]+)/);
  return match?.[1] || "";
}
