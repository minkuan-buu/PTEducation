/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: ["**/old-version/**"],
      };
    }

    return config;
  },
};

export default nextConfig;
