document.addEventListener("DOMContentLoaded", function() {
    var mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };

    var localLines = [];
    var url = window.location.href;
    var room = getQueryVariable("room");
    var loaded = false;

    // get canvas element and create context
    var canvas  = document.getElementById('drawing');
    var canvasBounds = canvas.getBoundingClientRect();
    var context = canvas.getContext('2d');
    var width   = window.innerWidth;
    var height  = window.innerHeight;
    var socket  = io.connect();
    var style = 1;
    var size = 5;
    var color = "#00ff04";

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, width, height);


    // Button handling (to be implemented with gui later)

    // register mouse event handlers
    canvas.onmousedown = function(e){ mouse.click = true; };
    canvas.onmouseup = function(e){ mouse.click = false; };

    canvas.onmousemove = function(e) {
        // normalize mouse position to range 0.0 - 1.0
        var bounds = canvas.getBoundingClientRect();
        mouse.pos.x = (e.clientX - bounds.x) / bounds.width;
        mouse.pos.y = (e.clientY - bounds.y) / bounds.height;

        mouse.move = true;
    };

    // register touch event handlers (uggh, it is about to get ugly)
    canvas.addEventListener("touchstart",function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
           clientX: touch.clientX,
           clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);

    }, false);

    canvas.addEventListener("touchend",function (e) {
        var mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    }, false);

    canvas.addEventListener("touchmove",function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
           clientX: touch.clientX,
           clientY: touch.clientY
        });

        canvas.dispatchEvent(mouseEvent);
    }, false);

    // CLEAR LOGIC

    document.onkeydown = function(e) {
        switch(e.key)
        {
            case "q":
                clear();
                break;
            default:
                // default handling (not needed atm)
        }

    }


    function clear()
    {
        socket.emit('clear',room);
    }

    // code for handling clear event
    socket.on('clear_canvas', function () {
        console.log('clear canvas called :D');
        context.clearRect(0,0,canvas.width,canvas.height);
    });


    // Socket handling

    function getQueryVariable(variable)
    {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
        }
        return '';
    }


    // draw line received from server
    socket.on('draw_line', function (data) {
        var line = data.line;
        localLines.push(data.line);
        var style = data.style;
        var size = data.size;
        var color = data.color;
        if(style == 1)
        {
            context.beginPath();
            context.moveTo(line[0].x * width, line[0].y * height);
            context.lineTo(line[1].x * width, line[1].y * height);
            context.strokeStyle = color;
            context.lineWidth = size;
            context.stroke();
        }
    });

    socket.on('setRoom',function (myRoom) {
        if(room == '') {
            room = myRoom;
        }
        $('#roomName').append('<p><a href="http://www.painting.davidsprojects.us/?room='+room+'">http://www.painting.davidsprojects.us/?room='+room+'</a></p>');
        socket.emit('getRoom',room);
    });

    socket.on('newRoom',function (newRoom) {
        room = newRoom;
    });

    socket.on('done_loading',function () {
        document.getElementById("loader").style.display = "none";
        document.getElementById("screen").style.display = "block";
    });




    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            color = document.getElementById("brushcolor").value;
            size = document.getElementById("brushsize").value;
            socket.emit('draw_line', {line: [ mouse.pos, mouse.pos_prev ], style: style, size: size, color: color, room: room});
            mouse.move = false;
        }
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 3);
    }
    mainLoop();
});