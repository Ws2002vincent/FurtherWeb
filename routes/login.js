const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {
    router.get('/', (req, res) => {
        const error = req.session.error;
        req.session.error = null;
        res.render('login', { error });
    });

    router.post('/', (req, res) => { 
        const { username, password } = req.body;

        // Check if username and password are provided
        if (username && password) {
            db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
                if (error) return res.status(500).send('Database error');

                if (results.length > 0) {
                    const user = results[0];
                    bcrypt.compare(password, user.hashed_password, (err, match) => {
                        if (err) return res.status(500).send('Error comparing passwords');
                        
                        if (match) {
                            req.session.loggedin = true;
                            req.session.username = username;
                            req.session.user_id = user.user_id;
                            req.session.user_name = user.username;
                            return res.redirect('dashboard'); 
                        } else {
                            return res.render('login', { error: 'Incorrect Username and/or Password!' });
                        }
                    });
                } else {
                    return res.render('login', { error: 'Incorrect Username and/or Password!' });
                }
            });
        } else {
            return res.render('login', { error: 'Please enter Username and Password!' });
        }
    });

    return router;
}