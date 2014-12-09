/*
// ==================================================
                  Notes Server            
// ==================================================
*/

// ================ Dependencies ==================
var restify = require('restify');
// ================================================

// ================ Controllers ===================
var CONTROLLERS_PATH = './controllers'
var notes = require(CONTROLLERS_PATH + '/notes');
// ================================================

// ================ Server set-up ==================
var server = restify.createServer({
    name: 'notes'
});

server.listen(80, function () {
  console.log('%s listening at %s', server.name, server.url);
});

server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
    next();
});

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.throttle({
  burst: 50,
  rate: 20,
  ip: true
}));
// ================================================

/*
    |=================|
    |    Endpoints    |
    |=================|
*/

// Set default API path.
var ROOT_PATH = '/api';

// Tests server status.
server.get('/', function(req, res){
    res.send('Ok');
});

// Get current API version.
server.get(ROOT_PATH+'/version', function(req, res, next){
    res.send(200, {'STATUS_KEY' : 'Success', 'DATA': 0.1});
});

// Set notes path.
var NOTE_PATH = '/note';

/**
  * Attempts to create note.
  * @param {Object} email
  * @param {Object} body
  * @param {Object} tag
  * @param {Object} bucket
**/
server.post(ROOT_PATH + NOTE_PATH, notes.createNote);

/**
  * Attempts to get all notes for user.
**/
server.get(ROOT_PATH + NOTE_PATH + 's', notes.getNotes);

/**
  * Attempts to get note by id.
  * @param {Object} id
**/
server.get(ROOT_PATH + NOTE_PATH, notes.getNote);

/**
  * Attempts to delete note by id.
  * @param {Object} id
**/
server.del(ROOT_PATH + NOTE_PATH, notes.deleteNote);

