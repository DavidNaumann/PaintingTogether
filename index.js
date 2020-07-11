var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// start webserver on port 3000
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);
// add directory with our static files
app.use(express.static(__dirname + '/static'));
console.log("Server running on 127.0.0.1:8080");

// array of all lines drawn
var players = {};
var canvasDetails = [];
var numPlayers = 1;

// event-handler for new incoming connections
io.on('connection', function (socket) {

    socket.emit('setRoom', socket.id);

    socket.on('getRoom',function (room) {
        socket.join(room);
        if(typeof players[room] === 'undefined') {
            players[room] = {
                lines: [],
                name: numPlayers.toString()
            }
            socket.emit('done_loading');
        }
        else {
            for(var i in players[room].lines)
            {
                socket.emit('draw_line',players[room].lines[i]);
            }
            socket.emit('done_loading');
        }
    });


    socket.on('clear',function (room) {
        players[room] = {
            lines: [],
            name: numPlayers.toString()
        }
        console.log('clear called');
        io.sockets.in(room).emit('clear_canvas');
    });

    // add handler for message type "draw_line".
    socket.on('draw_line', function (data) {
        // add received line to history
        var line_info = {};
        line_info.line = data.line;
        line_info.color = data.color;
        line_info.size = data.size;
        line_info.style = data.style;

        players[data.room].lines.push(line_info);
        // send line to all clients
        io.sockets.in(data.room).emit('draw_line', { line: data.line, style: data.style, size: data.size, color: data.color, room: data.room });
    });

    socket.on('disconnect', function (data) {
        delete players[socket.room];
        delete canvasDetails[socket.room];
        io.emit('popPhoto', socket.room);

    });


});
