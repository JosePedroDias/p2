'use strict';

var qs = function(sel) {
	return document.querySelector(sel);
};

var noop = function() {};

var hms = function() {
	var d = new Date();
	return d.toISOString().split('T')[1].split('.')[0];
};

var getT = function() {
	return (new Date()).valueOf();
};

var log = function(m, parentEl, className) {
	if (!parentEl) { parentEl = document.body; }
	var el = document.createElement('div');
	if (className) {
		el.className = className;
	}
	el.appendChild( document.createTextNode( hms() + ' ' + m) );
	parentEl.appendChild(el);
};



var messagesEl    = qs('#messages');
var destinationEl = qs('#destination');
var contentEl     = qs('#content');



var p2 = peer2({
	onKeysChangeOccurred: function(otherKeys, action, key) {
		//log('onKeysChangeOccurred: ' + otherKeys, messagesEl, 'log');
	},
	onDialDone: function(key) {
		//log('onDialDone ' + key);
		var optionEl = document.createElement('option');
		optionEl.appendChild( document.createTextNode(key) );
		optionEl.value = key;
		destinationEl.appendChild(optionEl);
	},
	onReceive: function(key, content) {
		log('← ' + key + ' : ' + content, messagesEl, 'in');
		if (content === 'ping') {
			send(key, 'pong');
		}
		else if (content === 'pong') {
			var v = pendingPongs[key];
			if (v) {
				var t = getT();
				var dt = t - v.t0;
				log('ping to ' + key + ' took ' + dt + 'ms.', messagesEl, 'log');
				clearTimeout(v.timer);
				delete pendingPongs[key];
			}
		}
	}
});



var send = function(key, content) {
	log('→ ' + (key || 'ALL') + ' : ' + content, messagesEl, 'out');
	p2.send(key, content);
};



var maxPingWait = 5000;
var pendingPongs = {};
var onPongExpired = function() {
	log('ping to ' + this.key + ' failed.', messagesEl, 'log');
	delete pendingPongs[this.key];
};

var ping = function(key) {
	var o = {
		key: key,
		t0:  getT()
	};
	o.timer = setTimeout(onPongExpired.bind(o), maxPingWait);
	pendingPongs[key] = o;
	send(key, 'ping');
};



contentEl.addEventListener('keydown', function(ev) {
	if (ev.keyCode !== 13) { return; }
	var key = destinationEl.value;
	var content = contentEl.value;
	send(key, content);
	contentEl.value = '';
});
