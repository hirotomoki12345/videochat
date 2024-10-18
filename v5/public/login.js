function nextStep() {
    const username = document.getElementById('username').value;
    if (username.trim() === "") {
        alert("Please enter your name.");
        return;
    }

    // 名前の入力が終わったら、名前のinputを非表示にしてRoomID入力に移行
    document.getElementById('username').style.display = 'none';
    document.getElementById('next-button').style.display = 'none';

    document.getElementById('roomid').style.display = 'block';
    document.getElementById('join-button').style.display = 'block';
    document.getElementById('roomid-header').style.display = 'block';
}

function redirect() {
    const username = document.getElementById('username').value;
    const roomid = document.getElementById('roomid').value;
    
    if (roomid.trim() === "") {
        alert("Please enter the Room ID.");
        return;
    }

    // RoomIDと名前をURLに追加してリダイレクト
    window.location.href = `/chat.html?id=${roomid}&username=${username}`;
}
