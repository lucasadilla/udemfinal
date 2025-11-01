export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (username === adminUser && password === adminPass) {
    res.setHeader('Set-Cookie', `admin-auth=true; Path=/; Max-Age=3600; SameSite=Strict`);
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: 'Identifiants invalides.' });
}
