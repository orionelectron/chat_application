const config = {
    iceServers: [{ urls: "stun:stun.mystunserver.tld" }]
}

let makingOffer = false;
let ignoreOffer = false;

const signaler = new Signallingchannel();
const pc = new RTCPeerConnection(config);

const constraints = { audio: true, video: true };
const selfVideo = document.querySelector("video.selfview");
const remoteVideo = document.querySelector("video.remoteview");

async function start() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        for (const track of stream.getTracks()) {
            pc.addTrack(track, stream);
        }
        selfVideo.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}

pc.ontrack = ({ track, streams }) => {
    track.onunmute = () => {
        if (remoteVideo.srcObject) {
            return;
        }
        remoteVideo.srcObject = streams[0];
    };
};



pc.onnegotiationneeded = async () => {
    try {
        makingOffer = true;
        await pc.setLocalDescription();
        signaler.send({ description: pc.localDescription });
    } catch (err) {
        console.error(err);
    } finally {
        makingOffer = false;
    }
};

pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });
pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === "failed") {
        pc.restartIce();
    }
};


signaler.onmessage = async ({ data: { description, candidate } }) => {
    try {
        if (description) {
            const offerCollision =
                description.type === "offer" &&
                (makingOffer || pc.signalingState !== "stable");

            ignoreOffer = !polite && offerCollision;
            if (ignoreOffer) {
                return;
            }

            await pc.setRemoteDescription(description);
            if (description.type === "offer") {
                await pc.setLocalDescription();
                signaler.send({ description: pc.localDescription });
            }
        } else if (candidate) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (err) {
                if (!ignoreOffer) {
                    throw err;
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
};



