const express = require('express');
const router = express.Router();

module.exports = function(db) {
    router.get('/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        const userId = req.session.user_id;

        db.query(`
            SELECT gh.*, gs.start_time, gs.end_time,
                   (SELECT COUNT(*) FROM gamehistory WHERE session_id = ?) as total_players
            FROM gamehistory gh
            JOIN game_session gs ON gh.session_id = gs.session_id
            WHERE gh.session_id = ? AND gh.user_id = ?
        `, [sessionId, sessionId, userId], (err, results) => {
            if (err || results.length === 0) {
                return res.redirect('/dashboard');
            }

            const result = results[0];
            const duration = Math.floor((new Date(result.end_time) - new Date(result.start_time)) / 60000);

            res.render('calculation', {
                position: result.rank,
                score: result.score,
                duration: `${duration} minutes`,
                totalPlayers: result.total_players
            });
        });
    });

    return router;
};