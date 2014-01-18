
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
var path = require('path');
var PeerServer = require('peer').PeerServer;
var peer_server = new PeerServer({ port: 9000, key: 'peerjs'});


// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var keys = function(Obj){
  var ret = [];
  if(!!Obj && typeof(Obj) === "object") {
    for(var key in Obj) if(Obj.hasOwnProperty(key)) {
      ret.push(key);
    }
  } 
  return ret;
}

var getConnectedIDs = function(){
  if(!!io && !!io.sockets && !!io.sockets.sockets) {
    return keys(io.sockets.sockets);
  } else {
    return null;
  }
}

var notify = function(){
  var ids = getConnectedIDs();
  io.sockets.emit('connectedids', ids);
}

io.sockets.on('connection', function(socket) {
  console.log('connect - ', socket.id);
  notify();

  socket.on('disconnect', function() {
    console.log('disconnect - ', socket.id);
    io.sockets.emit('disconnect', socket.id);
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
