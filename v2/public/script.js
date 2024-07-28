const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
  path: "/",
});

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let myStream;
let userName = "";

const muteButton = document.getElementById("muteButton");
const cameraButton = document.getElementById("cameraButton");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const nameContainer = document.createElement("div");
nameContainer.id = "name-container";
nameContainer.innerHTML = `
  <input type="text" id="nameInput" placeholder="Enter your name">
  <button id="nameSubmitButton">Join</button>
`;
document.body.append(nameContainer);

document.getElementById("nameSubmitButton").addEventListener("click", () => {
  const input = document.getElementById("nameInput").value;
  if (input) {
    userName = input;
    nameContainer.remove();
    initializeStream();
  }
});

function initializeStream() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      myStream = stream;
      addVideoStream(myVideo, stream, myPeer.id, userName);

      myPeer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(
            video,
            userVideoStream,
            call.peer,
            call.metadata.userName,
          );
        });
      });

      socket.on("user-connected", (userId, userName) => {
        connectToNewUser(userId, stream, userName);
      });

      socket.on("existing-users", (users) => {
        users.forEach((user) => {
          if (user.userId !== myPeer.id) {
            connectToNewUser(user.userId, stream, user.userName);
          }
        });
      });

      socket.on("user-disconnected", (userId) => {
        if (peers[userId]) peers[userId].close();
        removeVideoStream(userId);
      });

      socket.on("chat-message", (message) => {
        appendMessage(message);
      });

      socket.on("chat-history", (history) => {
        history.forEach((message) => appendMessage(message));
      });

      const roomId = new URLSearchParams(window.location.search).get("id");
      socket.emit("join-room", roomId, myPeer.id, userName);
    });

  myPeer.on("open", (id) => {
    const roomId = new URLSearchParams(window.location.search).get("id");
    socket.emit("join-room", roomId, id, userName);
  });
}

function connectToNewUser(userId, stream, userName) {
  if (!peers[userId]) {
    const call = myPeer.call(userId, stream, { metadata: { userName } });
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream, userId, userName);
    });
    call.on("close", () => {
      removeVideoStream(userId);
    });

    peers[userId] = call;
  }
}

function addVideoStream(video, stream, userId, userName) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  let videoWrapper = document.getElementById(`video-${userId}`);
  if (!videoWrapper) {
    videoWrapper = document.createElement("div");
    videoWrapper.id = `video-${userId}`;
    videoWrapper.style.position = "relative";
    videoWrapper.style.display = "inline-block";
    videoWrapper.style.margin = "10px";
    videoWrapper.appendChild(video);

    const nameLabel = document.createElement("div");
    nameLabel.className = "name-label";
    nameLabel.textContent = userName;
    nameLabel.style.position = "absolute";
    nameLabel.style.bottom = "0";
    nameLabel.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    nameLabel.style.color = "white";
    nameLabel.style.width = "100%";
    nameLabel.style.textAlign = "center";
    videoWrapper.appendChild(nameLabel);

    videoGrid.append(videoWrapper);
  } else {
    videoWrapper.replaceChild(video, videoWrapper.querySelector("video"));
    const nameLabel = videoWrapper.querySelector(".name-label");
    if (nameLabel) {
      nameLabel.textContent = userName;
    }
  }
}

function removeVideoStream(userId) {
  const videoWrapper = document.getElementById(`video-${userId}`);
  if (videoWrapper) {
    videoWrapper.remove();
  }
}

// Mute/unmute functionality
muteButton.addEventListener("click", () => {
  const enabled = myStream.getAudioTracks()[0].enabled;
  myStream.getAudioTracks()[0].enabled = !enabled;
  muteButton.textContent = enabled ? "Unmute" : "Mute";
});

// Turn on/off camera functionality
cameraButton.addEventListener("click", () => {
  const enabled = myStream.getVideoTracks()[0].enabled;
  myStream.getVideoTracks()[0].enabled = !enabled;
  cameraButton.textContent = enabled ? "Camera On" : "Camera Off";
});

// Chat functionality
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = messageInput.value;
  if (message.trim() && userName) {
    const timestamp = new Date().toLocaleTimeString();
    const messageWithTime = { userId: userName, message, timestamp };
    socket.emit("send-chat-message", messageWithTime);
    messageInput.value = "";
  }
}

function appendMessage({ userId, message, timestamp }) {
  const messageElement = document.createElement("div");
  messageElement.innerHTML = `<strong>${userId} [${timestamp}]:</strong> ${message}`;
  messages.append(messageElement);
  messages.scrollTop = messages.scrollHeight;
}
