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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  // Clear cookie with all possible configurations
  const domain = getCookieDomain(req.headers?.host);
  const isSecure = isSecureRequest(req);
  
  // Build cookie deletion string with the same attributes as login
  const cookieAttributes = ['admin-auth=', 'Path=/', 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'];
  
  if (domain) {
    cookieAttributes.push(`Domain=${domain}`);
  }
  
  if (isSecure) {
    cookieAttributes.push('Secure');
  }
  
  cookieAttributes.push('SameSite=Lax');
  
  // Set cookie deletion header
  res.setHeader('Set-Cookie', cookieAttributes.join('; '));
  
  return res.status(200).json({ ok: true });
}

