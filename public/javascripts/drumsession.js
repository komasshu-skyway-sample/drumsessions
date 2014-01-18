var socket = io.connect();
var myid;
var peer;
var connected_peers = {};
var offered_peers = {};
var buffers = {}, datas = {};

if(typeof(webkitAudioContext)!=="undefined")
  var audioctx = new webkitAudioContext();
else if(typeof(AudioContext)!=="undefined")
  var audioctx = new AudioContext();

// disable sctp
util.supports.sctp = false;
$("#console").text(util.supports.sctp);

// check and return unconnected ids in Array format.
var getUnconnected = function(ids){
  var ret = [];

  ids.forEach(function(id) {
    if(id !== myid && !!connected_peers[id] === false) {
      ret.push(id);
    }
  });
  return ret;
}

socket.on('connect', function() {
  myid = socket.socket.sessionid;
  $("#myid").append(myid + "<br>");

  peer = new Peer(myid, {
    key: 'peerjs', 
    host: location.hostname,
    port: 9000
  });

  peer.on('open', function(){

    peer.on('connection', function(conn) {
      offered_peers[conn.peer] = conn;
      conn.on('data', function(data){
        $("#console").text(data);
        if(data === "snare" || data === "cymbal" || data === "kick") {
          $(".drum[name="+data+"]").hide().fadeIn();

          play(data);
        }
      });
    });

  });
});

socket.on('connectedids', function(ids){
  $("#connectedids").empty();
  ids.forEach(function(id){
    $("<ul>").text(id).appendTo("#connectedids");
  });

  var unconnected = getUnconnected(ids);

  var connectPeers_ = function(ids_){
    if(peer.open) {
      ids_.forEach(function(id) {
        var conn = peer.connect(id, {serialization: "binary-utf8"});
        connected_peers[id] = conn;

        conn.on('open', function(){
          conn.send('hello myid = '+myid);
        });
      });
    } else {
      setTimeout(function(){
        connectPeers_(ids_);
      }, 300)
    }
  }
  connectPeers_(unconnected);
});

if(navigator.userAgent.search(/Android/) !== -1) {
  var cl = 'touchstart';
} else {
  var cl = 'click';
}
$("#hit .drum").on(cl, function(ev){
  var name = $(this).attr("name");

  play(name);
  for(var connid in connected_peers) {
    if(connid !== myid) {
      connected_peers[connid].send(name);
    }
  }
});

socket.on('disconnect', function(id) {
  delete connected_peers[id]
  delete offered_peers[id]
});

///////////////////////////////////////////////////
// item should be 'snare', 'cymbal', 'kick'
function LoadSample(ctx, item) {
  console.log(item);
  var req = new XMLHttpRequest();
  req.open("GET", "/audio/"+item+".mp3", true);
  req.responseType = "arraybuffer";
  req.onload = function() {
    if(req.response) {
      ctx.decodeAudioData(req.response, function(b){
        buffers[item] = b;
        datas[item] = b.getChannelData(0);
      }, function(){});
    } else {
      buffers[item] = ctx.createBuffer(VBArray(req.responseBody).toArray(), false);
    }
    $(window).trigger('audioloaded', {'item': item});
  }
  req.send();
}

var items = ['snare', 'cymbal', 'kick', 'entertainer'];
items.forEach(function(item){
  LoadSample(audioctx, item);
});

$(window).on('audioloaded', function(ev, item) {
  console.log(item);
  $("#items").append(item.item+" ");
});

function play(item) {
  var gain = audioctx.createGain();
  var src = audioctx.createBufferSource();

  if(!!buffers[item]) {
    src.buffer = buffers[item];

    src.connect(gain);
    gain.connect(audioctx.destination);
    gain.gain.value =10 
    src.start(0);
  }
}

$("#play").on("click", function() { play('entertainer'); });
