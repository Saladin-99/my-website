/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {images: {unoptimized: true}},
  basePath: "/my-website",
  output: "export",  // <=== enables static exports
  reactStrictMode: true,
};
  
  export default nextConfig
