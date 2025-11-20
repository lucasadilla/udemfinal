/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  outDir: 'public',
};
