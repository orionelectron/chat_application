const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
 const app = express();
 // Use Body Parser Middleware
app.use(bodyParser.json());
 // Create MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'socialmedia',
});
 // Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database.');
});
 // Get Posts Endpoint
app.get('/posts', (req, res) => {
  const sql = 'SELECT * FROM posts';
  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    }
    res.status(200).send(results);
  });
});
 // Create Post Endpoint
app.post('/posts', (req, res) => {
  const { content, author } = req.body;
  const sql = 'INSERT INTO posts (content, author) VALUES (?, ?)';
  db.query(sql, [content, author], (err, result) => {
    if (err) {
      throw err;
    }
    const newPost = {
      id: result.insertId,
      content,
      author,
    };
    res.status(201).send(newPost);
  });
});
 // Like Post Endpoint
app.post('/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);
   const checkSql = 'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?';
  db.query(checkSql, [postId, userId], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      return res.status(400).send({ message: 'You have already liked this post.' });
    }
     const sql = 'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)';
    db.query(sql, [postId, userId], (err, result) => {
      if (err) {
        throw err;
      }
      res.status(200).send({ message: 'Post liked successfully.' });
    });
  });
});
 // Share Post Endpoint
app.post('/posts/:id/share', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);
   const checkSql = 'SELECT * FROM post_shares WHERE post_id = ? AND user_id = ?';
  db.query(checkSql, [postId, userId], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      return res.status(400).send({ message: 'You have already shared this post.' });
    }
     const sql = 'INSERT INTO post_shares (post_id, user_id) VALUES (?, ?)';
    db.query(sql, [postId, userId], (err, result) => {
      if (err) {
        throw err;
      }
      res.status(200).send({ message: 'Post shared successfully.' });
    });
  });
});
 // Comment on Post Endpoint
app.post('/posts/:id/comment', (req, res) => {
  const postId = parseInt(req.params.id);
  const { content, author } = req.body;
  const sql = 'INSERT INTO post_comments (post_id, content, author) VALUES (?, ?, ?)';
  db.query(sql, [postId, content, author], (err, result) => {
    if (err) {
      throw err;
    }
    const newComment = {
      id: result.insertId,
      content,
      author,
    };
    res.status(200).send({ message: 'Comment added successfully.', comment: newComment });
  });
});
 // Get Friend List Endpoint
app.get('/users/:id/friends', (req, res) => {
  const userId = parseInt(req.params.id);
  const sql = 'SELECT users.* FROM users JOIN friendships ON users.id = friendships.friend_id WHERE friendships.user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      throw err;
    }
    res.status(200).send(results);
  });
});
 // Send Friend Request Endpoint
app.post('/users/:id/friend-requests', (req, res) => {
  const userId = parseInt(req.params.id);
  const { friendId } = req.body;
  const checkSql = 'SELECT * FROM friend_requests WHERE user_id = ? AND friend_id = ?';
  db.query(checkSql, [userId, friendId], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      return res.status(400).send({ message: 'Friend request already sent.' });
    }
     const sql = 'INSERT INTO friend_requests (user_id, friend_id) VALUES (?, ?)';
    db.query(sql, [userId, friendId], (err, result) => {
      if (err) {
        throw err;
      }
      res.status(200).send({ message: 'Friend request sent successfully.' });
    });
  });
});
 // Accept Friend Request Endpoint
app.post('/users/:id/friend-requests/:friendId/accept', (req, res) => {
  const userId = parseInt(req.params.id);
  const friendId = parseInt(req.params.friendId);
   const checkSql = 'SELECT * FROM friend_requests WHERE user_id = ? AND friend_id = ?';
  db.query(checkSql, [friendId, userId], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length === 0) {
      return res.status(400).send({ message: 'No friend request found.' });
    }
     const sql1 = 'DELETE FROM friend_requests WHERE user_id = ? AND friend_id = ?';
    const sql2 = 'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)';
    db.query(sql1, [friendId, userId], (err, result) => {
      if (err) {
        throw err;
      }
      db.query(sql2, [userId, friendId], (err, result) => {
        if (err) {
          throw err;
        }
        res.status(200).send({ message: 'Friend request accepted successfully.' });
      });
    });
  });
});
 // Start Server
app.listen(3000, () => {
  console.log('Server started on port 3000.');
});