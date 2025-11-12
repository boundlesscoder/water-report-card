module.exports = {
    apps: [
        {
            name: 'backend',
            script: './src/server.js',
            cwd: './backend',
            watch: false,
            env: {
                NODE_ENV: 'production',
            }
        },
        {
            name: 'frontend',
            script: 'npm',
            args: 'start',
            cwd: './frontend',
            watch: false,
            env: {
                NODE_ENV: 'production',
            }
        },
        {
            name: 'admin-panel',
            script: 'npm',
            args: 'start',
            cwd: './admin-panel',
            watch: false,
            env: {
                NODE_ENV: 'production',
                NEXT_PUBLIC_API_URL: 'https://waterreportcard.com'
            }
        }
    ]
};  