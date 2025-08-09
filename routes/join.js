const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Render join room form
    router.get('/', (req, res) => {
        if (!req.session.loggedin) {
            return res.redirect('/login');
        }
        res.render('joinroom', { error: null });
    });

    // Handle join room request
    router.post('/', async (req, res) => {
        if (!req.session.loggedin) {
            return res.redirect('/login');
        }

        const { join_code } = req.body;

        // Check if game session exists and is joinable
        const query = `
            SELECT gs.*, 
                   (SELECT COUNT(*) FROM PlayerSession WHERE session_id = gs.session_id) as player_count
            FROM game_session gs 
            WHERE gs.join_code = ? AND gs.status = 'incomplete'
        `;

        db.query(query, [join_code], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('joinroom', { error: 'Database error occurred' });
            }

            if (results.length === 0) {
                return res.render('joinroom', { error: 'Invalid room code or room is no longer available' });
            }

            const gameSession = results[0];

            if (gameSession.player_count >= 4) {
                return res.render('joinroom', { error: 'Room is full' });
            }

            // Check if player is already in the room
            const checkPlayerQuery = `
                SELECT * FROM PlayerSession 
                WHERE session_id = ? AND user_id = ?
            `;

            // Check if the player is already in the room
            db.query(checkPlayerQuery, [gameSession.session_id, req.session.user_id], (err, playerResults) => {
                if (err) {
                    return res.render('joinroom', { error: 'Database error occurred' });
                }

                if (playerResults.length > 0) {
                    // Player is already in the room, just redirect them
                    return res.redirect(`/gameroom/${gameSession.session_id}`);
                }

                // Add player to the room
                const addPlayerQuery = `
                    INSERT INTO PlayerSession (session_id, user_id, is_host, is_ready)
                    VALUES (?, ?, false, false)
                `;

                // Add player to the room
                db.query(addPlayerQuery, [gameSession.session_id, req.session.user_id], (err) => {
                    if (err) {
                        return res.render('joinroom', { error: 'Failed to join room' });
                    }

                    res.redirect(`/gameroom/${gameSession.session_id}`);
                });
            });
        });
    });

    return router;
};