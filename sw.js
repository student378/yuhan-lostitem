// ================================================================
//  유한대학교 분실물 찾기 — Service Worker
//  PWA 오프라인 캐시 및 설치 지원
// ================================================================

const CACHE_NAME = 'yuhan-lostitem-v1';

// 캐시할 파일 목록
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ── 설치 이벤트: 핵심 파일 캐시 ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── 활성화 이벤트: 구 버전 캐시 삭제 ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── 요청 처리: 네트워크 우선, 실패 시 캐시 ──────────────────
self.addEventListener('fetch', event => {
  // GAS(구글 앱스스크립트) 요청은 캐시 안 함
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공 시 캐시에도 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인일 때 캐시에서 반환
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
