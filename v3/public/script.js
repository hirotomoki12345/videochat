const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const nameInputContainer = document.getElementById("name-input-container");
const nameInput = document.getElementById("name-input");
const joinButton = document.getElementById("join-button");
const muteButton = document.getElementById("mute-button");
const cameraButton = document.getElementById("camera-button");
const controls = document.getElementById("controls");

let localStream;
let peer;
let peers = {};
let isMuted = false;
let isCameraOff = false;

joinButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (name) {
    socket.emit(
      "check-username",
      name,
      new URLSearchParams(window.location.search).get("id"),
    );
  } else {
    alert("Please enter a name");
  }
});

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteButton.textContent = isMuted ? "Unmute" : "Mute";
});

cameraButton.addEventListener("click", () => {
  isCameraOff = !isCameraOff;
  localStream.getVideoTracks()[0].enabled = !isCameraOff;
  cameraButton.textContent = isCameraOff ? "Turn Camera On" : "Turn Camera Off";
});

async function init(name) {
  const roomId = new URLSearchParams(window.location.search).get("id");
  if (!roomId) {
    alert("Room ID is required");
    return;
  }

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  addVideoStream("local", localStream, name, true);

  controls.style.display = "flex";

  peer = new Peer(undefined, {
    host: "/",
    port: "3001",
  });

  peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, name);
  });

  socket.on("user-connected", (userId, userName) => {
    connectToNewUser(userId, localStream, userName);
  });

  socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
    const videoElement = document.getElementById(userId);
    if (videoElement) {
      videoElement.remove();
    }
  });

  peer.on("call", (call) => {
    call.answer(localStream);
    call.on("stream", (userVideoStream) => {
      if (!document.getElementById(call.peer)) {
        addVideoStream(call.peer, userVideoStream, call.metadata.name);
      }
    });
  });
}

function connectToNewUser(userId, stream, userName) {
  const call = peer.call(userId, stream, { metadata: { name: userName } });
  call.on("stream", (userVideoStream) => {
    if (!document.getElementById(userId)) {
      addVideoStream(userId, userVideoStream, userName);
    }
  });
  call.on("close", () => {
    const videoElement = document.getElementById(userId);
    if (videoElement) {
      videoElement.remove();
    }
  });

  peers[userId] = call;
}

function addVideoStream(id, stream, name, isLocal = false) {
  const videoContainer = document.createElement("div");
  const video = document.createElement("video");
  const nameLabel = document.createElement("div");

  videoContainer.id = id;
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = isLocal;

  nameLabel.textContent = name;
  videoContainer.append(video, nameLabel);
  videoGrid.append(videoContainer);
}

socket.on("username-taken", () => {
  alert("Username is already taken. Please choose another name.");
  nameInputContainer.style.display = "flex";
});

socket.on("username-available", (name) => {
  nameInputContainer.style.display = "none";
  init(name);
});
