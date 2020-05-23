document.addEventListener("DOMContentLoaded", function() {
    var mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    // get canvas element and create context
    var canvas  = document.getElementById('drawing');
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

    // Button handling (to be implemented with gui later)

    // register mouse event handlers
    canvas.onmousedown = function(e){ mouse.click = true; };
    canvas.onmouseup = function(e){ mouse.click = false; };

    canvas.onmousemove = function(e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / height;
        mouse.move = true;
    };

    // register touch event handlers (uggh, it is about to get ugly)
    canvas.addEventListener("touchstart",function (e) {
        var touch = e.touches[0]
        var mouseEvent = new MouseEvent("mousedown", {
           clientX: touch.clientX,
           clientY: touch.clientY
        });

        canvas.dispatchEvent(mouseEvent);

    }, false);

    canvas.addEventListener("touchend",function (e) {
        var mouseEvent = new mouseEvent("mouseup", {});
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

    document.getElementById("clrbtn").onclick = function () {
        clear();
    }

    function clear()
    {
        socket.emit('clear');
    }


    // Socket handling

    // draw line received from server
    socket.on('draw_line', function (data) {
        var line = data.line;
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
        else
        {
            console.log('none');
        }
    });

    // code for handling clear event
    socket.on('clear_canvas', function () {
        console.log('clear canvas called :D');
        context.clearRect(0,0,canvas.width,canvas.height);
    });


    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            color = document.getElementById("brushcolor").value;
            size = document.getElementById("brushsize").value;
            socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ], style: style, size: size, color: color });
            mouse.move = false;
        }
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 30);
    }
    mainLoop();
});