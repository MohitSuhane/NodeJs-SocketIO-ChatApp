var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
  	var nickname = socket.nickname;
    io.emit('chat message', nickname + ":" + msg);
  });
  socket.on('join', function(name){
  	socket.nickname = name;
  })
});

http.listen(3004, function(){
  console.log('listening on *:3004');
});
