// HTML elements
const alertArea = document.getElementById('alert');
const localVideo = document.getElementById('localVideo');
const onlineUsersList = document.querySelector('#onlineUsersList');
const micImage = document.getElementById("mic_image")
const buttonsCon = document.getElementById("buttons_container")


export const updateMicButton = (micState) => {
  micImage.src = micState ? "./images/micOff.png" : "./images/mic.png";
};

export const hangUp = () => {
  localVideo.classList.remove('transition')
  buttonsCon.hidden = true
  alertArea.className = ''
  alertArea.innerHTML = ''
}


export const incall = () => {
  localVideo.classList.add('transition')
  buttonsCon.hidden = false
  alertArea.className = 'success'
  alertArea.innerHTML = `In call <button class="btn btn-danger" onclick='hangUp()'>Hang up</button>`
}

export const busy = () => {
  alert('you are in a call , hangup first')
}


export const calleBusy = () => {
  alertArea.className = 'danger'
  alertArea.innerHTML = `Callee is busy now , try again later`
}

export const renderOnlineSockets = (socketsIds, currentSocketId) => {
  onlineUsersList.innerHTML = ''
  onlineUsersList.insertAdjacentHTML('beforeend', `
      <li>
        You
      </li>`)

  socketsIds.forEach(socketId => {
    if (socketId != currentSocketId) {
      onlineUsersList.insertAdjacentHTML('beforeend', `
          <li>
            ${socketId}
            <button class="btn btn-info" onclick='createPreOffer("${socketId}")'>call</button>
          </li>
          `)
    }
  })
}

export const incomingcall = (from) => {
  alertArea.className = 'warning'
  alertArea.innerHTML = `Incoming Call from ${from} <button class="btn btn-custom" onclick='createAcceptance("${from}")'><img src='./images/accept.png'></img></button>
  <button class="btn btn-custom" onclick='createDecline("${from}")'><img src='./images/decline.png'></img></button>
  `
}

export const decline = () => {
  alertArea.className = 'danger'
  alertArea.innerHTML = `Call declined`

}


export const mediaError = () => {
  alertArea.className = 'danger'
  alertArea.innerHTML = `Can't start camera or mic , make sure you connect them`
}


export const calling = (socketId) => {
  alertArea.className = 'warning'
  alertArea.innerHTML = `Calling ${socketId} <button class="btn btn-danger" onclick='hangUp()'>Hang up</button>`
}