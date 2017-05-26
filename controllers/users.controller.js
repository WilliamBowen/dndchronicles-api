var config = require('../config.json');
var express = require("express");
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false }));
var mongoose = require('mongoose');
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get("/:id", getOne);
router.get('/current', getCurrent);
router.put('/:id', update);
router.delete('/:id', _delete);

var User = require('../models/User');

module.exports = router;

function authenticate(req, res) {
    User.findOne({username: req.body.username}, function(err, user) {
        if (err) return res.status(500).send(err.name + ': ' + err.message);
        if (user && bcrypt.compareSync(req.body.password, user.hash)) {
           //authentication successful
           res.status(200).send({
              _id: user._id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              token: jwt.sign({sub: user._id}, config.secret)
           });
        } else {
            //authentication failed
            res.status(401).send('Username or password is incorrect');
        }
    });
}

function register(req, res) {
     User.findOne(
        {username: req.body.username },
        function (err, user) {
            if (err) return res.status(400).send(err);
            
            if (user) {
                //username already exists
                return res.status(400).send('Username "' + req.body.username + '" is already taken');
            } else {
                createUser();
            }
        }
    );
    
    function createUser() {
         User.create({
            _id: req.body._id,
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            hash: bcrypt.hashSync(req.body.password, 10)
        }, function (err, user) {
            if(err) return res.status(400).send(err.name + ": " + err.message);
            res.status(200).send(user);
        });
    }
}

function getAll(req, res) {
    User.find({}, function (err, users) {
        if(err) return res.status(500).send(err.name + ": " + err.message);
        res.status(200).send(users); 
    });
}

function getOne(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err) return res.status(500).send(err.name+ ": " + err.message);
        res.status(200).send(user);
    });
}

function getCurrent(req, res) {
   User.findById(req.user.sub, function(err, user) {
        if(err) return res.status(500).send(err.name+ ": " + err.message);
        if(user) {
            res.status(200).send(user);
        } else {
            res.senStatus(404);
        }
    });
}

function update(req, res) {
    
    //validation
    User.findById(req.params.id, function(err, user) {
       if (err) return res.status(400).send(err.name + ': ' + err.message);
       
       if (user.username !== req.body.username) {
           //username has changed so check if the new username is already taken
          User.findOne(
               { username: req.body.username },
               function (err, user) {
                  if (err) return res.status(400).send(err.name + ': ' + err.message);
                  
                  if (user) {
                      // username already exists
                      return res.status(400).send('Username "' + req.body.username + '" is already taken');
                  } else {
                      updateUser();
                  }
               });
       } else {
           updateUser();
       }
    });
    
    function updateUser() {
        //fields to update
        var set = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username
        };
        
        //update password if it was entered
        if (req.body.password) {
            set.hash = bcrypt.hashSync(req.body.password, 10);
        }
        User.findByIdAndUpdate(
            req.params.id,
            {$set: set },
            function (err, doc) {
                if (err) return res.status(400).send(err.name + ': ' + err.message);
            });
        res.status(200).send();
    }
}

function _delete(req, res) {
    User.findByIdAndRemove(req.params.id, function(err, user) {
      if (err) return res.status(500).send(err.name + ": " + err.message);
      console.log(user);
      res.status(200).send("User was deleted");
     
    });
}