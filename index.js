var restify = require('restify');

// Controllers
var CONTROLLERS_PATH = './controllers'
var notes = require(CONTROLLERS_PATH + '/notes');

var server = restify.createServer({
    name: 'notes'
});

server.listen(8000, function () {
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

var ROOT_PATH = '/api';

server.get('/', function(req, res){
    res.send('Ok');
});

server.get(ROOT_PATH+'/version', function(req, res, next){
    res.send(200, {'STATUS_KEY' : 'Success', 'DATA': 0.1});
});

var NOTE_PATH = '/note';
server.post(ROOT_PATH + NOTE_PATH, notes.createNote);
server.get(ROOT_PATH + NOTE_PATH + 's', notes.getNotes);
