require(['jquery', 'underscore', 'socket.io-aclient', 'fastclick'], function($, _, io, FastClick){
	var gameId,
			socket;

	$(function() {		
    FastClick.attach(document.body);
	});

	if(window.location.hostname == 'ruiramos.com'){
		var host = 'http://ruiramos.com:3001';
	} else {
		var host = 'http://192.168.0.5:3001';
	}	

	$('button.connect').click(function(){
		gameId = $('input').val();
		
		if(!socket)
			socket = io.connect(host);
		else
			socket.emit('register', {type: 'mobile', code: gameId});			

		socket.on('connect', function(){
			socket.emit('register', {type: 'mobile', code: gameId});
			socket.on('close', function(data){
				$('div.status').text('disconnected');
				window.ondeviceorientation = null;
			});	

			socket.on('paired', function () {
				$('div.status').text('paired');

				showControls();

				var count = 0;
				window.ondeviceorientation = function(event) {
					if(count == 4){
						var obj = {code: gameId, a: event.alpha, b: event.beta, c: event.gamma}
						socket.emit('dev-angles', obj);
						count = 0;					
					}
					count++;

				}
			});
		});
	});

	$('.shoot').click(function(){
			socket.emit('shoot', {code: gameId});			
	})


	function showControls(){
		$('div.controls').show();
	}

})
