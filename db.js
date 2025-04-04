const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

// Create a PostgreSQL connection pool
const pool = new `Pool`({
    host: process.env.DB_HOST,   // Load from .env
    user: process.env.DB_USER,   // Load from .env
    password: process.env.DB_PASS, // Load from .env
    database: process.env.DB_NAME, // Load from .env
    port: process.env.DB_PORT || 5432, // Default PostgreSQL port
    max: process.env.DB_CONNECTION_LIMIT || 10, // Max connections in the pool
    ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
});

// Function to check database connection
pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database!');
        client.release(); // Release the connection back to the pool
    })
    .catch(err => console.error('Database connection failed:', err));

// Export the pool to use in other files
module.exports = pool;


// // const mysql = require('mysql2');
// const { Pool } = require('pg');
// const dotenv = require('dotenv');

// dotenv.config(); // Load environment variables from .env file

// // Create a MySQL connection pool (for better connection management)
// const pool = mysql.createPool({
//     host: process.env.DB_HOST, // Load from .env
//     user: process.env.DB_USER, // Load from .env
//     password: process.env.DB_PASS, // Load from .env
//     database: process.env.DB_NAME, // Load from .env
//     waitForConnections: true,  // Ensures that the pool waits for connections if the limit is reached
//     connectionLimit: process.env.DB_CONNECTION_LIMIT || 10, // Load from .env or default to 10
//     queueLimit: 0             // No queue limit
// });

// // Create a promise-based interface fr the connection pool
// const db = pool.promise();

// // Connect and check connection status
// pool.getConnection((err, connection) => {
//     if (err) {
//         console.error('❌ Database connection failed:', err);
//         return;
//     }
//     console.log('✅ Connected to MySQL database.');
//     connection.release();  // Release the connection back to the pool
// });



// module.exports = db;

