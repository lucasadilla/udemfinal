const getCookieDomain = (host = '') => {
  const hostname = host.split(':')[0];
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  const withoutWww = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  return `.${withoutWww}`;
};

const isSecureRequest = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.headers['x-forwarded-protocol'];
  if (proto) {
    return proto.split(',')[0] === 'https';
  }
  return Boolean(req.connection?.encrypted);
};

export default function handler(req, res) {
  // Clear cookie logic mirroring login.js
  const cookieAttributes = ['admin-auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'];
  
  const domain = getCookieDomain(req.headers?.host);
  if (domain) {
    cookieAttributes.push(`Domain=${domain}`);
  }
  
  if (isSecureRequest(req)) {
    cookieAttributes.push('Secure');
  }
  
  // Also try to clear without domain just in case
  // Note: You can set multiple Set-Cookie headers by passing an array
  const cookiesToSet = [cookieAttributes.join('; ')];

  // If a domain was determined, also try to clear the host-only cookie to be safe
  if (domain) {
      const hostOnlyAttributes = ['admin-auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'];
      if (isSecureRequest(req)) {
        hostOnlyAttributes.push('Secure');
      }
      cookiesToSet.push(hostOnlyAttributes.join('; '));
  }

  res.setHeader('Set-Cookie', cookiesToSet);
  
  return res.status(200).json({ ok: true });
}

