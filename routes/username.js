module.exports = function(db) { 
    var express = require('express'); 
    var router = express.Router(); 

    router.get('/checkUsername', function(req, res) { 
        var username = req.query.username; 
        db.query("SELECT * FROM users WHERE username = ?", [username], function (err, result) { 
            if (err) throw err; 
            var exists = result.length > 0; 
            res.json({ exists: exists }); 
        }); 
    }); 
    return router; 
}