import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://6000-firebase-studio-1749565357906.cluster-ombtxv25tbd6yrjpp3lukp6zhc.cloudworkstations.dev',
    'https://9000-firebase-studio-1749565357906.cluster-ombtxv25tbd6yrjpp3lukp6zhc.cloudworkstations.dev',
    'http://localhost:9002/',
  ],
};

export default nextConfig;