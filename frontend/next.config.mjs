/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_TRACKING_SERVICE_URL:
      process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL,
  },
};

export default nextConfig;
