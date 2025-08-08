// Import necessary modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();
const http = require('http');
const https = require('https');
const fs = require('fs');

// Set up body parser middleware to handle form submissions
app.use(bodyParser.urlencoded({ extended: true }));

// Set up middleware to parse JSON bodies
app.use(bodyParser.json());

// Set up middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static('public'));
app.use('/socket.io', express.static('node_modules/socket.io/client-dist'));

// Set up session management
app.use(session({
    secret: 'python\'s_aboard',
    resave: true,
    saveUninitialized: true,
}));
    
// Set up the view engine
app.set('view engine', 'pug');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Database connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'python\'s_aboard',
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    } else {
        console.log('Connected to the database');
    }
});

// Check login status middleware
function checkLoggedIn(req, res, next) { 
  if (req.session.loggedin) { 
    next(); 
  } else { 
    req.session.error = 'Please Login!'; 
    res.redirect('/login'); 
  } 
} 

// Define route
const loginRoutes = require('./routes/login')(db);
const usernameRoutes = require('./routes/username')(db);
const emailRoutes = require('./routes/email')(db);
const registerRoutes = require('./routes/register')(db);
const logoutRoutes = require('./routes/logout');
const hostRoutes = require('./routes/host')(db);
const gameroomRoutes = require('./routes/gameroom')(db);
const joinRoutes = require('./routes/join')(db);
const gamesessionRoutes = require('./routes/gamesession')(db);

// Use routes
app.get('/', (req, res) => {
    res.render('login');
});
app.use('/login', loginRoutes);
app.use('/username', usernameRoutes);
app.use('/email', emailRoutes);
app.use('/register', registerRoutes);
app.use(function(req, res, next) {
    req.db = db; // Make db available in request object
    next();
});
app.use('/logout', logoutRoutes);
app.get('/dashboard', checkLoggedIn, (req, res) => {
    res.render('dashboard', { 
        username: req.session.username,
        user_id: req.session.user_id
    });
});
app.use('/host', hostRoutes);
app.use('/gameroom', gameroomRoutes);
app.use('/join', joinRoutes);
app.use('/gamesession', gamesessionRoutes);

// Create HTTP server
const httpServer = http.createServer(app);

// Create HTTPS server
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
};

const server = https.createServer(options, app);

// Initialize Socket.IO
const io = require('socket.io')(server);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Listen on both HTTP and HTTPS ports
httpServer.listen(3000, () => {
    console.log('HTTP Server running on port 3000');
});

server.listen(3443, () => {
    console.log('HTTPS Server running on port 3443');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    socket.on('joinGame', (sessionId) => {
        socket.join(`game${sessionId}`);
    });

    socket.on('playerAnswered', (data) => {
        io.to(`game${data.sessionId}`).emit('scoreUpdate', {
            userId: data.userId,
            username: data.username,
            newScore: data.newScore
        });
    });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Add 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});