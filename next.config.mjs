import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow LAN access for HMR (hot module reload) during development
  allowedDevOrigins: ['172.16.1.5'],
};

export default nextConfig;
