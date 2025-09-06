import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for frontend origin (adjust as needed)
app.use(cors({ origin: 'http://localhost:3000' }));

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,       
  user: process.env.DB_USER,       
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,     
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// API endpoint to get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Projects');
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// API endpoint to get all users (excluding SSN for security)
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, name, address, balance, email, phone, created_at, updated_at FROM Users'
    );
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// API endpoint to get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    // Join sender and recipient names for readability
    const [rows] = await pool.query(`
      SELECT t.transaction_id, t.date, t.time, t.amount, t.description, t.created_at,
             s.name AS sender_name, r.name AS recipient_name
      FROM Transactions t
      JOIN Users s ON t.sender_id = s.user_id
      JOIN Users r ON t.recipient_id = r.user_id
      ORDER BY t.date DESC, t.time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// API endpoint to get all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.account_id, a.account_type, a.balance, a.created_at, a.updated_at,
             u.name AS user_name
      FROM Accounts a
      JOIN Users u ON a.user_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// API endpoint to create a new transaction
app.post('/api/transactions', async (req, res) => {
  const { sender_id, recipient_id, amount, description } = req.body;

  // Basic validation
  if (!sender_id || !recipient_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  // Use a transaction to keep data consistent
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check sender's balance
    const [senderRows] = await connection.query('SELECT balance FROM Users WHERE user_id = ?', [sender_id]);
    if (senderRows.length === 0) {
      throw new Error('Sender not found');
    }
    if (senderRows[0].balance < amount) {
      throw new Error('Sender has insufficient balance');
    }

    // Insert the transaction record
    await connection.query(
      'INSERT INTO Transactions (date, time, sender_id, recipient_id, amount, description) VALUES (CURDATE(), CURTIME(), ?, ?, ?, ?)',
      [sender_id, recipient_id, amount, description || null]
    );

    // Update balances
    await connection.query('UPDATE Users SET balance = balance - ? WHERE user_id = ?', [amount, sender_id]);
    await connection.query('UPDATE Users SET balance = balance + ? WHERE user_id = ?', [amount, recipient_id]);

    await connection.commit();
    res.status(201).json({ message: 'Transaction completed successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Transaction error:', err);
    res.status(500).json({ error: err.message || 'Transaction failed' });
  } finally {
    connection.release();
  }
});

// Optional: For any unknown route, serve index.html (if you build SPA frontend later)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});