require(['jquery', 'underscore', 'socket.io-aclient'], function($, _, io){
	var gameId,
			socket;

	$('button.connect').click(function(){
		gameId = $('input').val();
		
		if(!socket)
			socket = io.connect('http://192.168.0.5:3000');
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
					if(count == 5){
						var obj = {code: gameId, a: event.alpha, b: event.beta, c: event.gamma}
						socket.emit('dev-angles', obj);
						count = 0;					
					}
					count++;

				}
			});
		});
	});

	$('button.shoot').click(function(){
			socket.emit('shoot', {code: gameId});			
	})


	function showControls(){
		$('div.controls').show();
	}

})
