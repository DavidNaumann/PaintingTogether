var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// start webserver on port 3000
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(3000);
// add directory with our static files
app.use(express.static(__dirname + '/static'));
console.log("Server running on 127.0.0.1:3000");

// array of all lines drawn
var lines = []

// event-handler for new incoming connections
io.on('connection', function (socket) {

    // first send the history to the new client
    for (const i in lines) {
        socket.emit('draw_line', { line: lines[i].line, style: lines[i].style, size: lines[i].size, color: lines[i].color });
    }

    // add handler for message type "draw_line".
    socket.on('draw_line', function (data) {
        // add received line to history
        var line_info = {};
        line_info.line = data.line;
        line_info.color = data.color;
        line_info.size = data.size;
        line_info.style = data.style;

        lines.push(line_info);
        // send line to all clients
        io.emit('draw_line', { line: data.line, style: data.style, size: data.size, color: data.color });
    });

    socket.on('clear', function () {
       lines = [];
       console.log('clear called');
       io.emit('clear_canvas');
    });
});