import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // api: {
  //   bodyParser: {
  //     sizeLimit: '10mb',
  //   },
  // },
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: '10mb',
  //   },
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
