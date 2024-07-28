const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { PeerServer } = require("peer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const peerServer = PeerServer({ port: 3001, path: "/myapp" });

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
