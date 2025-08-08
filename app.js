// Import necessary modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();

// Set up body parser middleware to handle form submissions
app.use(bodyParser.urlencoded({ extended: true }));

// Set up middleware to parse JSON bodies
app.use(bodyParser.json());

// Set up middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

// Server startup script
app.listen(3000, function() {
    console.log('Server is running on http://localhost:3000');
});