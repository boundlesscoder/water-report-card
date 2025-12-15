/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/tiles/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://69.16.254.46:2018'}/tiles/:path*`, // Backend route is /tiles (no /api)
            },
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://69.16.254.46:2018'}/:path*`, // Other API routes
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
                        value: 'same-origin', // Allow interaction between windows of the same origin
                    },
                ],
            },
        ];
    },
    images: {
        domains: ["lh3.googleusercontent.com"], // ✅ Allow Google profile images
    },
    devIndicators : false,
};

export default nextConfig;