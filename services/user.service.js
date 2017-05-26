var User = require('../models/User');
var bcrypt = require('bcryptjs');
var service = {};

service.authenticate = authenticate;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();
    
    db.users.findOne({username: username}, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (user && bcrypt.compareSync(password, user.hash)) {
           //authentication successful
           deferred.resolve({
              _id: user._id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              token: jwt.sign({sub: user._id}, config.secret)
           });
        } else {
            //authentication failed
            deferred.resolve();
        }
    });
    return deferred.promise;
}


function getAll() {
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users);
    });
}

function getById(_id) {
    var deferred = Q.defer();
    
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        
        if (user) {
            //return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            //user not found
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function create(userParam) {
    
   User.findOne(
    {username: userParam.username},
    function (err, user) {
        if (err) throw err;
        
        if (user) {
            //username already exists
            throw new Error('Username "' + userParam.username + '" is already taken');
        } else {
            createUser();
        }
    });
    
    function createUser() {
         User.create({
            _id: userParam._id,
            username: userParam.username,
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            hash: bcrypt.hashSync(userParam.password, 10)
        }, function (err, user) {
            if(err) throw new Error(err.name + ": " + err.message);
            return user;
        })
        
    }
}

function update(_id, userParam) {
    var deferred = Q.defer();
    
    //validation
    db.users.findById(_id, function(err, user) {
       if (err) deferred.reject(err.name + ': ' + err.message);
       
       if (user.username !== userParam.username) {
           //username has changed so check if the new username is already taken
           db.users.findOne(
               { username: userParam.username },
               function (err, user) {
                  if (err) deferred.reject(err.name + ': ' + err.message);
                  
                  if (user) {
                      // username already exists
                      deferred.reject('Username "' + req.body.username + '" is already taken');
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
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username
        };
        
        //update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            {$set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                
                deferred.resolve();
            });
    }
    
    return deferred.promise;
}

function _delete(_id) {
    User.findByIdAndRemove(_id, function (err, user) {
        if (err) throw err;
        return user;
    })
}