const express = require('express');
const router = express.Router();

module.exports = function(db) {
    router.get('/', (req, res) => {
        const userId = req.session.user_id;

        // Join query to get game history with game names
        db.query(`
            SELECT gh.*, gs.game_name 
            FROM gamehistory gh
            JOIN game_session gs ON gh.session_id = gs.session_id
            WHERE gh.user_id = ?
            ORDER BY gh.played_on DESC
        `, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }

            // Render the game history page
            res.render('gamehistory', {
                username: req.session.username,
                gameHistory: results
            });
        });
    });

    return router;
};