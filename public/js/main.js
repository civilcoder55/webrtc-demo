import * as ui from "./ui.js";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun.ekiga.net", "stun:stun.l.google.com:19302"],
    },
  ],
};



// Global State
const socket = io("/");
let PeerConnection = null;
let localStream = null;
let remoteStream = null;
let busy = false;

//Check camera and mic 
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream
    remoteStream = new MediaStream();
    document.getElementById('localVideo').srcObject = localStream;
    document.getElementById('remoteVideo').srcObject = remoteStream
    document.getElementById("mic_button").addEventListener("click", () => {
      const micState = localStream.getAudioTracks()[0].enabled;
      localStream.getAudioTracks()[0].enabled = !micState;
      ui.updateMicButton(micState);
    });
  })
  .catch(error => {
    ui.mediaError()
  })
//-------------------------------------------------------------------------------------------
socket.on("connectedPeers", (data) => {
  ui.renderOnlineSockets(data, socket.id)
});
//-------------------------------------------------------------------------------------------
const createPeerConnection = () => {
  PeerConnection = new RTCPeerConnection(configuration);
  // Push tracks from local stream to peer connection
  window.pc = PeerConnection
  localStream.getTracks().forEach((track) => {
    PeerConnection.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  PeerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  PeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // socket.emit('ice', {
      //   ice: event.candidate.toJSON(),
      //   receiver: socketId
      // })
      socket.emit('store-ice', {
        ice: event.candidate
      })
    }
  };

  PeerConnection.onconnectionstatechange = (event) => {
    console.log(event.target.connectionState)
    if (event.target.connectionState === "closed" || event.target.connectionState === "disconnected") {
      window.hangUp()
    }
    if (event.target.connectionState === "connected") {
      busy = true
      ui.incall()
    }
  };


}





socket.on('incoming-ice', async (data) => {
  console.log('incoming-ices' , data)
  if (PeerConnection && data) {
    data.forEach(async(ice) => {
      await PeerConnection.addIceCandidate(new RTCIceCandidate(ice));
    })
  }
})

//-------------------------------------------------------------------------------------------
// As caller 

window.createPreOffer = async (socketId) => {
  if (busy) {
    ui.busy()
  } else {
    console.log('pre-offer', socketId)
    ui.calling(socketId)
    socket.emit('pre-offer', {
      receiver: socketId
    })
  }
}

socket.on('incoming-acceptance', async (data) => {
  console.log('incoming-acceptance', data)
  createPeerConnection()
  createOffer(data.sender)
})

socket.on('incoming-decline', (data) => {
  console.log('incoming-decline', data)
  ui.decline()
})

socket.on('incoming-busy', data => {
  console.log('incoming-busy', data)
  ui.calleBusy()
})

const createOffer = async (socketId) => {
  if (PeerConnection) {
    console.log('offer', socketId)
    const offerDescription = await PeerConnection.createOffer();
    await PeerConnection.setLocalDescription(offerDescription);
    socket.emit('offer', {
      offer: offerDescription,
      receiver: socketId
    })
    
    
  }
};


socket.on('incoming-answer', async (data) => {
  console.log('incoming-answer', data)
  await PeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

  socket.emit('get-ices', {
    belong: data.sender
  })


})






//-------------------------------------------------------------------------------------------

// As Callee

socket.on('incoming-pre-offer', async (data) => {
  if (busy) {
    console.log('busy')
    socket.emit('busy', {
      receiver: data.sender
    })
  } else {
    console.log('incoming-pre-offer', data)
    ui.incomingcall(data.sender)
  }
})



window.createAcceptance = async (socketId) => {
  console.log('accept', socketId)
  createPeerConnection()
  socket.emit('accept', {
    receiver: socketId
  })
}

window.createDecline = async (socketId) => {
  console.log('decline', socketId)
  ui.hangUp()
  socket.emit('decline', {
    receiver: socketId
  })
}


socket.on('incoming-offer', async (data) => {
  console.log('incoming-offer', data)
  createAnswer(data)
})

const createAnswer = async (data) => {
  console.log('answer', data.sender)
  await PeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answerDescription = await PeerConnection.createAnswer();
  await PeerConnection.setLocalDescription(answerDescription);

  socket.emit('get-ices', {
    belong: data.sender
  })

  socket.emit('answer', {
    answer: answerDescription,
    receiver: data.sender
  })
}




//-------------------------------------------------------------------------------------------



window.hangUp = () => {
  console.log('hanged up')
  if (PeerConnection) {
    PeerConnection.close();
  }
  PeerConnection = null;
  busy = false
  ui.hangUp()
}
