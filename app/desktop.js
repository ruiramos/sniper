require(['jquery', 'underscore', 'socket.io-aclient', 'paper', 'bower-facebook'], function($, _, io, paper, FB){

	if(window.location.hostname == 'localhost'){
		var host = 'http://localhost:3001';
	} else {
		var host = 'http://ruiramos.com:3001';
	}

	var socket = io.connect(host),
			gameId,
			ia, ib, ig, 
			iaAvg, ibAvg,
			dw = $(document).width(),
			dh = $(document).height(),
			multa = multb = 3.5, // should actually depend on screen size
			aim, aimDestination,
			enemies = [], 
			angle = 0, 
			slide = 0,
			wave = 0,
			waveColors = ['green', 'blue', 'yellow', 'red'],
			middle = new paper.Point(dw/2, dh/2), 
			player;
	
	var defaultColor = '#0000ff',
			activeColor = '#ff0000'

	init();
	initSocket();

	// ------------------------------ init
	function init(){
		ia = [];
		ib = [];
		ig = [];
		$('div.status').text('disconnected');

		initFB();

		$('.connect .fb-button button').click(function(){
			FB.login(function(res){
				nextSlide();
			});
		})
		$('.connect .skip-button button').click(function(){
			nextSlide();
		})

		$(this).on('newSlide', function(){
			if(slide == 1){
				initSocket();

				nextSlide();
				drawPlayerCircle();

			} else if(slide == 2){
				$('.intro-box').fadeOut();
				drawCanvas();
				setInterval(function(){ nextWave()}, 10000);	

				nextWave();		
			}
		})
	}

	function initFB(){
		window.fbAsyncInit = function() {
		  FB.init({
		    appId      : '1375930892662310',
		    status     : true, // check login status
		    cookie     : true, // enable cookies to allow the server to access the session
		    xfbml      : true  // parse XFBML
		  })		
		}

		FB.Event.subscribe('auth.authResponseChange', function(response) {
			if (response.status === 'connected') {
				/* make the API call */
				FB.api(
				    '/me/picture',
				    {
				        'redirect': false,
				        width: '150',
				        height: '150'
				    },
				    function (response) {
				      if (response && !response.error) {
				        $('.fb-pic').css('background', 'url('+ response.data.url +') scroll no-repeat 0 0');
				        // if(slide == 0) nextSlide();
				      }
				    }
				);				
			}
		});
	}

	function nextSlide(){
		slide++;
		$('.intro-container').css('margin-left', -slide * $('.intro-box').outerWidth() - 20);
		$(this).trigger('newSlide');
	}

	// ------------------------------ Canvas / Drawing stuff
	function drawCanvas(){
		paper.setup('area');

		// cheating
		// circle1 = new paper.Shape.Circle({x: 100, y: 200}, 60)
		// circle2 = new paper.Shape.Circle({x: 1000, y: 150}, 70)
		// circle3 = new paper.Shape.Circle({x: 400, y: 570}, 80)

		// circle1.style = {fillColor:'white', strokeColor: 'black', strokeWidth: 2};
		// circle2.style = {fillColor:'green', strokeColor: 'black', strokeWidth: 2};
		// circle3.style = {fillColor:'yellow', strokeColor: 'black', strokeWidth: 2};

		// circles = [circle1, circle2, circle3];

		aim = new paper.Shape.Circle({x: dw/2, y: dh/2}, 4);		
		aim.style = { fillColor: defaultColor };	
		
		paper.view.attach('frame', onFrame);

		paper.view.draw();
	}

	function moveAim(x, y){ 
		aimDestination = new paper.Point(x, y);
	}

	function setAimColor(color){
		aim.style = { fillColor: color };	
		paper.view.draw();
	}

	function drawPlayerCircle() {
		player = new paper.Shape.Circle({x: dw/2, y: dh/2}, 100)
		player.style = {fillColor:'gray', strokeColor: 'black', strokeWidth: 1};
	}

	function onFrame(event) { 
		if(aimDestination)
			aim.position = aim.position.add(aimDestination.subtract(aim.position).divide(60 * 0.3)); // 0.2s!

		if(aimDestination && aimDestination.equals(aim.position)){
			aimDestination = null;
		}

		_.each(enemies, function(obj){
			var enemy = obj.enemy;
			enemy.position = enemy.position.add(
				middle.subtract(obj.startPosition).divide(-100 * obj.wave + 900)
			);

			if(enemy.hitTest(player.position)){
				removeEnemy(enemy);
			}			
		})


		paper.view.draw();		
	}	
	
	// ------------------------------ Socket / Connections
	function initSocket(){
		socket.on('connect', function () { 
			socket.emit('init', {}, function(data){
				gameId = data.code;
				$('.code').text(gameId);
			})
			socket.on('paired', function(data){
				nextSlide();
			})
			socket.on('dev-angles', function(data){ 
				data.a = (data.a > 180) ? data.a - 360 : data.a;
			
				if(ia.length < 6){	
					ia.push(data.a);
					ib.push(data.b);
					ig.push(data.g); 
					return;				

				} else if(ia.length == 6 && !iaAvg){
					ia.splice(0,3);
					iaAvg = _.reduce(ia, function(memo, num){ return memo + num}, 0);
					iaAvg /= ia.length;

					ib.splice(0,3);				
					ibAvg = _.reduce(ib, function(memo, num){ return memo + num}, 0);
					ibAvg /= ib.length;				

					$('div.status').text('connected')
					setAimColor(activeColor);
					
					drawPlayerCircle();
					nextWave();
					$('.fb-pic').show();
				}

				var difa = ensureBetween((iaAvg - data.a) * multa, -90, 90);
				var difb = ensureBetween((ibAvg - data.b) * multb, -90, 90);

				var atrans = Math.sin(difa * (Math.PI / 180)) * (dw/2) + (dw/2);
				var btrans = Math.sin(difb * (Math.PI / 180)) * (dh/2) + (dh/2);
				var gtrans = 0;

				moveAim(atrans, btrans);
			 });

			socket.on('shoot', function(){
				shoot();
			});

			socket.on('close', function(data){
				$('div.status').text('disconnected');
				setAimColor(defaultColor);

				moveAim(dw/2, dh/2);
				ia = [];
				ib = [];
				ig = [];
				iaAvg = ibAvg = null;

				socket.emit('init', {}, function(data){
					gameId = data.code;
					$('.code').text(gameId);
				});			
			});
		});
	}

	// ------------------------------ Game Play

	function nextWave(){
		wave++;

		$('.big-message').text('Wave '+wave).fadeIn();
		setTimeout(function(){ $('.big-message').fadeOut(); }, 2500);

		for(var i = 0; i < wave + Math.round(wave * 3/2); i++){
			var r = Math.round((-4.5 * wave + 90) * (Math.random() / 2 + 0.75));
			
			if(Math.round(Math.random())){
				var xPos = Math.round(Math.random()) * dw;
				(xPos > 0) ? xPos += r + Math.random()*2*r : xPos -= r + Math.random()*2*r;

				var yPos = Math.round(Math.random() * dh);
			} else {
				var xPos = Math.round(Math.random() * dw);

				var yPos = Math.round(Math.random()) * dh;
				(yPos > 0) ? yPos += r + Math.random()*2*r : yPos -= r + Math.random()*2*r;				
			}
			
			var enemy = new paper.Shape.Circle({x: xPos, y: yPos}, r);

			enemy.style = {fillColor: waveColors[wave-1], strokeColor: 'black', strokeWidth: 2};
			
			enemies.push({enemy: enemy, wave: wave, startPosition: new paper.Point(xPos, yPos)});			
		}

	}

	function shoot(){
		_.each(enemies, function(obj, i){
			var enemy = obj.e;
			if(enemy.hitTest(aim.position)){
				removeEnemy(enemy, i);
			}
		})
	}

	function removeEnemy(enemy, i){
		enemy.remove();
		if(i) {
			enemies.splice(i, 1);
		} else {
			for(var i=0; i<enemies.length;i++){
				if(enemies[i] == enemy){
					enemies.splice(i, 1);
					return;
				}
			}
		}
	}

	// ------------------------------ Utils
	function ensureBetween(value, min, max){
		return Math.max(Math.min(max, value), min);
	}

})