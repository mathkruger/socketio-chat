var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

connections = [];
users = {};
rooms = {};

app.use(express.static('public'));

io.on('connection', function (socket) {
	connections.push(socket);
	writeNewConnection('c');

	socket.on('new user', function (data, callback) {
		data.salaId = data.salaId ? data.salaId : makeid(6);
		
		if(getRoom(data.salaId)) {
			var room = getRoom(data.salaId);
		}
		else {
			var room = { salaId: data.salaId, salaSenha: data.salaSenha, messages: [] };
			rooms[data.salaId] = room;
		}

		if(room.salaSenha != null && room.salaSenha != data.salaSenha) {
			callback(false, "Senha da sala incorreta!");
		}
		else {
			socket.username = data.username;
			socket.cor = data.cor;
			socket.salaId = data.salaId;

			users[socket.id] = { username: socket.username, cor: socket.cor, salaId: data.salaId };
			
			socket.join(socket.salaId);
			io.to(socket.salaId).emit('logou', socket.username);
			
			updateUsernames();
			callback(true, socket.salaId, room.messages);
		}
	});

	socket.on('disconnect', function (data) {
		delete users[socket.id];

		if(getUserFromRoom(socket.salaId).length == 0) {
			delete rooms[socket.salaId];
		}

		connections.splice(connections.indexOf(socket), 1);

		io.to(socket.salaId).emit('saiu', socket.username);

		updateUsernames();
		writeNewConnection('d');
	});

	socket.on('send message', function (data) {
		sendMessage(null, data)
	});

	socket.on('radio', function (blob) {
		sendMessage('audio', blob);
	});

	socket.on('image', function (blob) {
		sendMessage('img', blob);
	});

	function sendMessage(tipo = null, conteudo) {
		var aux = { username: socket.username, cor: socket.cor, tipo: tipo };

		if(tipo == null) {
			aux.message = conteudo;
		}
		else {
			aux.blob = conteudo;
		}

		rooms[socket.salaId].messages.push(aux);
		io.to(socket.salaId).emit('new message', aux);
	}

	function updateUsernames() {
		io.to(socket.salaId).emit('get users', getUserFromRoom(socket.salaId));
	};

	function getUserFromRoom(salaId) {
		var usersDaSala = [];

		Object.keys(users).forEach(id => {
			if(users[id].salaId == salaId) {
				usersDaSala.push(users[id]);
			}
		});

		return usersDaSala;
	}

	function getRoom(salaId) {
		return rooms[salaId];
	}

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
