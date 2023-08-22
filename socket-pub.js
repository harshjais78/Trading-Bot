import io from 'socket.io-client';

const socketEndpoint = "https://stream.coindcx.com";

const socket = io.connect(socketEndpoint, {
  transports: ['websocket'],
  origin: '*',
});


//Listen update on channelName
socket.on('eventName', (response) => {
  console.log(response.data);
});

socket.connect();

// client-side
socket.on("connect", () => {
  console.log(socket.id,'coindcx'); // x8WIv7-mJelg7on_ALbx
  //Join Channel
  socket.emit('join', {
    'channelName': "I-SHIB_INR",
  });
});

socket.on("depth-update", (response) => {
    console.log(response.data);
  });
// leave a channel
socket.emit('leave', {
  'channelName': "channelName"
});

 