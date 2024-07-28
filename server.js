const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { PeerServer } = require("peer");

const peerServer = PeerServer({ port: 3001, path: "/" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let chatHistory = [];
let usersInRoom = {};

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    usersInRoom[socket.id] = { userId, userName };

    // Inform the new user about existing users
    socket.emit("existing-users", Object.values(usersInRoom));

    // Inform existing users about the new user
    socket.to(roomId).emit("user-connected", userId, userName);
    socket.emit("chat-history", chatHistory);

    socket.on("send-chat-message", (message) => {
      chatHistory.push(message);
      io.to(roomId).emit("chat-message", message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
      delete usersInRoom[socket.id];
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
