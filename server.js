import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const app = express();
const port = 5000;

// Enable CORS for all origins (adjust as needed for production)
app.use(cors());

app.use(express.json());

// Create MySQL connection pool with your credentials
const pool = mysql.createPool({
  host: 'cloudrds-vpc2.cbyyu6ag02px.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'password',  // <-- Replace with your actual DB password
  database: 'cloudrds',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Pagination helper
function parsePagination(req) {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// GET /api/users
app.get('/api/users', async (req, res) => {
  const { limit, offset, page } = parsePagination(req);
  try {
    const [rows] = await pool.query(`SELECT * FROM Users LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Users`);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (err) {
    console.error('Error in /api/users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// GET /api/transactions
app.get('/api/transactions', async (req, res) => {
  const { limit, offset, page } = parsePagination(req);
  try {
    const [rows] = await pool.query(`SELECT * FROM Transactions LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Transactions`);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (err) {
    console.error('Error in /api/transactions:', err);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// GET /api/accounts
app.get('/api/accounts', async (req, res) => {
  const { limit, offset, page } = parsePagination(req);
  try {
    const [rows] = await pool.query(`SELECT * FROM Accounts LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM Accounts`);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (err) {
    console.error('Error in /api/accounts:', err);
    res.status(500).json({ error: 'Error fetching accounts' });
  }
});

// POST /api/login - simple hardcoded login for testing
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username, password });

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  // Hardcoded check for demo
  if (username === 'john' && password === 'password') {
    const token = crypto.randomBytes(16).toString('hex');
    return res.json({
      message: 'Login successful',
      token,
      userid: 1,
      username: 'john',
      name: 'John Doe',
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// Serve static files if needed
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Test DB connection at startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Database connection OK');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}
testConnection();

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});