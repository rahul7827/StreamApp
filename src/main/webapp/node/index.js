const express = require('express');

const app = express();
const port = 3000;
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
    cors: {
      origin: "*"
    }
});

var users = [];

io.on("connection", (socket) => {

    console.log("connected");
    let new_user = socket.handshake.query;

    new_user.id = socket.id;
    socket.room = new_user.room;

    socket.join(new_user.room);
    users.push(new_user);

    console.log("socketUsers", socket.room, socket.id);

    socket.broadcast.to(socket.id).emit("user_join", new_user);
    io.to(socket.id).emit("all_users", users); // self message consisting all users list

    socket.broadcast.to(socket.room).emit("user_join", new_user);

    socket.on("message", function(data) {

        if(data.message_type == "public"){
            console.log("socketRoom", socket.room);
            socket.broadcast.emit("message", data);
            // emit(socket.room).
        } else {
            // private msg
            // let to = data.message_to;
            // let from = data.id;

            // data.message_to = from;
            // data.id = to;
            
            io.to(data.message_to).emit("message", data);
        }

        console.log("msgData", data);
    });

    socket.on("disconnect", () => {
        console.log("userBeforeLeft", users);
        socket.to(socket.room).emit("left", socket.id);
        users = users.filter(user=>{
            return user.id != socket.id;
        })
        console.log("userAfterLeft", users);
    });

});


server.listen(port, '127.0.0.1', function () {
//http listen, to make socket work
// app.address = "127.0.0.1";
console.log('Server started on port:' + port);
});