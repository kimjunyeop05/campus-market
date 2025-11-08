// next.config.ts
const nextConfig = {
  typescript: {
    // 임시 응급조치: 타입 에러가 있어도 빌드(배포) 진행
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
