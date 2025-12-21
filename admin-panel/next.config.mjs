/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                // In both dev and production, proxy to localhost backend (they're on the same server)
                // Remove /api prefix since backend routes don't have /api prefix
                destination: 'http://localhost:2018/:path*',
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