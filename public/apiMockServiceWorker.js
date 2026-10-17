/* Keep real static assets on the browser's native network path.
 * API requests are handled by the unmodified, generated MSW worker below.
 * Socket.IO is intercepted separately by MSW's WebSocket interceptor.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin ||
    !/^\/(api|__mock)(\/|$)/.test(url.pathname)
  ) {
    event.stopImmediatePropagation();
  }
});
importScripts("/mockServiceWorker.js");
