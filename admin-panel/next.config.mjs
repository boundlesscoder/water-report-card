/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production' 
                    ? 'https://waterreportcard.com/api/:path*'
                    : 'http://localhost:2018/api/:path*',
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)', // Apply the header to all routes
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                ],
            },
        ];
    },
    images: {
        domains: ["lh3.googleusercontent.com"],
    },
    devIndicators: false,
};

export default nextConfig;