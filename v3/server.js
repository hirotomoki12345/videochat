const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

  socket.on("join-room", (roomId, name) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(name);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.name = name;
    socket.to(roomId).emit("user-connected", socket.id, name);

    socket.on("disconnect", () => {
      const index = rooms[roomId].indexOf(name);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
      }
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("offer", (userId, offer) => {
      socket.to(userId).emit("user-data", socket.id, name, offer);
    });

    socket.on("answer", (userId, answer) => {
      socket.to(userId).emit("answer", socket.id, answer);
    });

    socket.on("candidate", (userId, candidate) => {
      socket.to(userId).emit("candidate", socket.id, candidate);
    });
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
