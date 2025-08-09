const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Function to generate random join code
function generateJoinCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = Math.floor(Math.random() * (10 - 5 + 1)) + 5; // Random length between 5-10
    let code = '';
    
    // Generate a random code of specified length
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = crypto.randomInt(0, characters.length);
        code += characters[randomIndex];
    }
    return code;
}

module.exports = function(db) {
    // Render host game form
    router.get('/', (req, res) => {
        if (!req.session.loggedin) {
            return res.redirect('/login');
        }
        res.render('host');
    });

    // Handle game session creation
    router.post('/', async (req, res) => {
        if (!req.session.loggedin) {
            return res.redirect('/login');
        }

        const { game_name } = req.body;
        const host_id = req.session.user_id;
        const status = 'incomplete';
        const join_code = generateJoinCode();
        const start_time = new Date();

        const query = `
            INSERT INTO game_session 
            (host_id, game_name, status, join_code, start_time) 
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            db.query(query, [host_id, game_name, status, join_code, start_time], (err, result) => {
                if (err) {
                    console.error('Error creating game session:', err);
                    return res.status(500).json({ error: 'Failed to create game session' });
                }

                res.redirect(`/gameroom/${result.insertId}`);
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};