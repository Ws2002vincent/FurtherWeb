const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Game session page route
    router.get('/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        const userId = req.session.user_id;

        // Verify session exists and user is part of it
        db.query(`
            SELECT ps.*, u.username 
            FROM PlayerSession ps
            JOIN users u ON ps.user_id = u.user_id
            WHERE ps.session_id = ? AND ps.user_id = ?
        `, [sessionId, userId], (err, results) => {
            if (err || results.length === 0) {
                console.error('Session verification error:', err);
                return res.redirect('/dashboard');
            }

            // Render game session page
            res.render('gamesession', {
                sessionId: sessionId,
                userId: userId,
                username: results[0].username,
                score: results[0].score,
                is_host: results[0].is_host === 1  // Add this line
            });
        });
    });

    // Get question details
    router.get('/question/:cardId', (req, res) => {
        const cardId = req.params.cardId;
        
        db.query('SELECT * FROM questioncard WHERE card_id = ?', [cardId], (err, results) => {
            if (err || results.length === 0) {
                return res.json({ success: false, error: 'Question not found' });
            }

            const question = results[0];
            // Don't send correct_option to client
            delete question.correct_option;
            
            res.json({ 
                success: true, 
                question: question 
            });
        });
    });

    // Handle answer submission
    router.post('/answer', (req, res) => {
        const { cardId, sessionId, answer } = req.body;
        const userId = req.session.user_id;

        db.query('SELECT * FROM questioncard WHERE card_id = ?', [cardId], (err, questions) => {
            if (err || questions.length === 0) {
                return res.json({ success: false, error: 'Question not found' });
            }

            const question = questions[0];
            const correct = answer.toUpperCase() === question.correct_option.toUpperCase();
            const scoreChange = correct ? question.marks_given : -50;

            // Update player's score and recalculate positions
            db.query(
                'UPDATE PlayerSession SET score = score + ? WHERE session_id = ? AND user_id = ?',
                [scoreChange, sessionId, userId],
                (err) => {
                    if (err) {
                        console.error('Score update error:', err);
                        return res.json({ success: false, error: 'Database error' });
                    }

                    // Update positions for all players
                    db.query(`
                        UPDATE PlayerSession ps1,
                            (SELECT user_id, 
                                    @curRank := @curRank + 1 AS position
                             FROM PlayerSession,
                                  (SELECT @curRank := 0) r
                             WHERE session_id = ?
                             ORDER BY score DESC) ps2
                        SET ps1.current_position = ps2.position
                        WHERE ps1.session_id = ?
                        AND ps1.user_id = ps2.user_id
                    `, [sessionId, sessionId], (err) => {
                        if (err) {
                            console.error('Position update error:', err);
                            return res.json({ success: false, error: 'Database error' });
                        }

                        // Get updated score and position
                        db.query(
                            'SELECT score, current_position FROM PlayerSession WHERE session_id = ? AND user_id = ?',
                            [sessionId, userId],
                            (err, results) => {
                                if (err) {
                                    console.error('Score fetch error:', err);
                                    return res.json({ success: false, error: 'Database error' });
                                }

                                res.json({
                                    success: true,
                                    correct,
                                    scoreChange,
                                    newScore: results[0].score,
                                    newPosition: results[0].current_position
                                });
                            }
                        );
                    });
                }
            );
        });
    });

    // Add new route for rankings
    router.get('/rankings/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        
        db.query(`
            SELECT ps.current_position, ps.score, u.username 
            FROM PlayerSession ps
            JOIN users u ON ps.user_id = u.user_id
            WHERE ps.session_id = ?
            ORDER BY ps.current_position ASC
        `, [sessionId], (err, rankings) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ rankings });
        });
    });

    // Add this route after existing routes
    router.post('/endgame/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        const userId = req.session.user_id;
        const endTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Verify host
        db.query('SELECT * FROM PlayerSession WHERE session_id = ? AND user_id = ? AND is_host = 1', 
        [sessionId, userId], (err, results) => {
            if (err || results.length === 0) {
                return res.json({ success: false, error: 'Not authorized' });
            }

            // Update game session
            db.query('UPDATE game_session SET status = "completed", end_time = ? WHERE session_id = ?',
            [endTime, sessionId], (err) => {
                if (err) return res.json({ success: false, error: 'Database error' });

                // Get final rankings and insert into game history
                db.query(`
                    INSERT INTO gamehistory (user_id, session_id, score, rank, played_on)
                    SELECT user_id, session_id, score, current_position, ?
                    FROM PlayerSession
                    WHERE session_id = ?
                `, [endTime, sessionId], (err) => {
                    if (err) return res.json({ success: false, error: 'Error saving history' });
                    
                    res.json({ success: true });
                });
            });
        });
    });

    return router;
};