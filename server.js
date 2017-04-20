var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

connections = [];
users = [];

app.get('/', function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	connections.push(socket);

	if(connections.length === 1)
		console.log('Conectado:',connections.length,'socket.');
	else
		console.log('Conectado:',connections.length,'sockets.');

	socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.username),1);
		updateUsernames();

		connections.splice(connections.indexOf(socket),1);

		if(connections.length === 1)
			console.log('Desconectado:',connections.length,'socket.');
		else
			console.log('Desconectado:',connections.length,'sockets.');
	});

	socket.on('send message', function(data) {
		io.emit('new message', {message: data, username: socket.username});
	})

	socket.on('new user', function(data, callback) {
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
	})

	function updateUsernames(){
		io.emit('get users', users);
	};

});

http.listen(3000, function() {
	console.log('Chat: Rodando...');
});