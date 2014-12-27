var express = require('express');
var app = express();
var ExpressPeerServer = require('peer').ExpressPeerServer;


// constants

var port = 6677;

var peerOptions = {
    debug: false
};



// key handling

var _connectedKeys = [];

function getKeys() {
	return _connectedKeys;
}

function addKey(key) {
	_connectedKeys.push(key);
}

function delKey(key) {
	var idx = _connectedKeys.indexOf(key);
	if (idx === -1) {
		return false;
	}
	_connectedKeys.splice(idx, 1);
	return true;
}

function allButYou(key) {
	var keys = _connectedKeys.slice();
	var idx = keys.indexOf(key);
	if (idx === -1) {
		return keys; // should not happen
	}
	keys.splice(idx, 1);
	return keys;
}



// long polling

var _changeListeners = [];

var waitForChange = function(res) {
    _changeListeners.push(res);
};

var notifyOfChange = function(change) {
	console.log('change ocurred with %d listeners. notifying...', _changeListeners.length);
	_changeListeners.forEach(function(res) {
		try {
			res.send(change);
		} catch (ex) {}
	});
	_changeListeners = [];
};



// routes

//CORS middleware
var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	next();
};
app.use(allowCrossDomain);

app.get('/', function(req, res, next) {
	res.redirect('/demo.html');
});

app.get('/keys/connected', function(req, res, next) {
	res.send( getKeys() );
});

app.get('/keys/add/:key', function(req, res, next) {
	var key = req.params.key;
	addKey(key);
	console.log('-added id %s.', key);
	res.send(allButYou(key));
	notifyOfChange({action:'add', key:key});
});

app.get('/keys/del/:key', function(req, res, next) {
	var key = req.params.key;
	var res = delKey(key);
	console.log('-removed id %s (%s).', key, res);
	if (res) {
		notifyOfChange({action:'del', key:key});
	}
	try {
		res.send(res);
	} catch (ex) {}
});

app.get('/keys/polling', function(req, res, next) {
	waitForChange(res);
});

var server = app.listen(port);

app.use('/peer', ExpressPeerServer(server, peerOptions));

app.use(express.static(__dirname + '/'));



console.log('running on port %d...', port);
