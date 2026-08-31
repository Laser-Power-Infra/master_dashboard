import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.190', '192.168.1.196'],                                                     
  output: "standalone",
};

export default nextConfig;
