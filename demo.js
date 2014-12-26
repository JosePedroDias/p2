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


var outboundConnections = {};

var _otherKeys = [];

var waitForOtherKeysChange = function(cb) {
	ajax({
		uri: '/keys/polling',
		cb: cb
	});
};



//var peer = new Peer({key:'i5sd6pb4xfnd0a4i'});
var peer = new Peer(undefined, {host:'127.0.0.1', port:6677, path: '/peer'});


var changeOcurred = function changeOcurred(err, res) {
	if (err) { return console.error(err); }
	if (res.action === 'add') {
		_otherKeys.push(res.key);
		dial(res.key);
	}
	else if (res.action === 'del') {
		var idx = _otherKeys.indexOf(res.key);
		if (idx !== -1) {
			_otherKeys.splice(idx, 1);
				
		}
		_otherKeys.push(res.key);
	}
	console.log('other keys: ' + _otherKeys.join(','));
	waitForOtherKeysChange(changeOcurred);
};

peer.on('open', function(id) {
	console.log('my id is: ' + peer.id);

	ajax({
		uri:'/keys/add/'+peer.id,
		cb: function(err, res) {
			if (err) { return console.error(err); }
			_otherKeys = res;
			console.log('other keys: ' + _otherKeys.join(','));
			_otherKeys.forEach(function(key) {
				dial(key);
			});
			waitForOtherKeysChange(changeOcurred)
		}
	});
	
	window.addEventListener('beforeunload', function() {
		ajax({
			uri:'/keys/del/'+peer.id,
			cb: noop
		});
	});
});

peer.on('error', function(err) {
	log('error ' + err);
});

var inEl = document.createElement('div');
document.body.appendChild(inEl);



peer.on('connection', function(dataConn) {
	dataConn.on('error', function(err) { log('error ' + err); });
	//dataConn.on('open', function() { log('open'); });
	//dataConn.on('close', function() { log('close'); });
	
	log('** inbound connection from ' + dataConn.peer + ' **', messagesEl);
	
	dataConn.on('data', function(data) {
		log('<- ' + dataConn.peer + ' : ' + data, messagesEl);
	});
});

var dial = function(key) {
	var dataConn = peer.connect(key);
	var optionEl = document.createElement('option');
	optionEl.appendChild( document.createTextNode(key) );
	optionEl.value = key;
	destinationEl.appendChild(optionEl);
	outboundConnections[key] = dataConn;
};

var send = function(key, content) {
	log('-> ' + key + ' : ' + content, messagesEl);
	var dataConn;
	if (key === '') {
		var v;
		for (var k in outboundConnections) {
			dataConn = outboundConnections[k];
			dataConn.send(content);
		}
		return;
	}
	dataConn = outboundConnections[key];
	dataConn.send(content);
};

contentEl.addEventListener('keydown', function(ev) {
	if (ev.keyCode !== 13) { return; }
	var key = destinationEl.value;
	var content = contentEl.value;
	send(key, content);
	contentEl.value = '';
});

