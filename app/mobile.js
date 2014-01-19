require(['jquery', 'underscore', 'socket.io-aclient', 'fastclick'], function($, _, io, FastClick){
	var gameId,
			socket;

	$(function() {
    FastClick.attach(document.body);
	});

	if(window.location.hostname == 'ruiramos.com'){
		var host = 'http://ruiramos.com:3001';
	} else {
		// var host = 'http://192.168.0.5:3001';
	}

	$('div.status').text('disconnected');

	$('button.connect').click(function(){
		gameId = $('input').val();

		if(!socket)
			socket = io.connect();
		else
			socket.emit('register', {type: 'mobile', code: gameId});

		socket.on('connect', function(){
			socket.emit('register', {type: 'mobile', code: gameId});

			socket.on('paired', function () {
				$('div.status').text('aim at blue dot and press calibrate');

				showCalibrate();

			});

			socket.on('start-game', function () {
				showShoot();

				var count = 3;
				window.ondeviceorientation = function(event) {
					if(count == 3){
						var obj = {code: gameId, a: event.alpha, b: event.beta, c: event.gamma}
						socket.emit('dev-angles', obj);
						count = 0;
					}
					count++;

				}
			});

			socket.on('close', function(data){
				$('div.status').text('disconnected');
				$('div.controls button').hide();
				window.ondeviceorientation = null;
			});

		});
	});

	$('.shoot').click(function(){
			socket.emit('shoot', {code: gameId});
	})

	$('.calibrate').click(function(){
			$('div.status').text('calibrating');
			socket.emit('calibrate', {code: gameId});
	})


	function showCalibrate(){
		$('div.controls button.calibrate').show();
	}

	function showShoot(){
		$('div.status').text('go!');
		$('div.controls button.calibrate').hide();
		$('div.controls button.shoot').show();
	}

})
