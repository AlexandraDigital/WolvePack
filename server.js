require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
const dbPath = path.join(__dirname, 'wolvepack.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync DATETIME
      )
    `);

    // Step data table
    db.run(`
      CREATE TABLE IF NOT EXISTS step_data (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        steps INTEGER NOT NULL,
        date TEXT NOT NULL,
        source TEXT DEFAULT 'manual',
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, date)
      )
    `);

    // Achievements table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        badge_type TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Sync log table
    db.run(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source TEXT,
        steps_synced INTEGER,
        sync_status TEXT,
        sync_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    console.log('Database initialized');
  });
}

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create/Get user
app.post('/api/users', (req, res) => {
  const { username, email } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  const userId = uuidv4();
  db.run(
    'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
    [userId, username, email],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          // User exists, return existing user
          db.get(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (err, row) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json(row);
            }
          );
        } else {
          res.status(500).json({ error: err.message });
        }
      } else {
        res.json({ id: userId, username, email });
      }
    }
  );
});

// Get user by ID
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  db.get(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json(row);
    }
  );
});

// Submit step data (from Android app or web)
app.post('/api/steps', (req, res) => {
  const { user_id, steps, date, source } = req.body;
  
  if (!user_id || steps === undefined || !date) {
    return res.status(400).json({ error: 'Missing required fields: user_id, steps, date' });
  }

  const stepId = uuidv4();
  db.run(
    'INSERT OR REPLACE INTO step_data (id, user_id, steps, date, source) VALUES (?, ?, ?, ?, ?)',
    [stepId, user_id, steps, date, source || 'mobile'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Log sync
      const syncId = uuidv4();
      db.run(
        'INSERT INTO sync_log (id, user_id, source, steps_synced, sync_status) VALUES (?, ?, ?, ?, ?)',
        [syncId, user_id, source, steps, 'success']
      );

      res.json({ success: true, id: stepId, steps, date });
    }
  );
});

// Get step data for user (today or date range)
app.get('/api/steps/:userId', (req, res) => {
  const { userId } = req.params;
  const { from, to } = req.query;

  let query = 'SELECT * FROM step_data WHERE user_id = ?';
  let params = [userId];

  if (from && to) {
    query += ' AND date BETWEEN ? AND ? ORDER BY date DESC';
    params.push(from, to);
  } else {
    query += ' ORDER BY date DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Get today's steps
app.get('/api/steps/:userId/today', (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  db.get(
    'SELECT * FROM step_data WHERE user_id = ? AND date = ?',
    [userId, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || { steps: 0, date: today });
    }
  );
});

// Get user stats (weekly summary)
app.get('/api/stats/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    `SELECT 
      SUM(steps) as total_steps,
      COUNT(*) as days_tracked,
      AVG(steps) as avg_steps,
      MAX(steps) as max_steps,
      MIN(steps) as min_steps
    FROM step_data 
    WHERE user_id = ? 
    AND date >= date('now', '-7 days')`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows[0] || {});
    }
  );
});

// Unlock achievement
app.post('/api/achievements', (req, res) => {
  const { user_id, title, description, badge_type } = req.body;

  const achievementId = uuidv4();
  db.run(
    'INSERT INTO achievements (id, user_id, title, description, badge_type) VALUES (?, ?, ?, ?, ?)',
    [achievementId, user_id, title, description, badge_type],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: achievementId });
    }
  );
});

// Get user achievements
app.get('/api/achievements/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(
    'SELECT * FROM achievements WHERE user_id = ? ORDER BY achieved_at DESC',
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Sync status
app.get('/api/sync/:userId', (req, res) => {
  const { userId } = req.params;
  db.get(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'User not found' });
      
      res.json({
        user_id: userId,
        last_sync: row.last_sync,
        is_synced: row.last_sync !== null
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🐺 WolvePack backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
