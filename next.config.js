/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '256mb',
    },
  },
};

module.exports = nextConfig;
