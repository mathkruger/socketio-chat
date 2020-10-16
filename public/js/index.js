$(function () {
    var socket = io.connect();

    var $messageArea = $('#messageArea');
    var $chat = $('#chat');
    var $messageForm = $('#messageForm');
    var $message = $('#message');
    var $userArea = $('#userArea');
    var $userForm = $('#userForm');
    var $username = $('#username');
    var $users = $('#users');
    var $imageBox = $('#fotoInput');

    var usernameGlobal;
    var hashSala = window.location.hash.replace('#', '');

    function urlify(text) {
        var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return text.replace(urlRegex, function (url, b, c) {
            var url2 = (c == 'www.') ? 'http://' + url : url;
            return '<a href="' + url2 + '" target="_blank">' + url + '</a>';
        });
    };

    // SONS SETUP
    soundManager.setup({
        url: '/',
        debugMode: false,
        onready: function () {
            soundManager.createSound({
                id: 'msn',
                url: '../assets/notification.mp3'
            });
        },

        ontimeout: function () {
            console.error('navegador sem suporte a emissão de sons :(');
        }
    });

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

        $("#audio")
            .mousedown(function (e) {
                e.preventDefault()
                $(this).text("Gravando")
                mediaRecorder.start();
            })
            .mouseup(function (e) {
                e.preventDefault()
                $(this).text("Audio")
                mediaRecorder.stop()
            });
    });

    //EVENTOS
    $imageBox.change(function () {
        var myFile = $(this).prop('files')[0];
        var reader = new FileReader();
        reader.readAsDataURL(myFile);
        reader.onloadend = function () {
            var base64data = reader.result;
            socket.emit('image', base64data);
        }
    });

    $message.keypress(function (e) {
        if (e.which == 13 && !e.shiftKey) {
            $messageForm.submit();
            e.preventDefault();
        }
    });

    $userForm.submit(function (e) {
        usernameGlobal = $username.val().replace(/(<([^>]+)>)/ig, '');
        e.preventDefault();

        var cores = ["default", "info", "success", "warning", "danger"];
        var cor = cores.sort(function () { return 0.5 - Math.random() })[0];

        socket.emit('new user', { username: usernameGlobal, cor: cor, salaId: hashSala }, function (data, id) {
            $userArea.hide();
            $messageArea.show();

            hashSala = id;
            window.location.hash = '#' + hashSala;
            window.document.title = 'Chat da Massa - Sala ' + hashSala;
        });
    });

    $messageForm.submit(function (e) {
        var message = $message.val().replace(/(<([^>]+)>)/ig, '');
        e.preventDefault();

        socket.emit('send message', message);
        $message.val('');
    });

    socket.on('new message', function (data) {
        if (usernameGlobal) {
            if (data.blob == null) {
                var message = urlify(data.message);

                if (message.indexOf('[ASCII]') > -1) {
                    message = message.replace('[ASCII]', '');
                    message = '<pre>' + message + '</pre>';
                }

                $chat.append("<li tabindex='1' class='list-group-item list-group-item-default'><span class='text-" + data.cor + "'><strong>" + data.username + '</strong>: ' + message + '</span></li>');
                $("#chat li").last().addClass('active-li').focus();
                $message.focus();
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

                console.log(message);

                $chat.append("<li tabindex='1' class='list-group-item list-group-item-default'><span class='text-" + data.cor + "'><strong>" + data.username + '</strong>: ' + message + '</span></li>');
                $("#chat li").last().addClass('active-li').focus();
                $message.focus();
            }

            if (data.username != usernameGlobal)
                soundManager.play('msn');
        }
    });

    socket.on('get users', function (data) {
        console.log(data);
        var html = ''

        data.forEach(item => {
            html += "<li class='list-group-item list-group-item-" + item.cor + "'>" + item.username + '</li>';
        });

        $users.html(html);
    });

    socket.on('logou', function (data) {
        $chat.append('<li tabindex="1" class="list-group-item list-group-item-success"><span class="fa fa-sign-in"></span> <strong>' + data + '</strong> entrou na sala...</li>');
        $("#chat li").last().addClass('active-li').focus();
        $message.focus();
    });

    socket.on('saiu', function (data) {
        $chat.append('<li tabindex="1" class="list-group-item list-group-item-danger"><span class="fa fa-sign-out"></span> <strong>' + data + '</strong> saiu da sala...</li>');
        $("#chat li").last().addClass('active-li').focus();
        $message.focus();
    });
});