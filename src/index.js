// ЭТО ES-МОДУЛЬ (работает с новым API Workers)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    // Если параметр 'url' не передан — показываем инструкцию
    if (!targetUrl) {
      return new Response(
        `CORS Proxy is running. Usage: ?url=https://example.com\n` +
        `Example: ${url.origin}${url.pathname}?url=https://app.endlesstools.io/embed/bcf7be9e...`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // Формируем запрос к целевому URL
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // Важно: сохраняем режим 'cors' не требуется, мы действуем как сервер
    });

    // Добавляем заголовок, чтобы целевой сервер думал, что запрос от браузера
    proxyRequest.headers.set('Origin', new URL(targetUrl).origin);
    proxyRequest.headers.set('Referer', new URL(targetUrl).origin);

    try {
      const response = await fetch(proxyRequest);

      // Создаём копию ответа, добавляем CORS-заголовки для браузера
      const modifiedHeaders = new Headers(response.headers);
      modifiedHeaders.set('Access-Control-Allow-Origin', '*');
      modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      modifiedHeaders.set('Access-Control-Allow-Headers', '*');
      // Убираем запрет на встраивание в iframe
      modifiedHeaders.delete('X-Frame-Options');
      modifiedHeaders.set('Content-Security-Policy', "frame-ancestors *");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders,
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 500 });
    }
  }
};
