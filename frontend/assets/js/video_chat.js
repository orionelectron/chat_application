let localStream = null;
let remoteStream = null;
let isOnCall = false;
let localTrack = null;
let polite = true;


let incomingCallModal = document.getElementById('incomingCallModal');
let videoChatModal = document.getElementById('videoChatModal');
let incomingCallInitiator = document.getElementById('incoming_call_initiator');
let callEndedModal = document.getElementById('call_ended_modal');
let callRejectedModal = document.getElementById('call_rejected_modal');
let callBusyModal = document.getElementById('call_busy_modal');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');


let caller = null;


let makingOffer = false;
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

const constraints = { audio: true, video: true };
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





peerConnection.ontrack = ({ track, streams }) => {
    console.log("got media track from remote peer");
    // once media for a remote track arrives, show it in the remote video element
    track.onunmute = () => {
        // don't set srcObject again if it is already set.
        if (remoteVideo.srcObject == streams[0]) {
            console.log("There is already a source object");
            return;

        }
        else {
            console.log("There is not a already source video")
        }

        remoteVideo.srcObject = streams[0];
        remoteStream = streams[0];
    };
};




function ignore_if_not_for_me(callData) {
    console.log("call data for ignore ", callData, user_id);
    if (callData.to == user_id)
        return false;
    return true;
}


socket.on("call", (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }

    if (isOnCall) {
        notify_user_busy(callData.from);
    }
    else {
        console.log("recieved a call request ", callData);
        display_incoming_call_modal(callData.from)
    }

})
socket.on("accept", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    console.log("recieved a call accepted notification ", callData);
    polite = false;
    initiate_perfect_negotiation();

})
socket.on("reject", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    console.log("recieved a call rejected notification ", callData);
    close_video_chat_window();
    display_call_rejected_modal();
})
socket.on("busy", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    isOnCall = false;

    console.log("recieved a call busy notification ", callData);
    close_video_chat_window();
    display_call_busy_modal();

})
socket.on("end", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }

    console.log("recieved a call ended notification ", callData);
    close_video_chat_window();
    display_call_ended_modal();
})
socket.on("offer", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    console.log("recieved a offer packet ", callData);
    await handle_remote_offer_perfect_negotiation(callData.offer);
})
socket.on("answer", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    console.log("recieved a answer packet ", callData);
    await handle_remote_answer_perfect_negotiation(callData.answer)
})
socket.on("candidate", async (callData) => {
    if (ignore_if_not_for_me(callData)) {
        return
    }
    console.log("recieved a remote ice candidate ", callData);
    if (callData.candidate)
        await handle_remote_candidate_perfect_negotiation(callData.candidate);
    else {

    }
})

function reset_video_call_elements() {
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function display_call_ended_modal() {
    callEndedModal.classList.remove('hidden');
}
function close_call_ended_modal() {
    callEndedModal.classList.add('hidden');
}
function display_call_rejected_modal() {
    callRejectedModal.classList.remove('hidden');
}
function close_call_rejected_modal() {
    callRejectedModal.classList.add('hidden');
}
function display_call_busy_modal() {
    callBusyModal.classList.remove('hidden');
}
function close_call_busy_modal() {
    callBusyModal.classList.add('hidden');
}
async function ask_for_media_permissions() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        for (const track of stream.getTracks()) {
            localTrack = peerConnection.addTrack(track, stream);
        }
        localVideo.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}
function close_local_stream(stream) {
    if (stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
}
function close_remote_stream(stream) {
    if (stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }

}
function close_video_chat_window() {
    reset_video_call_elements();
    close_local_stream(localStream);
    close_remote_stream(remoteStream);
    videoChatModal.classList.add('hidden');

}
function display_video_chat_window() {
    videoChatModal.classList.remove('hidden');
}
function close_incoming_call_modal() {
    incomingCallModal.classList.add('hidden');
}
function display_incoming_call_modal(from) {

    let friend = find_friend(from);
    incomingCallInitiator.innerHTML = "Incoming call from " + friend.username;
    incomingCallModal.classList.remove('hidden');
}
async function initiate_perfect_negotiation() {
    peerConnection.onicecandidate = ({ candidate }) => {

        socket.emit("candidate", { from: user_id, to: current_friend.id, candidate });
    };
    peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === "failed") {
            peerConnection.restartIce();
        }
    };
    peerConnection.onnegotiationneeded = async () => {
        try {
            makingOffer = true;
            await peerConnection.setLocalDescription();
            send_offer_to_user(peerConnection.localDescription);
        } catch (err) {
            console.error(err);
        } finally {
            makingOffer = false;
        }
    }











}

async function handle_remote_answer_perfect_negotiation(answer) {
    isSettingRemoteAnswerPending = answer.type == "answer";
    await peerConnection.setRemoteDescription(answer); // SRD rolls back as needed
    isSettingRemoteAnswerPending = false;

}

async function handle_remote_candidate_perfect_negotiation(candidate) {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (err) {
        if (!ignoreOffer) throw err; // Suppress ignored offer's candidates
    }
}

async function handle_remote_offer_perfect_negotiation(offer) {
    const offerCollision = makingOffer || peerConnection.signalingState !== "stable";
    ignoreOffer = !polite && offerCollision;
    try {
        if (ignoreOffer)
            return;

        await peerConnection.setRemoteDescription(offer);
        await peerConnection.setLocalDescription();
        send_answer_to_user(peerConnection.localDescription);
    }
    catch (error) {
        console.log(error);
    }




}

function end_video_call() {
    notify_user_call_ended();
    close_video_chat_window();
    isOnCall = false;
    peerConnection.removeTrack(localTrack);
    close_local_stream(localStream);
    close_remote_stream(remoteStream);
}
function start_video_call() {
    socket.emit("call", { from: user_id, to: current_friend.id, message: "call" });
    ask_for_media_permissions();
    display_video_chat_window();
    isOnCall = true;
}

async function accept_video_call() {
    initiate_perfect_negotiation();
    socket.emit("accept", { from: user_id, to: current_friend.id, message: "accept" })
    close_incoming_call_modal();
    await ask_for_media_permissions();
    display_video_chat_window();
    isOnCall = true;
}

function send_offer_to_user(offer) {
    console.log("sent offer");
    socket.emit("offer", { from: user_id, to: current_friend.id, offer });
}
function send_answer_to_user(answer) {
    console.log("sent answer");
    socket.emit("answer", { from: user_id, to: current_friend.id, answer });
}
function notify_user_busy(to) {
    socket.emit("busy", { from: user_id, to: to, message: 'busy' })
}

function notify_user_call_ended() {
    socket.emit("end", { from: user_id, to: current_friend.id, message: 'end' })
}

function reject_video_call() {
    socket.emit("reject", { from: user_id, to: current_friend.id, message: 'reject' })
    close_incoming_call_modal();
}