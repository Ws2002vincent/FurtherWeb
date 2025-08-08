const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Get player list for a game session
    router.get('/players/:sessionId', (req, res) => {
        const query = `
            SELECT u.username, ps.is_host, ps.is_ready 
            FROM PlayerSession ps
            JOIN users u ON ps.user_id = u.user_id
            WHERE ps.session_id = ?
            GROUP BY ps.user_id
        `;
        
        db.query(query, [req.params.sessionId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ players: results });
        });
    });

    // Mark player as ready
    router.post('/ready', (req, res) => {
        const { session_id, user_id } = req.body;
        const query = 'UPDATE PlayerSession SET is_ready = true WHERE session_id = ? AND user_id = ?';
        
        db.query(query, [session_id, user_id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        });
    });

    // Start the game
    router.post('/start', (req, res) => {
        const { session_id } = req.body;
        const query = `
            INSERT INTO PlayerSession (session_id, user_id, current_position, score, is_host, has_finished)
            SELECT 
                gs.session_id,
                ps.user_id,
                1 as current_position,
                0 as score,
                ps.is_host,
                false as has_finished
            FROM game_session gs
            JOIN PlayerSession ps ON ps.session_id = gs.session_id
            WHERE gs.session_id = ?
        `;

        db.query(query, [session_id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        });
    });

    // Add leave room handler
    router.post('/leave', (req, res) => {
        const { session_id, user_id } = req.body;
        const query = 'DELETE FROM PlayerSession WHERE session_id = ? AND user_id = ?';
        
        db.query(query, [session_id, user_id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        });
    });

    // Modify existing room entry route
    router.get('/:sessionId', async (req, res) => {
        if (!req.session.loggedin) {
            return res.redirect('/login');
        }

        const sessionId = req.params.sessionId;
        
        // First, clean up any existing entries for this user in this room
        const cleanupQuery = 'DELETE FROM PlayerSession WHERE session_id = ? AND user_id = ?';
        db.query(cleanupQuery, [sessionId, req.session.user_id], (err) => {
            if (err) {
                console.error('Cleanup error:', err);
                return res.status(500).send('Database error');
            }

            // Then proceed with room entry
            const query = `
                SELECT gs.*, u.username as host_name,
                       (SELECT COUNT(DISTINCT user_id) FROM PlayerSession WHERE session_id = ?) as current_players
                FROM game_session gs
                JOIN users u ON gs.host_id = u.user_id
                WHERE gs.session_id = ?
            `;

            db.query(query, [sessionId, sessionId], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Database error');
                }

                if (results.length === 0) {
                    return res.status(404).send('Game room not found');
                }

                const gameSession = results[0];
                
                // Insert new player session
                const playerInsertQuery = `
                    INSERT INTO PlayerSession 
                    (session_id, user_id, is_host) 
                    VALUES (?, ?, ?)
                `;
                
                db.query(playerInsertQuery, [
                    sessionId, 
                    req.session.user_id, 
                    req.session.user_id === gameSession.host_id
                ], (err) => {
                    if (err) {
                        console.error('Error adding player to session:', err);
                        return res.status(500).send('Database error');
                    }

                    res.render('gameroom', {
                        game_name: gameSession.game_name,
                        join_code: gameSession.join_code,
                        session_id: sessionId,
                        user_id: req.session.user_id,
                        is_host: req.session.user_id === gameSession.host_id,
                        current_players: gameSession.current_players
                    });
                });
            });
        });
    });

    return router;
};