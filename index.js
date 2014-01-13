var express = require('express'),
		mustacheExpress = require('mustache-express'),
		device = require('express-device'),
		app = express(),
		server = require('http').createServer(app),
		io = require('socket.io').listen(server);

app.engine('mustache', mustacheExpress());

app.set('port', 3001);
app.set('view engine', 'mustache');
app.set('views', __dirname + '/app/views');

app.use(express.static(__dirname));
app.use(device.capture());

app.get('/', function(req, res, next){
	if(req.device.type == 'desktop')
  	res.render('index')
  else
  	res.render('mobile')
});

// Sockets and clients
var clients = {};

io.sockets.on('connection', function (socket) {
	socket.on('init', function(data, fn){ 
		var code;
		do {
			code = Math.floor(Math.random() * 10000);
		} while(clients[code] && clients[code]['status'] == 1);

		while(code.toString().length < 4){
			code = '0'+code;
		}

		clients[code] = {status: -1, desktop: socket};
		socket.set('code', code);
		socket.set('type', 'desktop');
		fn({code: code});
	})

  socket.on('register', function(data){
  	if(!(data.code && clients[data.code])) 
  		return;
  	
  	if(clients[data.code]['status'] == -1){
  		clients[data.code]['status'] = 1;
  		clients[data.code]['mobile'] = socket;
  	}

		socket.set('code', data.code);
		socket.set('type', 'mobile');
  	clients[data.code]['desktop'].emit('paired', {status: 1});
  	socket.emit('paired', {status: 1})
  });

  socket.on('dev-angles', function(data){
  	clients[data.code] && clients[data.code]['desktop'].emit('dev-angles', data);
  });

  socket.on('shoot', function(data){
  	clients[data.code] && clients[data.code]['desktop'].emit('shoot', data);
  });  

  socket.on('disconnect', function () {

    socket.get('code', function(err, code){ 
    	socket.get('type', function(err, type){
    		if(type == 'desktop'){
    			clients[code]['mobile'] && clients[code]['mobile'].emit('close', function(){
    				delete clients[code];
    				console.log(clients);
    			})

    		} else if(type == 'mobile'){
    			clients[code]['desktop'] && clients[code]['desktop'].emit('close', function(){
    				delete clients[code];
    				console.log(clients);    				
    			})
    		}
    	})
    })

  });


});

module.exports = server.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});