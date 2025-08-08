const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Render game room
    router.get('/:sessionId', (req, res) => {
        if (!req.session.loggedin) return res.redirect('/login');
        const sessionId = req.params.sessionId;
        const userId = req.session.user_id;

        // Get game session info
        db.query('SELECT * FROM game_session WHERE session_id = ?', [sessionId], (err, sessions) => {
            if (err || sessions.length === 0) return res.status(404).send('Room not found');
            const session = sessions[0];
            const isHost = userId === session.host_id;

            // Add player to room if not present
            db.query('SELECT * FROM PlayerSession WHERE session_id = ? AND user_id = ?', [sessionId, userId], (err, players) => {
                if (err) return res.status(500).send('Database error');
                if (players.length === 0) {
                    db.query('INSERT INTO PlayerSession (session_id, user_id, is_host, is_ready) VALUES (?, ?, ?, 0)', [sessionId, userId, isHost ? 1 : 0], (err) => {
                        if (err) return res.status(500).send('Database error');
                        renderRoom();
                    });
                } else {
                    renderRoom();
                }

                function renderRoom() {
                    res.render('gameroom', {
                        room_name: session.game_name,
                        join_code: session.join_code,
                        session_id: sessionId,
                        user_id: userId,
                        is_host: isHost
                    });
                }
            });
        });
    });

    // Get player list (AJAX)
    router.get('/players/:sessionId', (req, res) => {
        db.query(
            'SELECT u.username, ps.is_host, ps.is_ready FROM PlayerSession ps JOIN users u ON ps.user_id = u.user_id WHERE ps.session_id = ? ORDER BY ps.is_host DESC, ps.user_id',
            [req.params.sessionId],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ players: results });
            }
        );
    });

    // Player ready
    router.post('/ready', (req, res) => {
        const { session_id } = req.body;
        const userId = req.session.user_id;
        db.query('UPDATE PlayerSession SET is_ready = 1 WHERE session_id = ? AND user_id = ?', [session_id, userId], (err) => {
            res.json({ success: !err });
        });
    });

    // Host start game
    router.post('/start', (req, res) => {
        const { session_id } = req.body;
        const userId = req.session.user_id;

        db.query('SELECT * FROM PlayerSession WHERE session_id = ?', [session_id], (err, players) => {
            if (err) return res.status(500).json({ success: false, error: 'Database error' });

            const host = players.find(p => p.is_host === 1);
            if (!host || host.user_id !== userId) {
                return res.status(403).json({ success: false, error: 'Only host can start the game' });
            }

            const allReady = players
                .filter(p => p.is_host !== 1)
                .every(p => p.is_ready === 1);

            if (allReady) {
                // Update game status
                db.query('UPDATE game_session SET status = "active" WHERE session_id = ?', [session_id], (err) => {
                    if (err) return res.status(500).json({ success: false, error: 'Database error' });
                    
                    // Return success with the correct path
                    res.json({ 
                        success: true, 
                        redirect: `/gamesession/${session_id}`  // Make sure this matches your route
                    });
                });
            } else {
                res.json({ success: false, error: 'Not all players are ready' });
            }
        });
    });

    // Poll game status
    router.get('/status/:sessionId', (req, res) => {
        db.query('SELECT status FROM game_session WHERE session_id = ?', [req.params.sessionId], (err, results) => {
            res.json({ status: results[0]?.status || 'error' });
        });
    });

    return router;
};