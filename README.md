work in progress

p2 is a peer server with roster support.  
It uses [peerjs](http://peerjs.com/) ([client](https://github.com/peers/peerjs) and [server](https://github.com/peers/peerjs-server)) for
WEBRTC data magic and [expressjs](http://expressjs.com/4x/api.html) to host files and expose roster methods.

It provides a way of finding other WEBRTC data nodes.  
Could be used for network gaming, chat, media transfer....



To see it in use:

* git clone it
* `npm install`
* `node server.js`
* browse to http://127.0.0.1:6677 with WEBRTC enabled browser (chrome and firefox)



The demo is a simple chat program.  
You can send direct messages or shout to ALL.  
Double-clicking a destination does a ping request.  
Supports `/rename alias` to you appear with a friendler name

Note: The files `peer.js` and `peer.min.js` are here so express serves them locally. This is optional.




TODO:

* chat example
	* add history binding à là irc
	* better-looking?

* create a simple game:
	pong for two?
	space war?
