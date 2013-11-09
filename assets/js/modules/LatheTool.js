(function() {
	window.LatheTool = function(params) {
		var opts = $.extend({
				numSides: 4
			}, params),
			$module = opts.instance || null,
			container,
			camera, scene, renderer,
			group, mesh,
			targetRotation = 0,
			targetRotationOnMouseDown = 0,
			targetYRotation = 0,
			targetYRotationOnMouseDown = 0,
			mouseX = 0,
			mouseXOnMouseDown = 0,
			mouseY = 0,
			mouseYOnMouseDown = 0,
			windowHalfX = window.innerWidth / 2,
			windowHalfY = window.innerHeight / 2;

		function init() {
			if( $module !== null ) {
				container = $module.get(0);

				camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.set( 0, 0, 500 );

				scene = new THREE.Scene();

				var light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 0, 0, 1 );
				scene.add( light );

				group = new THREE.Object3D();
				resetModelPosition();
				group.rotation.x = -1.57;
				scene.add( group );

				//////////////
				var squareShape = new THREE.Shape();

				squareShape.moveTo( 0, 100 );
				// squareShape.quadraticCurveTo( -300, 20, -100, 0);
				// .arc ( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) 
				squareShape.arc(0, 0, 25, 1.57079633, 4.71238898, false);
				squareShape.moveTo( 0, 85 );
				squareShape.lineTo( -35, 70 );
				squareShape.lineTo( -15, 60 );
				squareShape.lineTo( -15, 0 );
				squareShape.quadraticCurveTo( -30, -10, -10, -10);
				squareShape.quadraticCurveTo( -40, 0, -40, -20);
				squareShape.quadraticCurveTo( -50, -20, -45, -30);

				squareShape.lineTo( 0, -30 );
				squareShape.moveTo( 0, -30 );

				var heartPoints = squareShape.extractPoints().shape,
					pts = [];

					console.log("heartPoints: ", heartPoints);

				for(var i=0; i<heartPoints.length; i++) {
					pts.push(new THREE.Vector3(heartPoints[i].x, 0, heartPoints[i].y));
				}

				var lathe = new THREE.LatheGeometry( pts, opts.numSides),	
					latheMaterial = new THREE.MeshBasicMaterial( { color: 0x00aedb, wireframe: true, transparent: true });

				mesh = new THREE.Mesh( lathe, latheMaterial);

				// mesh.position.y = 0;
				mesh.overdraw = true;
				mesh.doubleSided = true;



				group.add( mesh );
				//////////////

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setSize( window.innerWidth, window.innerHeight );

				container.appendChild( renderer.domElement );

				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				document.addEventListener( 'touchstart', onDocumentTouchStart, false );
				document.addEventListener( 'touchmove', onDocumentTouchMove, false );

				window.addEventListener( 'resize', onWindowResize, false );
			} else {
				throw new Error("instance is a required parameter");
			}
		}

		function onWindowResize() {

			windowHalfX = window.innerWidth / 2;
			windowHalfY = window.innerHeight / 2;

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		//

		function onDocumentMouseDown( event ) {

			event.preventDefault();

			document.addEventListener( 'mousemove', onDocumentMouseMove, false );
			document.addEventListener( 'mouseup', onDocumentMouseUp, false );
			document.addEventListener( 'mouseout', onDocumentMouseOut, false );

			mouseXOnMouseDown = event.clientX - windowHalfX;
			targetRotationOnMouseDown = targetRotation;

		}

		function onDocumentMouseMove( event ) {

			mouseX = event.clientX - windowHalfX;
			mouseY = event.clientY - windowHalfY;

			targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
			targetYRotation = targetYRotationOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.02;

		}

		function onDocumentMouseUp( event ) {

			document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
			document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
			document.removeEventListener( 'mouseout', onDocumentMouseOut, false );

			
			resetModelPosition();
		}

		function resetModelPosition() {
			targetRotation = 0;
			targetYRotation =  -1.57;
		}

		function onDocumentMouseOut( event ) {

			document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
			document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
			document.removeEventListener( 'mouseout', onDocumentMouseOut, false );

			resetModelPosition();
		}

		function onDocumentTouchStart( event ) {

			if ( event.touches.length == 1 ) {

				event.preventDefault();

				mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
				mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
				targetRotationOnMouseDown = targetRotation;
				targetYRotationOnMouseDown = targetYRotation;

			}

		}

		function onDocumentTouchMove( event ) {

			if ( event.touches.length == 1 ) {

				event.preventDefault();

				mouseX = event.touches[ 0 ].pageX - windowHalfX;
				mouseY = event.touches[ 0 ].pageY - windowHalfY;
				targetYRotation = targetYRotationOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.05;

			}

		}

		function animate() {
			requestAnimationFrame( animate );
			render();
		}

		function render() {
			group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;
			group.rotation.x += ( targetYRotation - group.rotation.x ) * 0.05;
			renderer.render( scene, camera );
		}

		function save() {
			var geometry = mesh.geometry,
				stlString = generateSTL( geometry ),
				blob = new Blob([stlString], { type: "text/plain" });

			saveAs(blob, prompt("Name the model") + '.stl');
		}

		init();
		animate();

		return {
			save: save
		};
	};
})();