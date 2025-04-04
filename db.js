const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

// Create a MySQL connection pool (for better connection management)
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Load from .env
    user: process.env.DB_USER, // Load from .env
    password: process.env.DB_PASS, // Load from .env
    database: process.env.DB_NAME, // Load from .env
    waitForConnections: true,  // Ensures that the pool waits for connections if the limit is reached
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10, // Load from .env or default to 10
    queueLimit: 0             // No queue limit
});

// Create a promise-based interface fr the connection pool
const db = pool.promise();

// Connect and check connection status
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL database.');
    connection.release();  // Release the connection back to the pool
});



module.exports = db;
