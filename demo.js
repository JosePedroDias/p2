'use strict';

var qs = function(sel) {
	return document.querySelector(sel);
};

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

var aliases = {};



var p2 = peer2({
	//label: prompt('name?', ''),
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
		var name = aliases[key] || key;
		log('← ' + name + ' : ' + content, messagesEl, 'in');
		if (content === '/ping') {
			send(key, '/pong');
		}
		else if (content === '/pong') {
			var v = pendingPongs[key];
			if (v) {
				var t = getT();
				var dt = t - v.t0;
				log('ping to ' + name + ' took ' + dt + 'ms.', messagesEl, 'log');
				clearTimeout(v.timer);
				delete pendingPongs[key];
			}
		}
		else if (content.indexOf('/rename ') === 0) {
			name = content.split(' ')[1];
			rename(key, name);
		}
	}
});



var send = function(key, content) {
	var name = aliases[key] || key;
	name = name || 'ALL';
	log('→ ' + name + ' : ' + content, messagesEl, 'out');
	p2.send(key, content);
};



var maxPingWait = 5000;
var pendingPongs = {};
var onPongExpired = function() {
	var name = aliases[this.key] || this.key;
	log('ping to ' + name + ' failed.', messagesEl, 'log');
	delete pendingPongs[this.key];
	kill(this.key);
};

var ping = function(key) {
	var o = {
		key: key,
		t0:  getT()
	};
	o.timer = setTimeout(onPongExpired.bind(o), maxPingWait);
	pendingPongs[key] = o;
	send(key, '/ping');
};

var rename = function(key, name) {
	var optionEl = destinationEl.querySelector('[value="' + key + '"]');
	aliases[key] = name;
	optionEl.innerHTML = name;
};

var kill = function(key) {
	var optionEl = destinationEl.querySelector('[value="' + key + '"]');
	destinationEl.removeChild(optionEl);
	delete aliases[key];
	p2.reportBadKey(key);
};

destinationEl.addEventListener('dblclick', function(ev) {
	var optionEl = ev.target;
	var key = optionEl.value;
	ping(key);
});



contentEl.addEventListener('keydown', function(ev) {
	if (ev.keyCode !== 13) { return; }
	var key = destinationEl.value;
	var content = contentEl.value;
	send(key, content);
	contentEl.value = '';
});
