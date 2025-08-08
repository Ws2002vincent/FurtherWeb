module.exports = function(db) {
    var express = require('express');
    var bcrypt = require('bcrypt');
    var router = express.Router();

    router.get('/', function(req, res) { 
        res.render('register'); 
    });

    router.post('/', async function(req, res) { 
        var username = req.body.username; 
        var email = req.body.email; 
        var password = req.body.password;
        var created_at = new Date();

        try {
            const hashed_password = await bcrypt.hash(password, 10); // Hash the password
            const query = 'INSERT INTO users (username, email, hashed_password, created_at) VALUES (?, ?, ?, ?)';
            db.query(query, [username, email, hashed_password, created_at], (err, results) => { 
                if (err) throw err; 
                res.redirect('/login'); 
            });
        } catch (err) {
            res.status(500).send('Error registering user');
        }
    });

    return router;
}