'use strict';

var qs = function(sel) {
	return document.querySelector(sel);
};

var noop = function() {};

var ajax = function(o) {
	if (!o.cb) { o.cb = noop; }
	var xhr = new XMLHttpRequest();
	xhr.open('GET', o.uri, true);
	var cbInner = function() {
		if (xhr.readyState === 4 && xhr.status > 199 && xhr.status < 300) {
			return o.cb(null, JSON.parse(xhr.response));
		}
		o.cb('error requesting ' + o.uri);
	};
	xhr.onload  = cbInner;
	xhr.onerror = cbInner;
	xhr.send(o.payload || null);
};

var hms = function() {
	var d = new Date();
	return d.toISOString().split('T')[1].split('.')[0];
};

var log = function(m, parentEl) {
	if (!parentEl) { parentEl = document.body; }
	var el = document.createElement('div');
	el.appendChild( document.createTextNode( hms() + ' ' + m) );
	parentEl.appendChild(el);
};



var messagesEl    = qs('#messages');
var destinationEl = qs('#destination');
var contentEl     = qs('#content');



var p2 = peer2({
	onChangeOccurred: function(otherKeys, action, key) {
		log('onChangeOccurred ' + otherKeys);
	},
	onDialDone: function(key) {
		log('onDialDone ' + key);
		var optionEl = document.createElement('option');
		optionEl.appendChild( document.createTextNode(key) );
		optionEl.value = key;
		destinationEl.appendChild(optionEl);
	},
	onReceive: function(key, content) {
		log('<- ' + key + ' : ' + content, messagesEl);
	}
});



contentEl.addEventListener('keydown', function(ev) {
	if (ev.keyCode !== 13) { return; }
	var key = destinationEl.value;
	var content = contentEl.value;
	log('-> ' + (key || 'ALL') + ' : ' + content, messagesEl);
	p2.send(key, content);
	contentEl.value = '';
});

