export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [key, ...valParts] = cookie.split('=');
    const value = valParts.join('=').trim();
    if (!key || !value) return;
    cookies[key.trim()] = decodeURIComponent(value);
  });

  return cookies;
}
