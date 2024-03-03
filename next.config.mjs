/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  //experimental: {images: {unoptimized: true}},                //these 3 configs are for gh pages deployment
  //basePath: "/my-website",                                    //and need to be commented out to be able
  //output: "export",  // <=== enables static exports           //to run locally with npm run  
  reactStrictMode: true,
};
  
  export default nextConfig
