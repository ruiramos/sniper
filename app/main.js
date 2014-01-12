require(['jquery', 'underscore', 'socket.io-aclient', 'paper'], function($, _, io, paper){
	var socket = io.connect('http://localhost:3000'),
			gameId,
			ia, ib, ig, 
			iaAvg, ibAvg,
			dw = $(document).width(),
			dh = $(document).height(),
			multa = multb = 3.5,
			aim, aimDestination,
			circle1, circle2, circle3; // should actually depend on screen size
	
	var defaultColor = '#0000ff',
			activeColor = '#ff0000'

	init();

	drawCanvas();

	initSocket();

	// ------------------------------ init
	function init(){
		ia = [];
		ib = [];
		ig = [];
		$('div.status').text('disconnected');
	}

	// ------------------------------ Canvas / Drawing stuff
	function drawCanvas(){
		paper.setup('area');

		// cheating
		 circle1 = new paper.Shape.Circle({x: 100, y: 200}, 60)
		 circle2 = new paper.Shape.Circle({x: 1000, y: 150}, 70)
		 circle3 = new paper.Shape.Circle({x: 400, y: 700}, 80)
		circle1.style = {fillColor:'red', strokeColor: 'black', strokeWidth: 2};
		circle2.style = {fillColor:'green', strokeColor: 'black', strokeWidth: 2};
		circle3.style = {fillColor:'yellow', strokeColor: 'black', strokeWidth: 2};


		aim = new paper.Shape.Circle({x: dw/2, y: dh/2}, 4);		
		aim.style = { fillColor: defaultColor };	
		paper.view.draw();
	}

	function moveAim(x, y){ 
		if(!aimDestination)
			paper.view.attach('frame', onFrame);

		aimDestination = new paper.Point(x, y);
	}

	function setAimColor(color){
		aim.style = { fillColor: color };	
		paper.view.draw();
	}

	function onFrame(event) { console.log('onFrame')
		aim.position = aim.position.add(aimDestination.subtract(aim.position).divide(60 * 0.2)); // 0.2s!

		if(aimDestination.equals(aim.position)){
			paper.view.dettach('frame', onFrame);
			aimDestination = null;
		}

		paper.view.draw();		
	}	
	
	// ------------------------------ Socket / Connections
	function initSocket(){
		socket.on('connect', function () { 
			socket.emit('init', {}, function(data){
				gameId = data.code;

				$('h1 span').text(gameId);
			})
			socket.on('paired', function(data){
				$('div.status').text('calibrating')
			})
			socket.on('dev-angles', function(data){ console.log('dev-angles data')
				data.a = (data.a > 180) ? data.a - 360 : data.a;
			
				if(ia.length < 4){	
					ia.push(data.a);
					ib.push(data.b);
					ig.push(data.g); 
					return;				

				} else if(ia.length == 4 && !iaAvg){
					ia.splice(0,2);
					iaAvg = _.reduce(ia, function(memo, num){ return memo + num}, 0);
					iaAvg /= ia.length;

					ib.splice(0,2);				
					ibAvg = _.reduce(ib, function(memo, num){ return memo + num}, 0);
					ibAvg /= ib.length;				

					$('div.status').text('connected')
					setAimColor(activeColor);

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

				moveAim(0,0);
				ia = [];
				ib = [];
				ig = [];
				iaAvg = ibAvg = null;

				socket.emit('init', {}, function(data){
					gameId = data.code;
					$('h1 span').text(gameId);
				});			
			});
		});
	}

	function shoot(){
		if(circle1.hitTest(aim.position)){
			circle1.remove()
		}
		if(circle2.hitTest(aim.position)){
			circle2.remove()
		}
		if(circle3.hitTest(aim.position)){
			circle3.remove()
		}
	}

	// ------------------------------ Utils
	function ensureBetween(value, min, max){
		return (value > max) ? max :
							(value < min) ? min : value;
	}

})