// Service Worker for The Seed Engine PWA
// 极简版本：只启用 PWA 功能，不做复杂缓存逻辑

// Install event - 立即激活
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event - 立即接管所有客户端
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('Service Worker: Activated and claimed clients');
    })
  );
});

// Fetch event - 暂时不拦截请求，让浏览器自己处理
// 未来可以在这里添加离线缓存逻辑
self.addEventListener('fetch', (event) => {
  // 暂时不做任何处理，直接使用网络请求
  // 这样可以避免缓存问题，确保总是使用最新版本
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

