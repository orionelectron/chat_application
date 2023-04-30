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



const httpPort = 8080;
const httpsPort = 3000;

const httpServer = http.createServer(app);

const httpsServer = https.createServer({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert'),

}, app);
const io = new Server(httpsServer, {
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
    if (req.session.username) {
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
            res.status(400).send('Invalid username or password');
            return;
        }
        const token = jwt.sign({ username }, 'orion');

        // Return the token to the client
        req.session.username = username;
        req.session.token = token;

        res.redirect('/chat?username=' + username + '&' + 'token=' + token );
    });
});

app.get('/chat', requireAuth, (req, res) => {
    const username = req.query.username;
    const token = req.query.token;
    let filePath = path.join(__dirname, '../frontend/chat.html')
    res.render(filePath, {
        username: username,
        token: token
    });
});

app.get('/friends', requireAuth, (req, res) => {
    // Get the current user's username from the session
    const currentUser = req.session.username;
    console.log("request friends!!")

    // TODO: Query the database to get the list of friends for the current user
    // For example, assuming you have a User model in Mongoose:
    const username = req.session.username;

    const sql = 'SELECT * FROM matrimonial.users WHERE username != ?';
    pool.query(sql, [username], (err, result) => {
        if (err) {
            throw err;
        }
        let redacted = [];
        for (let i = 0; i < result.length; i++) {
            redacted.push({ username: result[i].username, id: result[i].id });
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
        socket.username = decoded.username;
        next();
    });
});


// handle incoming socket connections
io.on('connection', (socket) => {
    console.log('a user connected');



    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log("got request to join rooom ", roomId);
        socket.to(roomId).emit('user-connected', roomId);

        socket.on('disconnect', () => {
            console.log('user_disconnected ', roomId);
            socket.to(roomId).emit('user-disconnected', roomId);
        });
    });

    socket.on('offer', (offer, callData) => {
        console.log("sent the offer to room", callData.to);
        socket.to(callData.to).emit('offer', offer, callData);
    });

    socket.on('answer', (answer, callData) => {
        console.log("sent the answer to room", callData.to);
        socket.to(callData.to).emit('answer', answer, callData);

    });

    socket.on('call', (callData) => {
        console.log("Incoming call to room ", callData.to);
        socket.to(callData.to).emit('call', callData);
    })

    socket.on('accept', (callData) => {
        console.log("Call accepted for room ", callData.to);
        socket.to(callData.to).emit('accept', callData);
    })

    socket.on('candidate', (candidate, callData) => {
        console.log("sent the candidate to room", callData.to);
        socket.to(callData.to).emit('candidate', candidate, callData);

    });
    socket.on('chatMessage', (message, roomId) => {
        console.log('received chatMessage', message);
        socket.to(roomId).emit('chatMessage', message);

    });
});

const PORT = 3000;

httpsServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
