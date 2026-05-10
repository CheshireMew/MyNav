require('dotenv').config();
const { setupDb } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
}

async function start() {
    const db = await setupDb();
    const app = createApp(db, { jwtSecret: JWT_SECRET });

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start().catch(error => {
    console.error(error);
    process.exit(1);
});
