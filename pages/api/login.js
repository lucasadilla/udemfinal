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
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (username === adminUser && password === adminPass) {
    const cookieAttributes = ['admin-auth=true', 'Path=/', 'Max-Age=3600', 'SameSite=Lax'];
    const domain = getCookieDomain(req.headers?.host);
    if (domain) {
      cookieAttributes.push(`Domain=${domain}`);
    }
    if (isSecureRequest(req)) {
      cookieAttributes.push('Secure');
    }
    res.setHeader('Set-Cookie', cookieAttributes.join('; '));
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: 'Identifiants invalides.' });
}
