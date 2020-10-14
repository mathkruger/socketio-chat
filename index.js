var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

connections = [];
users = [];
cores = [];

app.get('/', function(req,res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/notification.mp3', function(req,res) {
	res.sendFile(__dirname + '/public/notification.mp3');
});

app.get('/soundmanager2.js', function(req,res) {
	res.sendFile(__dirname + '/public/soundmanager2.js');
});

app.get('/soundmanager2_debug.swf', function(req,res) {
	res.sendFile(__dirname + '/public/soundmanager2_debug.swf');
});

app.get('/soundmanager2.swf', function(req,res) {
	res.sendFile(__dirname + '/public/soundmanager2.swf');
});

io.on('connection', function(socket) {
	connections.push(socket);
	writeNewConnection('c');
	
	socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.username),1);
		cores.splice(cores.indexOf(socket.cor),1);
		updateUsernames();
		io.emit('saiu', socket.username);

		connections.splice(connections.indexOf(socket),1);

		writeNewConnection('d');
	});

	socket.on('send message', function(data) {
		io.emit('new message', {message: data, username: socket.username, cor: socket.cor});
	});

	socket.on('new user', function(data, callback) {
		callback(true);

		socket.username = data.username;
		socket.cor = data.cor;
		users.push(socket.username);
		cores.push(socket.cor);

		io.emit('logou', socket.username);

		updateUsernames();
	});

	function updateUsernames(){
		io.emit('get users', {username: users, cor: cores});
	};

	function writeNewConnection(estado){
		var stringEstado = '';

		if(estado == 'c')
			stringEstado = "Conectado:";
		else
			stringEstado = "Desconectado:";


		if(connections.length === 1)
			console.log(''+stringEstado,connections.length,'socket.');
		else
			console.log(''+stringEstado,connections.length,'sockets.');
	}

});

http.listen(3000, function() {
	console.log('Chat: rodando na porta 3000...');
	console.log('acesse http://localhost:3000');
});
