function peer2(cfg) {
	'use strict';

	var outboundConnections = {};

	var _otherKeys = [];

	var waitForOtherKeysChange = function(cb) {
		ajax({
			uri: '/keys/polling',
			cb: cb
		});
	};



	//var peer = new Peer({key:'i5sd6pb4xfnd0a4i'});
	var peer = new Peer(undefined, {
		host: cfg.host || '127.0.0.1',
		port: cfg.port || 6677,
		path: cfg.path || '/peer'
	});


	var changeOccurred = function changeOccurred(err, res) {
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
		
		if (cfg.onChangeOccurred) {
			cfg.onChangeOccurred(_otherKeys, res.action, res.key);
		}
		waitForOtherKeysChange(changeOccurred);
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

				if (cfg.onChangeOccurred) {
					cfg.onChangeOccurred(_otherKeys);
				}
				waitForOtherKeysChange(changeOccurred)
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
		var dataConn = peer.connect(key);
		outboundConnections[key] = dataConn;

		if (cfg.onDialDone) {
			cfg.onDialDone(key);
		}
	};



	var api = {
		getMyId: function() {
			return peer.id;
		},
		getOtherKeys: function() {
			return _otherKeys;
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