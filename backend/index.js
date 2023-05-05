const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const multer = require('multer');
let conversations = [];



const httpPort = 8080;
const httpsPort = 3000;

const httpServer = http.createServer(app);

const httpsServer = https.createServer({
    key: fs.readFileSync('./rootCA.key'),
    cert: fs.readFileSync('./rootCA.crt'),

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

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        console.log("file upload!!");
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage
}).array('files', 10);


// keep track of connected clients
let clients = {};
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
    const { username, email, password } = req.body;

    // Check if the username or email already exists in the database
    pool.query('SELECT * FROM matrimonial.users WHERE username = ? OR email = ?', [username, email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }

        if (results.length > 0) {
            res.status(400).send('Username or email already exists');
            return;
        }

        // Insert the new user into the database
        pool.query('INSERT INTO matrimonial.users (username, email, password) VALUES (?, ?, ?)', [username, email, password], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send('Server error');
                return;
            }

            req.session.username = username;

            res.redirect('/chat?username=' + username);
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("login data ", req.body);

    // Check if the username and password match a user in the database
    pool.query('SELECT * FROM matrimonial.users WHERE username = ? AND password = ?', [username, password], (err, results) => {
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
        //console.log("results", results[0].id);
        const token = jwt.sign({ id: results[0].id }, 'orion');

        // Return the token to the client
        req.session.user_id = results[0].id;
        req.session.token = token;

        res.redirect('https://localhost:3000/chat?user_id=' + results[0].id + '&' + 'token=' + token);
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

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            // Handle error
            res.status(400).send('Error uploading file(s).');
        } else {
            // Files uploaded successfully
            res.status(200).send('File(s) uploaded.');
        }
    });
});

app.get('/friends', requireAuth, (req, res) => {
    // Get the current user's username from the session
    console.log(req.body);
    const currentUser = req.session.user_id;
    console.log("request friends!!")

    // TODO: Query the database to get the list of friends for the current user
    // For example, assuming you have a User model in Mongoose:
    const id = req.session.user_id;

    const sql = 'SELECT * FROM matrimonial.users WHERE id != ?';
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
                last_active: 20,
                isOnline: false
            });
        }

        console.log(result);

        res.send(redacted);
    });
});






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
                socket.to(conversationId).emit('user-disconnected', socket.user_id);
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
    console.log(`Server is running on port ${PORT}`);
});

function create_conversation_id(userId, otherUserId) {
    // Sort the user IDs to ensure consistency in conversation IDs
    const sortedIds = [userId, otherUserId].sort();

    // Concatenate the sorted IDs with a separator to create a conversation ID
    const conversationId = sortedIds.join('-');

    // Check if a conversation with this ID already exists
    return conversationId;


}
