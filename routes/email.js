module.exports = function(db) { 
    var express = require('express'); 
    var router = express.Router(); 
   
    router.get('/checkEmail', function(req, res) { 
      var email = req.query.email; 

      db.query("SELECT * FROM users WHERE email = ?", [email], function (err, result) { 
        if (err) throw err; 
        var exists = result.length > 0; 
        res.json({ exists: exists }); 
      }); 
    }); 
    
    return router; 
  }