module.exports = function(db) { 
    var express = require('express'); 
    var router = express.Router(); 
   
    router.post('/', function(req, res) { 
        var email = req.body.email; 
        db.query("SELECT * FROM users WHERE email = ?", [email], function (err, result) { 
            if (err) {
                console.error('Database error:', err);
                return res.json({ available: false, error: 'Database error' });
            }
            res.json({ available: result.length === 0 }); 
        }); 
    }); 
    return router; 
}