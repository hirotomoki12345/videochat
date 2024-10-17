const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const nameInputContainer = document.getElementById("name-input-container");
const nameInput = document.getElementById("name-input");
const joinButton = document.getElementById("join-button");
const muteButton = document.getElementById("mute-button");
const cameraButton = document.getElementById("camera-button");
const controls = document.getElementById("controls");

let localStream;
let peerConnections = {};
let isMuted = false;
let isCameraOff = false;

joinButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (name) {
    nameInputContainer.style.display = "none";
    document.body.style.overflow = "hidden";
    socket.emit("check-username", name, new URLSearchParams(window.location.search).get("id"));
    init(name);
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

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  addVideoStream("local", localStream, name, true);
  controls.style.display = "flex";
  socket.emit("join-room", roomId, name);

  socket.on("user-connected", (userId, userName) => {
    connectToNewUser(userId, userName);
  });

  socket.on("user-disconnected", (userId) => {
    if (peerConnections[userId]) {
      peerConnections[userId].close();
      delete peerConnections[userId];
    }
    const videoElement = document.getElementById(userId);
    if (videoElement) {
      videoElement.remove();
      adjustVideoSize();
    }
  });

  socket.on("user-data", (userId, userName, offer) => {
    const peerConnection = new RTCPeerConnection();
    peerConnections[userId] = peerConnection;

    peerConnection.addStream(localStream);

    peerConnection.ontrack = (event) => {
      if (!document.getElementById(userId)) {
        addVideoStream(userId, event.streams[0], userName);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", userId, event.candidate);
      }
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit("answer", userId, answer);
    });
  });

  socket.on("candidate", (userId, candidate) => {
    const peerConnection = peerConnections[userId];
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  socket.on("answer", (userId, answer) => {
    const peerConnection = peerConnections[userId];
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  function connectToNewUser(userId, userName) {
    const peerConnection = new RTCPeerConnection();
    peerConnections[userId] = peerConnection;

    peerConnection.addStream(localStream);

    peerConnection.ontrack = (event) => {
      if (!document.getElementById(userId)) {
        addVideoStream(userId, event.streams[0], userName);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", userId, event.candidate);
      }
    };

    peerConnection.createOffer().then((offer) => {
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", userId, offer);
    });
  }
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
  nameLabel.style.fontSize = "18px";
  nameLabel.style.fontWeight = "bold";
  nameLabel.style.color = "#ffffff";
  videoContainer.append(video, nameLabel);
  videoGrid.append(videoContainer);
  
  if (isLocal) {
    video.style.width = "600px";
    video.style.height = "450px";
  } else {
    adjustVideoSize();
  }
}

function adjustVideoSize() {
  const videos = videoGrid.getElementsByTagName("video");
  const numVideos = videos.length;
  const width = Math.max(300, 600 / Math.sqrt(numVideos));
  const height = width * 0.75;

  for (const video of videos) {
    video.style.width = `${width}px`;
    video.style.height = `${height}px`;
  }
}
