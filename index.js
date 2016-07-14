var express = require('express');
var app = express();
var http = require('http').Server(app);
var redis = require('redis');
var path = require('path')
var redisClient = redis.createClient();
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(path.join(__dirname, 'public')));

var messages = [];

// Function to push the top 10 message to messages list
var storeMessage = function(name, data) {
	
	// Convert thr object to string
	var message = JSON.stringify({name: name, data: data});

    // Push the each to messages using lpush
	redisClient.lpush("messages", message, function(err, response){
		//Trim the messages list to top 10 message
		redisClient.ltrim("messages",0,9);
	});
}

// listening to io connection event.
io.on('connection', function(socket){
	// listening to chat message event on the active socket.
  socket.on('chat message', function(msg){
  	var nickname = socket.nickname;
    io.emit('chat message', nickname + ":" + msg);
    storeMessage(nickname,msg);
  });

  // listening to join event on the active socket, this is triggered when any new user enter the chat app.
  socket.on('join', function(name){

  	// Add a new chatter to the chatters set
  	redisClient.sadd("chatters", name);  	

    // Emit add chatter event for all the persons in the names set using set members
   	redisClient.smembers('chatters', function(err, names){
  		names.forEach(function(name){
  			socket.emit('add chatter', name);
  		});
  	});  	

   	socket.broadcast.emit('add chatter', name);

  	socket.nickname = name;

  	//Emit chat message event for all the top 10 message using lrange(list range) to get all message.
  	redisClient.lrange("messages", 0, -1, function(err, messages){
  		messages = messages.reverse();
  		messages.forEach(function(message){
  			message = JSON.parse(message);
  			io.emit("chat message", message.name + ":" + message.data);
  		});  		
  	});

  	// listening to disconnect event on the active socket.
  	
  	socket.on('disconnect', function(name){
  		io.emit("remove chatter", socket.nickname);
  		//When the socket gets disconnected remove the chatter from the chatters list
  		redisClient.srem("chatters", socket.nickname);
  	});

  });
});

http.listen(3004, function(){
  console.log('listening on *:3004');
});
