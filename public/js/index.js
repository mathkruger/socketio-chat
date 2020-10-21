document.addEventListener("DOMContentLoaded", function (event) {
    Notification.requestPermission();
    var socket = io.connect();

    var $messageArea = document.querySelector('#messageArea');
    var $chat = document.querySelector('#chat');
    var $messageForm = document.querySelector('#messageForm');
    var $message = document.querySelector('#message');
    var $userArea = document.querySelector('#userArea');
    var $userForm = document.querySelector('#userForm');

    var $username = document.querySelector('#username');
    var $salaId = document.querySelector('#salaId');
    var $salaSenha = document.querySelector('#salaSenha');
    var $corUsuario = document.querySelector('#corUsuario');

    var $users = document.querySelector('#users');
    var $imageBox = document.querySelector('#fotoInput');

    var $notificacoes = document.querySelector("#notificacoes");
    var $som = document.querySelector("#som");

    var $som_notificacao = document.querySelector("#som_notificacao");

    $notificacoes.checked = window.localStorage.getItem('config_notify') == 'true' ? true : false;
    $som.checked = window.localStorage.getItem('config_sound') == 'true' ? true : false;

    var usernameGlobal;
    var hashSala = window.location.hash.replace('#', '');

    $salaId.value = hashSala;

    configuracaoGravacaoDeAudio()

    function urlify(text) {
        var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return text.replace(urlRegex, function (url, b, c) {
            var url2 = (c == 'www.') ? 'http://' + url : url;
            return '<a href="' + url2 + '" target="_blank">' + url + '</a>';
        });
    };

    function printMessage(data, som = true) {
        if (data.blob == null) {
            var message = urlify(data.message);

            if (message.indexOf('[ASCII]') > -1) {
                message = message.replace('[ASCII]', '');
                message = '<pre>' + message + '</pre>';
            }

            $chat.innerHTML += "<li tabindex='1' class='list-group-item list-group-item-default'><span class='text-" + data.cor + "'><strong>" + data.username + '</strong>: ' + message + '</span></li>';
        }
        else {
            if (data.tipo == 'audio') {
                var blob = new Blob([data.blob], { 'type': 'audio/ogg; codecs=opus' });
                var tag = document.createElement('audio');
                tag.src = window.URL.createObjectURL(blob);
                tag.controls = "controls";
            }
            else {
                if (data.tipo == 'img') {
                    var tag = document.createElement('img');
                    tag.src = data.blob;
                    tag.classList.add('img-responsive');
                }
            }

            var message = tag.outerHTML;

            $chat.innerHTML += "<li tabindex='1' class='list-group-item list-group-item-default'><span class='text-" + data.cor + "'><strong>" + data.username + '</strong>: ' + message + '</span></li>';
        }

        if (data.username != usernameGlobal && som) {
            if ($som.checked == true) {
                $som_notificacao.play();
            }

            console.log($notificacoes.checked)
            if ($notificacoes.checked == true) {
                spawnNotification(data.username + ': ' + (data.blob ? (data.tipo == 'audio' ? 'Gravou um áudio' : 'Enviou uma imagem') : data.message), data.blob, 'Chat da Massa - Sala ' + hashSala);
            }
        }

        focarUltimaMensagem();
    }

    function spawnNotification(corpo, icone, titulo) {
        Notification.requestPermission();

        var opcoes = {
            body: corpo,
            icon: icone
        }

        var n = new Notification(titulo, opcoes);
        n.onclick = function () {
            window.focus();
        }
    }

    function focarUltimaMensagem() {
        $chat.scrollTo(0, $chat.scrollHeight);
        $message.focus = true;
    }

    function configuracaoGravacaoDeAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (mediaStream) {
            var mediaRecorder = new MediaRecorder(mediaStream);

            mediaRecorder.onstart = function (e) {
                this.chunks = [];
            };

            mediaRecorder.ondataavailable = function (e) {
                this.chunks.push(e.data);
            };

            mediaRecorder.onstop = function (e) {
                var blob = new Blob(this.chunks, { 'type': 'audio/ogg; codecs=opus' });
                socket.emit('radio', blob);
            };

            var audioButton = document.querySelector("#audio");
            audioButton.addEventListener('mousedown', function (e) {
                e.preventDefault()
                audioButton.innerHTML = "Gravando";
                mediaRecorder.start();
            });

            audioButton.addEventListener('mouseup', function (e) {
                e.preventDefault()
                audioButton.innerHTML = "Audio";
                mediaRecorder.stop();
            });
        });
    }

    //EVENTOS
    $imageBox.addEventListener('change', function () {
        var myFile = $imageBox.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(myFile);
        reader.onloadend = function () {
            var base64data = reader.result;
            $imageBox.value = null;
            socket.emit('image', base64data);
        }
    });

    $message.addEventListener('keyup', function (e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            document.querySelector("#enviar_mensagem").click();
            e.preventDefault();
        }
    });

    $userForm.addEventListener('submit', function (e) {
        e.preventDefault();

        usernameGlobal = $username.value.replace(/(<([^>]+)>)/ig, '');

        if ($corUsuario.value == 0) {
            var cores = ["default", "info", "success", "warning", "danger"];
            var cor = cores.sort(function () { return 0.5 - Math.random() })[0];
        }
        else {
            var cor = $corUsuario.value;
        }

        var salaId = $salaId.value || null;
        var salaSenha = $salaSenha.value;

        socket.emit('new user', { username: usernameGlobal, cor: cor, salaId: salaId, salaSenha: salaSenha }, function (data, id, mensagens) {
            if (data == true) {
                $userArea.style.display = 'none';
                $messageArea.style.display = 'block';

                salaId = id;
                document.getElementById("nomeSala").innerText = salaId;
                window.location.hash = '#' + salaId;
                window.document.title = 'Chat da Massa - Sala ' + salaId;

                mensagens.forEach(item => {
                    printMessage(item, false);
                });
            }
            else {
                alert(id);
            }
        });

        return false;
    });

    $messageForm.addEventListener('submit', function (e) {
        var message = $message.value.replace(/(<([^>]+)>)/ig, '');
        e.preventDefault();

        socket.emit('send message', message);
        $message.value = '';
    });

    $notificacoes.addEventListener('change', function (e) {
        window.localStorage.setItem('config_notify', $notificacoes.checked == true ? true : null);
    });

    $som.addEventListener('change', function (e) {
        window.localStorage.setItem('config_sound', $som.checked == true ? true : null);
    });

    // Eventos de Socket
    socket.on('new message', function (data) {
        if (usernameGlobal) {
            printMessage(data);
        }
    });

    socket.on('get users', function (data) {
        var html = ''

        data.forEach(item => {
            html += "<li class='list-group-item list-group-item-" + item.cor + "'>" + item.username + '</li>';
        });

        $users.innerHTML = html;
    });

    socket.on('logou', function (data) {
        $chat.innerHTML += '<li tabindex="1" class="list-group-item list-group-item-success"><span class="fa fa-sign-in"></span> <strong>' + data + '</strong> entrou na sala...</li>';
        focarUltimaMensagem();
    });

    socket.on('saiu', function (data) {
        $chat.innerHTML += '<li tabindex="1" class="list-group-item list-group-item-danger"><span class="fa fa-sign-out"></span> <strong>' + data + '</strong> saiu da sala...</li>';
        focarUltimaMensagem();
    });
});