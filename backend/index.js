const express = require('express');
const bcrypt = require('bcrypt');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');

var cors = require('cors')
const app = express();
app.use(cors())
let conversations = [];

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use('/photos', express.static('./uploads'));
const httpPort = 8080;
const httpsPort = 3000;

const httpServer = http.createServer(app);

const httpsServer = https.createServer({
    key: fs.readFileSync('./tls.key'),
    cert: fs.readFileSync('./tls.crt'),

}, app);
const io = new Server(httpsServer, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: "*"
    }
});

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'matrimonial'
});




app.use(bodyParser.urlencoded({ extended: false }));
// serve static files
app.get('/', express.static(path.join(__dirname, '../frontend')));
app.use("/assets/js", express.static(path.join(__dirname, '../frontend/assets/js')));
app.use("/assets/sound", express.static(path.join(__dirname, '../frontend/assets/sound')));
app.use(session({
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // set to true if using HTTPS
}));
app.engine('html', require('ejs').renderFile);

function requireAuth(req, res, next) {
    if (req.session.user_id) {
        // If user is authenticated, continue to next middleware or route handler
        next();
    } else {
        // If user is not authenticated, redirect to login page
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    let filePath = path.join(__dirname, '../frontend/login.html')
    res.sendFile(filePath);
});


app.get('/signup', (req, res) => {
    let filePath = path.join(__dirname, '../frontend/signup.html')
    res.sendFile(filePath);
});

app.post('/signup', (req, res) => {
    const { username, email, password, gender, birthdate } = req.body;

    // Hash the password before storing it in the database
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Insert user data into the database
            const sql = `INSERT INTO users (username, email, password, gender, birthdate) 
                   VALUES (?, ?, ?, ?, ?)`;
            const values = [username, email, hash, gender, birthdate];
            pool.query(sql, values, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result)
                    const token = jwt.sign({ id: result.insertId }, 'orion');

                    // Return the token to the client
                    req.session.user_id = result.insertId;
                    req.session.token = token;

                    res.redirect('https://192.168.1.187:3000/news_feed?user_id=' + result.insertId + '&' + 'token=' + token);
                    //res.status(201).json({ message: 'User created successfully' });
                }
            });
        }
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log("login data ", req.body);


    // Check if the username and password match a user in the database
    pool.query('SELECT * FROM matrimonial.users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }

        if (results.length === 0) {
            console.log("zero results");
            res.status(400).send('Invalid username or password');
            return;
        }
        bcrypt.compare(password, results[0].password, function (err, result) {
            if (err)
                res.status(400).send("invalid username or password");
        });
        //console.log("results", results[0].id);
        const token = jwt.sign({ id: results[0].id }, 'orion');

        // Return the token to the client
        req.session.user_id = results[0].id;
        req.session.token = token;

        res.redirect('https://192.168.1.187:3000/news_feed?user_id=' + results[0].id + '&' + 'token=' + token);
    });

});

app.get('/chat', requireAuth, (req, res) => {
    const user_id = req.query.user_id;
    const token = req.query.token;
    console.log("requested chat");
    let filePath = path.join(__dirname, '../frontend/chat.html')
    res.render(filePath, {
        user_id: user_id,
        token: token
    });
});

app.get('/news_feed', (req, res) => {
    const user_id = req.query.user_id;
    const token = req.query.token;
    let filePath = path.join(__dirname, '../frontend/newsfeed.html')
    res.render(filePath, {
        user_id: user_id,
        token: token
    });
})


// Define the search endpoint
app.get('/users/search', async (req, res) => {
    const { query } = req;
    const { search, page = 1, limit = 10 } = query;

    if (!search) {
        res.status(400).json({ error: 'You must provide a search query' });
        return;
    }

    // Build the SQL query string
    const offset = (page - 1) * limit;
    const sql = 'SELECT id, username, gender, profile_picture_path FROM users WHERE username LIKE ? OR email LIKE ? LIMIT ? OFFSET ?';
    const params = [`%${search}%`, `%${search}%`, 10, offset];

    // Execute the SQL query
    try {
        const results = await queryDatabase(sql, params);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while executing the query' });
    }
});
function save_post_files(data) {
    const uploadDir = './uploads';
    let renamed_files = [];
    data.files.forEach((file) => {
        // Get the current timestamp
        const timestamp = Date.now();

        // Set the filename prefix
        const filenamePrefix = `photo_${timestamp}`;

        // Get the file data from somewhere (e.g. a form submission)
        const fileData = file.file_data;
        const binaryData = Buffer.from(fileData, 'base64');
        //console.log(binaryData)

        // Get the file extension from the original filename
        const fileExtension = path.extname(file.file_name);

        // Set the full file path
        const filePath = path.join(uploadDir, `${filenamePrefix}${fileExtension}`);

        // Save the file to the upload directory
        fs.writeFile(filePath, binaryData, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`File saved as ${filePath}`);
                renamed_files.push('https://192.168.1.187:3000/photos/' + filenamePrefix);
            }
        });
    });
    return renamed_files;

}
function queryDatabase(queryString, params) {
    return new Promise((resolve, reject) => {
        pool.query(queryString, params, (err, results, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

app.post('/posts', async (req, res) => {
    //console.log(req.body);
    try {
        const { user_id, content, type, files } = req.body;

        let renamed_files = save_post_files(req.body);
        console.log(renamed_files, "renamed files");
        // Insert post into the database
        const result = await queryDatabase(
            'INSERT INTO posts (user_id, content, type) VALUES (?, ?, ?)',
            [user_id, content, type])

        const postId = result.insertId;
        //console.log(result);
        //console.log(postId, "postId")

        // Insert files into the database
        if (files.length > 0) {
            const fileData = files.map((file) => [
                postId,
                file.originalname,
                file.mimetype,
                file.path,
            ]);
            renamed_files.forEach(async (file_path) => {
                await queryDatabase(
                    'INSERT INTO post_photos (post_id, post_photo_url) VALUES (?, ?)',
                    [postId, file_path]
                );
            });

        }

        res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }



});

app.get('/friends', (req, res) => {
    // Get the current user's username from the session
    console.log(req.body);
    const currentUser = req.session.user_id;
    console.log("request friends!!")

    // TODO: Query the database to get the list of friends for the current user
    // For example, assuming you have a User model in Mongoose:
    const {id }= req.query
    console.log("user id", id)
    const sql = 'select * from friends INNER JOIN users on friends.friend_id = users.id where friends.friend_id  = ?';
    pool.query(sql, [id], (err, result) => {
        if (err) {
            throw err;
        }
        let redacted = [];
        for (let i = 0; i < result.length; i++) {
            redacted.push({
                username: result[i].username,
                id: result[i].id,
                photo_picture_path: "https://picsum.photos/300/300",
                timestamp: 20333333333,
                isOnline: false
            });
        }

        console.log(result);

        res.send(redacted);
    });
});

app.get("/newsfeed_data", async (req, res) => {
    const { id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let transactions = [{
        id: "newsfeed_data",
        query: `SELECT
        p.id AS post_id,
        p.created_at AS created_at,
        u.username AS username,
        u.id AS user_id,
        u.profile_picture_path AS profile_picture_path,
        COUNT(DISTINCT l.post_id) AS likes_count,
        COUNT(DISTINCT c.post_id) AS comment_count,
        GROUP_CONCAT(DISTINCT ph.post_photo_url) AS post_photo_urls,
        p.content AS post_content
      FROM
        posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN post_photos ph ON p.id = ph.post_id
        LEFT JOIN friends f ON (
          p.user_id = f.user_id
          OR p.user_id = f.friend_id
        )
      WHERE
        (
          f.user_id = ?
          OR f.friend_id = ?
        )
      GROUP BY
        p.id,
        u.username,
        u.profile_picture_path,
        p.content
      ORDER BY
        p.created_at DESC
      LIMIT
        ? OFFSET ?;`,
        parameters: [id, id, 10, offset]

    }];
    let results = await executeTransactions(transactions);
    res.json(results["newsfeed_data"].result);
})
/*
app.get('/photos/:photoName', (req, res) => {
    const photoName = req.params.photoName;
    //const filePath = path.join(__dirname, 'uploads', photoName);
    let filePath = './uploads/' + photoName;
    try{
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: 'Failed to retrieve photo' });
            } else {
                const fileData = Buffer.from(data).toString('base64');
                const fileType = path.extname(filePath).substr(1);
    
                const dataUri = `data:${fileType};base64,${fileData}`;
                res.send({ dataUri });
            }
        });
    }
    catch(error){
        console.log(error);
    }
    
});
*/
app.get('/friend_requests/accept', async (req, res) => {
    const { friend_request_id, from_user, to_user } = req.query;
    console.log(req.query)
    let sql = `UPDATE friend_requests
     SET status = 'accepted'
     WHERE id = ?;`;
    let params = [friend_request_id];
    try {
        let results = await queryDatabase(sql, params);
        let stmt = `INSERT INTO notifications(from_user,to_user,status,type,message,notification_source) VALUES (?, ?, ?, ?, ?, ?)`;
        params = [from_user, to_user, "unread", "friend_request", "Accepted your Request", friend_request_id];
        results = await queryDatabase(stmt, params);
        stmt = `INSERT INTO friends(user_id, friend_id) VALUES (?,?)`;
        params = [from_user, to_user]
        results = await queryDatabase(stmt, params)
        return res.json(results);
    }
    catch (error) {
        console.log(error);
    }

});
app.get('/friend_requests/reject', async (req, res) => {
    const { friend_request_id, from_user, to_user } = req.query;
    let transactions = [
        {
            id: "request",
            query: `UPDATE friend_requests
            SET status = 'rejected'
            WHERE id = ?;`,
            parameters: [friend_request_id]
        },
        {
            id: "notifications",
            query: `INSERT INTO notifications(from_user,to_user,status,type,message,notification_source) VALUES (?, ?, ?, ?, ?, ?)`,
            parameters: [from_user, to_user, "unread", "friend_request", "Rejected your Request", friend_request_id]
        }
    ];
    let results = await executeTransactions(transactions);
    console.log(results, "results reject")
    res.json(results);

});
app.get('/friend_requests', async (req, res) => {
    console.log(req.query);

    const { id, page = 1, limit = 10 } = req.query;

    if (!id) {
        res.status(400).json({ error: 'You must provide a search query' });
        return;
    }

    // Build the SQL query string
    const offset = (page - 1) * limit;
    const sql = 'select friend_requests.id as friend_request_id, from_user_id  , to_user_id, username, profile_picture_path, status from friend_requests INNER JOIN users on friend_requests.to_user_id = users.id where friend_requests.status = "pending" and friend_requests.to_user_id = ? LIMIT ? OFFSET ?';
    const params = [parseInt(id), 10, offset];

    // Execute the SQL query
    try {
        const results = await queryDatabase(sql, params);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while executing the query' });
    }

});

app.get('/notifications', async (req, res) => {
    let { id, page, limit } = req.query;
    id = parseInt(id);
    page = parseInt(page);
    limit = parseInt(limit);
    console.log('notifications', id, page, limit)
    const offset = (page - 1) * limit;
    let transactions = [
        {
            id: "notifications",
            query: `SELECT * FROM notifications INNER JOIN users on notifications.from_user = users.id WHERE status = 'unread' and to_user = ? LIMIT ? OFFSET ?; `,
            parameters: [id, limit, offset]
        }


    ];
    let results = await executeTransactions(transactions);
    res.json(results["notifications"].result);
})

app.post('/friend_requests', async (req, res) => {
    const { to_user_id, from_user_id } = req.body
    console.log("post frined request", to_user_id, from_user_id);




    const sql = 'INSERT INTO friend_requests(from_user_id, to_user_id, status) VALUES(?,?,?)';
    let params = [parseInt(from_user_id), to_user_id, 'pending']

    // Execute the SQL query
    try {
        const results = await queryDatabase(sql, params);
        let stmt = 'INSERT INTO notifications(from_user, to_user, message, notification_source, type, status) VALUES (?, ?, ?, ?, ?, ?)';
        params = [from_user_id, to_user_id, "sent you a friend request", results.insertId, "friend_request", "unread"]
        let second_results = await queryDatabase(stmt, params);
        console.log(results.insertId, second_results.insertId)
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Couldnt send friend request' });
    }
})

app.post('/posts/like', (req, res) => {

});

app.post('/posts/comment', (req, res) => {

})







io.use((socket, next) => {
    const token = socket.handshake.query.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, 'orion', (err, decoded) => {
        if (err) {
            console.log("invalid json token");
            return next(new Error('Authentication error: Invalid token'));
        }

        // Authentication succeeded, store the user ID on the socket object

        socket.user_id = decoded.user_id
        next();
    });
});

// handle incoming socket connections
io.on('connection', (socket) => {
    console.log('a user connected', socket.handshake.query);
    if (!socket.user_id)
        socket.user_id = socket.handshake.query.user_id;



    socket.on('join-room', async (user_id_pair) => {
        let conversationId = create_conversation_id(user_id_pair.from_user, user_id_pair.to_user);
        socket.join(conversationId);

        let clients = await io.fetchSockets();
        for (let i = 0; i < clients.length; i++) {
            if (clients[0].user_id == user_id_pair.to_user) {
                clients[0].join(conversationId);
            }
        }

        console.log("got request to join rooom ", conversationId);
        socket.to(conversationId).emit('user-connected', socket.user_id);

        socket.on('disconnect', async (data) => {
            let clients = await io.fetchSockets();
            let disconnected = true;
            for (let i = 0; i < clients.length; i++) {
                if (clients[0].user_id == socket.user_id) {
                    disconnected = false;
                }
            }

            if (disconnected) {
                console.log('user_disconnected ', conversationId, data);
                const rooms = Object.keys(socket.rooms).filter((room) => room !== socket.id);

                // Emit the notification to all the rooms that the socket is in
                rooms.forEach((room) => {
                    socket.to(room).emit('user-disconnected', socket.user_id);
                    console.log(`Sent notification to room ${room} `);
                });

            }

        });
        socket.on('notify-self-status', (data) => {
            socket.to(conversationId).emit('friend-notify-status', data);
        })
    });



    socket.on('request-peer-room-join', async (data) => {
        console.log('request-peer-room-join ', data);
        let conversationId = create_conversation_id(data.from, data.to);
        let clients = await io.fetchSockets();
        for (let i = 0; i < clients.length; i++) {
            if (clients[0].user_id == data.to) {
                clients[0].join(conversationId);
            }
        }

    })

    socket.on('offer', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('offer', callData);
        console.log("sent the offer to room", conversationId);
    });

    socket.on('answer', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('answer', callData);
        console.log("sent the answer to room", conversationId);


    });

    socket.on('call', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('call', callData);
        console.log("sent the call request to room", conversationId);


    })

    socket.on('accept', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('accept', callData);
        console.log("sent the call accept notification to room", conversationId);

    })

    socket.on('busy', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('busy', callData);
        console.log("sent the user busy notification to room", conversationId);
    })

    socket.on('end', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('end', callData);
        console.log("sent the user call ended notification to room", conversationId);
    })
    socket.on('reject', (callData) => {
        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('reject', callData);
        console.log("sent the call rejected notification to room", conversationId);
    })
    socket.on('candidate', (callData) => {

        let conversationId = create_conversation_id(callData.from, callData.to);
        socket.to(conversationId).emit('candidate', callData);
        console.log("sent the candidate to room", conversationId);

    });
    socket.on('chat-message', (message) => {
        let conversationId = create_conversation_id(message.from, message.to);

        console.log('received chatMessage', message, conversationId);
        socket.to(conversationId).emit('chat-message', message);

    });
});

const PORT = 3000;

httpsServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} `);
});

function create_conversation_id(userId, otherUserId) {
    // Sort the user IDs to ensure consistency in conversation IDs
    const sortedIds = [userId, otherUserId].sort();

    // Concatenate the sorted IDs with a separator to create a conversation ID
    const conversationId = sortedIds.join('-');

    // Check if a conversation with this ID already exists
    return conversationId;


}
function getConnectionFromPool() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(connection);
        });
    });
}
async function executeTransactions(queries) {
    let connection;
    try {
        connection = await getConnectionFromPool();
        await startTransaction(connection);

        const results = {};

        for (const query of queries) {
            const queryResult = await executeQuery(connection, query.query, query.parameters);
            results[query.id] = {
                result: queryResult.result,
                fields: queryResult.fields,
            };
        }

        await commitTransaction(connection);
        return results;
    } catch (error) {
        await rollbackTransaction(connection);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

function startTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function executeQuery(connection, query, parameters) {
    return new Promise((resolve, reject) => {
        connection.query(query, parameters, (err, result, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve({ result, fields });
            }
        });
    });
}

function commitTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.commit((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function rollbackTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.rollback(() => {
            resolve();
        });
    });
}