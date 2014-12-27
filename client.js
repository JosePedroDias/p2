function peer2(cfg) {
	'use strict';



	// http://peerjs.com/docs/#api




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



	var outboundConnections = {};

	var _otherKeys = [];

	var waitForOtherKeysChange = function(cb) {
		ajax({
			uri: '/keys/polling',
			cb: cb
		});
	};



	var peer = new Peer(undefined, {
		host: cfg.host || location.hostname, //'127.0.0.1',
		port: cfg.port || location.port, //6677,
		path: cfg.path || '/peer'
	});


	var keysChangeOccurred = function changeOccurred(err, res) {
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
		
		if (cfg.onKeysChangeOccurred) {
			cfg.onKeysChangeOccurred(_otherKeys, res.action, res.key);
		}
		waitForOtherKeysChange(keysChangeOccurred);
	};


	peer.on('open', function(id) {
		ajax({
			uri:'/keys/add/'+peer.id,
			cb: function(err, res) {
				if (err) { return console.error(err); }
				_otherKeys = res;
				//console.log('other keys: ' + _otherKeys.join(','));
				_otherKeys.forEach(function(key) {
					dial(key);
				});

				if (cfg.onKeysChangeOccurred) {
					cfg.onKeysChangeOccurred(_otherKeys);
				}
				waitForOtherKeysChange(keysChangeOccurred)
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
		console.log('error ' + err);
	});



	peer.on('connection', function(dataConn) {
		dataConn.on('error', function(err) { console.log('error ' + err); });
		//dataConn.on('open', function() { log('open'); });
		//dataConn.on('close', function() { log('close'); });
		
		dataConn.on('data', function(data) {
			if (cfg.onReceive) {
				cfg.onReceive(dataConn.peer, data);
			}
		});
	});



	var dial = function(key) {
		var o = {};
		if (cfg.label) {
			o.label = cfg.label;
		}
		var dataConn = peer.connect(key, o);
		outboundConnections[key] = dataConn;

		if (cfg.onDialDone) {
			cfg.onDialDone(key);
		}
	};



	var api = {
		_: peer,
		getMyId: function() {
			return peer.id;
		},
		getOtherKeys: function() {
			return _otherKeys;
		},
		reportBadKey: function(key) {
			ajax({
				uri:'/keys/del/' + key,
				cb: noop
			});
		},
		setLabel: function(label) {
			cfg.label = label;
		},
		send: function(key, content) {
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
		}
	};

	return api;
}