const app = require('express')();
const http = require('http').Server(app);

const io = require('socket.io')(http, {
    cors: {
      origin: "*"
    }
});
const port = process.env.PORT || 3000;

// Middleware
/*
io.use(async (socket, next) => {
    try {
        let room =  socket.handshake.query.room;
        console.log("Middleware triggered", socket.handshake.query.room);
        if(room) {
            let client_length = await getClientCount(room);
             //  await io.in(room).fetchSockets();
            console.log("client_length ", client_length);

            // Only 2 users are allowed in P2P
            if(client_length >= 2){
                next(new Error("NoSpaceForNewPeer"));
            } else {
                next();
            }
        }
    } catch (e) {
      next(new Error("NoSpaceForNewPeer"));
    }
  });
*/

io.on('connection', async (socket) => {
    console.log('user connected', socket.id);
    let room =  socket.handshake.query.room;

    let client_length = await getClientCount(room);

    if(client_length <= 1) {
        socket.join(room);
    }

    if(client_length == 0) {
        // io.emit('REQUEST_OR_JOIN_RESPONSE', {is_permission_required:false});
        console.log("socket.id", socket.id);
        io.to(socket.id).emit("REQUEST_OR_JOIN_RESPONSE", {is_permission_required:false});
   
    } else if(client_length == 1) {
        // io.emit('REQUEST_OR_JOIN_RESPONSE', {is_permission_required:true});
        socket.to(room).emit("REQUEST_OR_JOIN_RESPONSE", {is_permission_required:true});
        io.to(socket.id).emit("CALL_APPROVAL", {is_approved:"APPROVAL_SENT"});
        
        
    } else if(client_length > 1) {
        // socket.emit("NoSpaceForNewPeer");
        io.to(socket.id).emit("NoSpaceForNewPeer");
    }    
   
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });

    socket.on('CALL_APPROVAL', (data) => {
        socket.to(room).emit("CALL_APPROVAL", data);
    });

    socket.on('connect', () => {
        console.log("Server Connected");
    });

    socket.on('disconnect', () => {
        console.log("Server Disconnected");
    });
    
});

async function getClientCount(room) {
    let x = await io.in(room).fetchSockets();
    console.log("client count called", x.length);
    return x.length;
}

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});