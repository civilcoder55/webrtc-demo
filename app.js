const express = require("express");
const http = require("http");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);


app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "./public/index.html");
});

let connectedPeers = [];
let ices = {}
function signal(socket, name, data) {
  if (connectedPeers.find(connectedPeerSocketId => connectedPeerSocketId == data.receiver)) {
    data.sender = socket.id
    io.to(data.receiver).emit(name, data);
  }
}

io.on("connection", (socket) => {
  connectedPeers.push(socket.id);
  io.emit('connectedPeers', connectedPeers);

  socket.on("pre-offer", (data) => {
    signal(socket, 'incoming-pre-offer', data)
  });

  socket.on("accept", (data) => {
    signal(socket, 'incoming-acceptance', data)
  });

  socket.on("decline", (data) => {
    signal(socket, 'incoming-decline', data)
  });

  socket.on("busy", (data) => {
    signal(socket, 'incoming-busy', data)
  });

  socket.on("offer", (data) => {
    signal(socket, 'incoming-offer', data)
  });

  socket.on("answer", (data) => {
    signal(socket, 'incoming-answer', data)
  });


  socket.on("store-ice", (data) => {
    if(ices[socket.id]){
      ices[socket.id].push(data.ice)
    }else{
      ices[socket.id] = [data.ice]
    }
  });


  socket.on("get-ices", (data) => {
    if(ices[data.belong]){
      var ice_candidates = ices[data.belong]
    }else{
      var ice_candidates = null
    }
    io.to(socket.id).emit('incoming-ice', ice_candidates);
    delete ices[data.belong]
  });


  socket.on("disconnect", () => {
    connectedPeers = connectedPeers.filter(connectedPeerSocketId => connectedPeerSocketId !== socket.id);
    delete ices[socket.id]
    io.emit('connectedPeers', connectedPeers);
  });
})

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
