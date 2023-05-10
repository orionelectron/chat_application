// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

// Create a MySQL pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydatabase'
});

// Create a new Express application
const app = express();

// Set up middleware
app.use(bodyParser.json());

app.post('/messages', (req, res) => {
  const fromUserId = req.body.from_user_id;
  const toUserId = req.body.to_user_id;
  const message = req.body.message;

  // Create a new message in the database
  pool.query(
    'INSERT INTO messages (from_user_id, to_user_id, message) VALUES (?, ?, ?)',
    [fromUserId, toUserId, message],
    (error, results, fields) => {
      if (error) throw error;

      // Send the newly created message back to the client
      const newMessage = { id: results.insertId, from_user_id: fromUserId, to_user_id: toUserId, message: message };
      res.status(201).json(newMessage);
    }
  );
});

// Endpoint to add a new message file
app.post('/message-files', (req, res) => {
  const messageId = req.body.message_id;
  const filePath = req.body.file_path;
  const isPhoto = req.body.is_photo;

  // Create a new message file in the database
  pool.query(
    'INSERT INTO message_files (message_id, file_path, is_photo) VALUES (?, ?, ?)',
    [messageId, filePath, isPhoto],
    (error, results, fields) => {
      if (error) throw error;

      // Send the newly created message file back to the client
      const newMessageFile = { id: results.insertId, message_id: messageId, file_path: filePath, is_photo: isPhoto };
      res.status(201).json(newMessageFile);
    }
  );
});

// Create a new notification
app.post('/notifications', (req, res) => {
  const { from_user, to_user, message, notification_source } = req.body;

  const sql = 'INSERT INTO notifications (from_user, to_user, message, notification_source) VALUES (?, ?, ?, ?)';
  const values = [from_user, to_user, message, notification_source];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating notification:', err);
      res.sendStatus(500);
      return;
    }
    res.status(201).json({ id: result.insertId });
  });
});

// Delete a notification by ID
app.delete('/notifications/:id', (req, res) => {
  const id = req.params.id;

  const sql = 'DELETE FROM notifications WHERE id = ?';
  const values = [id];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error deleting notification:', err);
      res.sendStatus(500);
      return;
    }
    if (result.affectedRows === 0) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204);
  });
});

// Get  notifications for a user
app.get('/notifications/:user_id', (req, res) => {
  const user_id = req.params.user_id;

  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 10;
  const offset = (page - 1) * perPage;

  const countSql = 'SELECT COUNT(*) AS count FROM notifications WHERE to_user = ?';
  const countValues = [user_id];

  connection.query(countSql, countValues, (err, countResult) => {
    if (err) {
      console.error('Error getting notification count:', err);
      res.sendStatus(500);
      return;
    }

    const count = countResult[0].count;
    const totalPages = Math.ceil(count / perPage);

    const sql = 'SELECT * FROM notifications WHERE to_user = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const values = [user_id, perPage, offset];

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error getting notifications:', err);
        res.sendStatus(500);
        return;
      }
      res.json({
        notifications: results,
        pagination: {
          page,
          per_page: perPage,
          total_pages: totalPages,
          total_items: count
        }
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});







