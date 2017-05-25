require('rootpath')();
var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use JWT auth to secure the api
app.use(expressJwt({ secret: config.secret }).unless({path: [{ url: '/users', methods: ['GET']}, '/users/authenticate', '/users/register'] }));

// routes
app.use('/users', require('./controllers/users.controller'));

// start server

var port =  process.env.PORT || 4000;
var server = app.listen(port, function() {
  console.log('Server is listening on port ' + port);
})