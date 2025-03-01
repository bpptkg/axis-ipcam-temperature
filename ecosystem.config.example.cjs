module.exports = {
    apps: [
        {
            name: "lewotobi",
            script: "index.ts",
            interpreter: "node_modules/.bin/tsx",
            env: {
                CAMERA_IP: "192.189.77.8",
                USERNAME: "root",
                PASSWORD: "pass",
                CALLBACK_URL: "https://axis-ipcam-db-proxy.cendana15.com",
                AUTH_USERNAME: "",
                AUTH_PASSWORD: "",
            },
        },
    ],
};
