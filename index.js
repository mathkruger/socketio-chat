var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

connections = [];
users = {};

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/notification.mp3', function (req, res) {
	res.sendFile(__dirname + '/public/notification.mp3');
});

app.get('/soundmanager2.js', function (req, res) {
	res.sendFile(__dirname + '/public/soundmanager2.js');
});

app.get('/soundmanager2_debug.swf', function (req, res) {
	res.sendFile(__dirname + '/public/soundmanager2_debug.swf');
});

app.get('/soundmanager2.swf', function (req, res) {
	res.sendFile(__dirname + '/public/soundmanager2.swf');
});

io.on('connection', function (socket) {
	connections.push(socket);
	writeNewConnection('c');

	socket.on('disconnect', function (data) {
		delete users[socket.id];
		connections.splice(connections.indexOf(socket), 1);

		io.to(socket.salaId).emit('saiu', socket.username);

		updateUsernames();
		writeNewConnection('d');
	});

	socket.on('send message', function (data) {
		io.to(socket.salaId).emit('new message', { message: data, username: socket.username, cor: socket.cor });
	});

	socket.on('new user', function (data, callback) {
		data.salaId = data.salaId ? data.salaId : makeid(6);

		socket.username = data.username;
		socket.cor = data.cor;
		socket.salaId = data.salaId;

		users[socket.id] = { username: socket.username, cor: socket.cor, salaId: data.salaId };
		
		socket.join(socket.salaId);
		io.to(socket.salaId).emit('logou', socket.username);
		
		updateUsernames();
		callback(true, socket.salaId);
	});

	socket.on('radio', function (blob) {
		io.to(socket.salaId).emit('new message', { username: socket.username, cor: socket.cor, blob: blob, tipo: 'audio' });
	});

	socket.on('image', function (blob) {
		io.to(socket.salaId).emit('new message', { username: socket.username, cor: socket.cor, blob: blob, tipo: 'img' });
	});

	function updateUsernames() {
		var usersDaSala = [];

		Object.keys(users).forEach(id => {
			if(users[id].salaId == socket.salaId) {
				usersDaSala.push(users[id]);
			}
		});

		io.to(socket.salaId).emit('get users', usersDaSala);
	};

	function writeNewConnection(estado) {
		var stringEstado = '';

		if (estado == 'c')
			stringEstado = "Conectado:";
		else
			stringEstado = "Desconectado:";


		if (connections.length === 1)
			console.log('' + stringEstado, connections.length, 'socket.');
		else
			console.log('' + stringEstado, connections.length, 'sockets.');
	}
});

function makeid(length = 4) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

http.listen(1232, function () {
	console.log('Chat: rodando na porta 3000...');
	console.log('acesse http://localhost:3000');
});
