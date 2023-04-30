const express = require('express');
const app = express();
const https = require('https');

const path = require('path');
const fs = require('fs');


const httpsPort = 3000;



const httpsServer = https.createServer({
    key: fs.readFileSync('./site_key.key'),
    cert: fs.readFileSync('./site_cert.crt'),

}, app);



// keep track of connected clients
let clients = {};

// serve static files


app.get('/', (req, res) => {
    console.log('got request')
    res.send(fs.readFileSync('../frontend/index.html'));
});
app.use("/assets/js", express.static(path.join(__dirname, '../frontend/assets/js')));



const PORT =  5500;

httpsServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
