let localStream;
let remoteStream;
let pc;
let isOnCall = false;
let offer;
let createdOffer;
let inCall = false;
let incomingCallModal = document.getElementById('incomingCallModal');
let videoChatModal = document.getElementById('videoChatModal');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
const incomingCallSound = document.getElementById("incomingCallSound");
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
let allFriends = [];
let candidates = [];
let messageStore = {};
let unseen = {};
let caller = null;
const username = document.getElementById('username').value;
const token = document.getElementById('token').value;
document.getElementById("localVideo").volume = 0
console.log("My Username", username);
let currentFriend = '';
let roomId = '1234'; // the ID of the room the user is joining

const socket = io("https://localhost:3000", { query : {token}, rejectUnauthorized: false });
const configuration = {
    iceServers: [
        { urls: 'stun:stun.stunprotocol.org:3478' },
        {
            urls: 'stun:stun1.l.google.com:19302'
        },
        {
            urls: 'stun:stun2.l.google.com:19302'
        },
        {
            urls: 'stun:stun3.l.google.com:19302'
        },
        {
            urls: 'stun:stun4.l.google.com:19302'
        }
    ]
};



let peerConnection = new RTCPeerConnection(configuration);

document.addEventListener('DOMContentLoaded', function () {
    function updateFriendsList() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    console.log(response);
                    var friends = response;
                    allFriends = friends;
                    console.log("All friends", allFriends);
                    var friendList = document.getElementById('friend-list');
                    friendList.innerHTML = ''; // clear existing list items
                    for (var i = 0; i < friends.length; i++) {
                        var friend = friends[i];
                        console.log("Acquired friend ", friend.username)
                        let uname = friend.username;
                        if (!unseen[uname])
                            unseen[uname] = 0;

                        var statusClass = 'bg-green-500';
                        var listItem = document.createElement('li');
                        listItem.className = 'flex items-center mb-4 hover:bg-gray-100 cursor-pointer';
                        listItem.onclick = function () {

                            friendClicked(uname);
                        }
                        if (!messageStore[friend.username]) {
                            messageStore[friend.username] = [];
                        }
                        socket.emit('join-room', uname)


                        var statusIcon = document.createElement('span');
                        statusIcon.className = 'w-3 h-3 rounded-full mr-2';
                        statusIcon.classList.add(statusClass);
                        var friendName = document.createElement('p');
                        friendName.className = 'text-gray-800 font-medium';
                        friendName.innerText = friend.username;

                        var numUnseenMessages = document.createElement('span');
                        numUnseenMessages.style.backgroundColor = 'red';
                        numUnseenMessages.style.color = 'white';
                        numUnseenMessages.style.display = 'inline-block';
                        numUnseenMessages.style.borderRadius = '50px';
                        numUnseenMessages.style.padding = '2px 8px';
                        numUnseenMessages.className = 'text-gray-500 text-sm ml-2';
                        numUnseenMessages.innerText = unseen[uname];
                        listItem.appendChild(statusIcon);
                        listItem.appendChild(friendName);
                        listItem.appendChild(numUnseenMessages);
                        friendList.appendChild(listItem);
                    }
                } else {
                    console.log('Error retrieving friend list');
                }
            }

        };
        xhr.open('GET', '/friends', true);
        xhr.send();
    }
    console.log("Initial Messagestore", messageStore);

    // Call the function once immediately when the page is loaded
    updateFriendsList();

    // Call the function every 2 seconds

});

function renderFriendList() {
    let friendList = document.getElementById('friend-list');
    friendList.innerHTML = '';
    for (var i = 0; i < allFriends.length; i++) {
        var friend = allFriends[i];
        console.log("Acquired friend in render function", friend.username)
        let uname = friend.username;
        if (!unseen[uname])
            unseen[uname] = 0;

        var statusClass = 'bg-green-500';
        /*
        if (!friend.isOnline) {
            statusClass = "bg-red-500"
        }
        */
        var listItem = document.createElement('li');
        listItem.className = 'flex items-center mb-4 hover:bg-gray-100 cursor-pointer';
        listItem.onclick = function () {
          
            friendClicked(uname);
        }
        if (!messageStore[friend.username]) {
            messageStore[friend.username] = [];
        }


        var statusIcon = document.createElement('span');
        statusIcon.className = 'w-3 h-3 rounded-full mr-2';
        statusIcon.classList.add(statusClass);
        var friendName = document.createElement('p');
        friendName.className = 'text-gray-800 font-medium';
        friendName.innerText = friend.username;

        var numUnseenMessages = document.createElement('span');
        numUnseenMessages.style.backgroundColor = 'red';
        numUnseenMessages.style.color = 'white';
        numUnseenMessages.style.display = 'inline-block';
        numUnseenMessages.style.borderRadius = '50px';
        numUnseenMessages.style.padding = '2px 8px';
        numUnseenMessages.className = 'text-gray-500 text-sm ml-2';
        numUnseenMessages.innerText = unseen[uname];
        listItem.appendChild(statusIcon);
        listItem.appendChild(friendName);
        listItem.appendChild(numUnseenMessages);
        friendList.appendChild(listItem);
    }
}




socket.emit('join-room', username);
socket.on('error', (message) =>{
    console.log('message', message);
});
socket.on('offer', async (offer, receipientInfo) => {
    if (receipientInfo.to === username) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);
        try {

            socket.emit('answer', peerConnection.localDescription, { username, to: receipientInfo.username });

        } catch (error) {
            console.error(error);
        }
    }


})
socket.on('connect_error', (err) => {
    console.error(`Socket connection error: ${err.message}`);
    alert(`Socket connection error: ${err.message}`);
    // Display an error message to the user
    // For example, you can use an alert() function or modify the HTML of the page to display an error message
  });

socket.on('chat-message', (message, roomId) => {
    console.log('received chatMessage');

});

socket.on('call', (callData) => {
    console.log("callData", callData);
    if (callData.to === username) {
        caller = callData.username;
        incomingCall();
    }

});


socket.on('user-disconnected', (username) => {
    console.log("disconnected user ", username);
    for (let i = 0; i < allFriends.length; i++) {
        if (allFriends[i].username === username) {
            allFriends[i][isOnline] = false;
            console.log("disconnected user ", allFriends[i]);
        }
    }
    //// renderFriendList();
});
socket.on('user-connected', (username) => {
    console.log("connected user ", username);
    for (let i = 0; i < allFriends.length; i++) {
        if (allFriends[i].username === username) {
            allFriends[i][isOnline] = true;
            console.log("connected user ", allFriends[i]);
        }
    }
    // renderFriendList();
});

socket.on('accept', async (callData) => {
    console.log("Peer accepted our call", callData);
    if (callData.to === username) {
        console.log("calldata after checking to and username", callData);

        await addLocalVideo();
        peerConnection.ontrack = waitRemoteVideo;
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {

                socket.emit('candidate', event.candidate, { username, to: callData.username });
            }
            console.log("got local ice candidate");
        };
        peerConnection.onnegotiationneeded = async () => {
            console.log("negotiation needed");
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('offer', offer, { username, to: callData.username });
                console.log("Sending offer from my room ", username, " to ", callData.username);
            } catch (error) {
                console.error('Error creating offer:', error);
            }


        };




    }


});

socket.on('candidate', async (receivedCandidate, receipientInfo) => {
    if (receipientInfo.to === username) {
        console.log("received candidate:", receivedCandidate);
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(receivedCandidate));

        }
        catch (error) {
            console.log(error);
        }
    }


});

socket.on('answer', (answer, receipientInfo) => {
    if (receipientInfo.to === username) {
        console.log("received answer", answer);
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        isOnCall = true;
    }



});
async function startVideoCall() {

    videoChatModal.classList.remove('hidden');
    socket.emit("call", { username, to: currentFriend });
    console.log("Initiated video call request!!")
}



function startAudioCall() {
    // code to start an audio call

}

function incomingCall() {
    // code to show the modal form for incoming call
    inCall = false;
    incomingCallModal.classList.remove('hidden');
    window.addEventListener("click", () => {
        if (!inCall) {
            incomingCallSound.muted = false;
            incomingCallSound.play();
            inCall = true;

        }

    });

}

function friendClicked(friendName) {
    currentFriend = friendName;
    console.log("Friend clicked: ", currentFriend);

    unseen[currentFriend] = 0;

    renderFriendList();
    chatContainer.innerHTML = ''
    let messages = messageStore[friendName];
    console.log(messages)
    document.getElementById('chat-window-friend-name').innerHTML = currentFriend;
    let finalMessageFormat = [];

    let mergedMessages = messages

    mergedMessages.sort((a, b) => {
        if (a.timestamp < b.timestamp) {
            return -1;
        } else if (a.timestamp > b.timestamp) {
            return 1;
        } else {
            return 0;
        }
    });
    console.log("merged messages ", mergedMessages)

    for (let i = 0; i < mergedMessages.length; i++) {
        let message = mergedMessages[i].message
        if (!mergedMessages[i].to) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('flex', 'flex-col');

            messageElement.classList.add('self-start');
            messageElement.innerHTML = `
          <div class="bg-gray-300 px-4 py-2 rounded-lg mb-2 max-w-2/3 self-start">${message}</div>
        `;

            chatContainer.appendChild(messageElement);
        }
        else {
            const messageElement = document.createElement('div');
            messageElement.classList.add('flex', 'flex-col', 'self-end');
            messageElement.innerHTML = `
      <div class="bg-blue-500 text-white px-4 py-2 rounded-lg mb-2 max-w-2/3 self-end">${message}</div>
    `;
            chatContainer.appendChild(messageElement);
        }


    }




}


async function addLocalVideo() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    console.log("added local video");

    navigator.mediaDevices.getUserMedia({ video: true, audio: { echoCancellation: true } })
        .then(stream => {
            // handle the stream
            localStream = stream;
            localVideo.srcObject = stream;
            for (const track of localStream.getTracks()) {
                peerConnection.addTrack(track, localStream);
            }
        })
        .catch(error => {
            console.log(error)
        });

}

async function answerCall() {
    // code to answer the incoming call
    inCall = true;
    incomingCallSound.pause();
    incomingCallSound.currentTime = 0;
    console.log("Answered call and paused");
    incomingCallModal.classList.add('hidden');

    // show the video chat modal
    videoChatModal.classList.remove('hidden');

    // get local video stream

    peerConnection.ontrack = waitRemoteVideo;
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {

            socket.emit('candidate', event.candidate, { username, to: caller });
        }
        console.log("got local ice candidate");
    };
    await addLocalVideo();
    console.log("Caller ", caller);

    socket.emit('accept', { username, to: caller });

}


// receive answer from friend
// replace with your own signaling code
function receiveAnswerFromFriend(answer) {

}

function endCall() {
    // code to end the call
    videoChatModal.classList.add('hidden');
    peerConnection.close();
    peerConnection = new RTCPeerConnection(configuration);
    localStream.getTracks().forEach(track => {
        track.stop()
    })



}

function sendIceCandidate(event) {
    if (event.candidate) {
        socket.emit('candidate', event.candidate, roomId);
    }
}

function waitRemoteVideo(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.addEventListener('loadedmetadata', () => {
        remoteVideo.play();
    });
}



// Receive chat messages from the server and append them to the chat container
socket.on('chatMessage', message => {
    console.log("received message");
    if (message.to === username) {

        if (currentFriend != message.from) {

        }
        // document.getElementById('chat-window-friend-name').innerHTML = message.from;
        if (message.from == currentFriend) {
            unseen[currentFriend] = 0;
        }
        else {
            unseen[message.from] = unseen[message.from] + 1;

        }
        console.log("unseen", unseen);
        let sender = message.from;
        if (messageStore[sender]) {
            const timestamp = new Date().getTime();
            messageStore[sender].push({ message: message.text, from: sender, timestamp: timestamp });
        }
        else {
            messageStore[sender] = [];
            const timestamp = new Date().getTime();
            messageStore[sender].push({ message: message.text, from: sender, timestamp: timestamp });
        }

        if (currentFriend == message.from) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('flex', 'flex-col');

            messageElement.classList.add('self-start');
            messageElement.innerHTML = `
      <div class="bg-gray-300 px-4 py-2 rounded-lg mb-2 max-w-2/3 self-start">${message.text}</div>
    `;

            chatContainer.appendChild(messageElement);
        }
        renderFriendList();

    }
    console.log("messsage store", messageStore);

});

// Send chat message to the server
function sendMessage(event) {
    event.preventDefault();
    if (currentFriend === '') {
        currentFriend = username
    }
    console.log("Message sent to ", currentFriend);
    const messageText = messageInput.value.trim();
    if (messageText) {
        const message = {
            from: username,
            text: messageText,
            to: currentFriend
        };
        socket.emit('chatMessage', message, currentFriend);
        const messageElement = document.createElement('div');
        messageElement.classList.add('flex', 'flex-col', 'self-end');
        messageElement.innerHTML = `
      <div class="bg-blue-500 text-white px-4 py-2 rounded-lg mb-2 max-w-2/3 self-end">${messageText}</div>
    `;
        chatContainer.appendChild(messageElement);
        messageInput.value = '';
        if (messageStore[currentFriend]) {
            const timestamp = new Date().getTime();
            messageStore[currentFriend].push({ message: message.text, to: currentFriend, timestamp: timestamp });
        }
        else {
            messageStore[currentFriend] = [];
            const timestamp = new Date().getTime();
            messageStore[currentFriend].push({ message: message.text, to: currentFriend, timestamp: timestamp })
        }
    }
    console.log("messsage store", messageStore);
}
