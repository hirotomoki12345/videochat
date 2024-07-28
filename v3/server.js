const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
  socket.on("check-username", (name, roomId) => {
    if (rooms[roomId] && rooms[roomId].includes(name)) {
      socket.emit("username-taken");
    } else {
      socket.emit("username-available", name);
    }
  });

  socket.on("join-room", (roomId, userId, name) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(name);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.name = name;
    socket.to(roomId).emit("user-connected", userId, name);

    socket.on("disconnect", () => {
      const index = rooms[roomId].indexOf(name);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
      }
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
