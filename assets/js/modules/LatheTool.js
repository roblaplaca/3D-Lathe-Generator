(function() {
	window.LatheTool = function(params) {
		var opts = $.extend({
				numSides: 4,
				meshColor: 0x00aedb
			}, params),
			$module = opts.instance || null,
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
				camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.set( 0, 0, 500 );

				scene = new THREE.Scene();

				group = new THREE.Object3D();
				resetModelPosition();
				group.rotation.x = -1.57;
				scene.add( group );

				//////////////
				var squareShape = new THREE.Shape();

				squareShape.moveTo( 0, 100 );
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
					latheMaterial = new THREE.MeshBasicMaterial( { color: opts.meshColor, wireframe: true, transparent: true });

				mesh = new THREE.Mesh( lathe, latheMaterial);

				// mesh.position.y = 0;
				mesh.overdraw = true;
				mesh.doubleSided = true;

				group.add( mesh );
				//////////////

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setSize( window.innerWidth, window.innerHeight );

				$module.append( renderer.domElement );

				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				window.addEventListener( 'resize', onWindowResize, false );

				animate();
			} else {
				throw new Error("instance is a required parameter");
			}
		}

		/**
		 * Ensure everything fits in the camera properly when the window is resized
		 */ 
		function onWindowResize() {
			windowHalfX = window.innerWidth / 2;
			windowHalfY = window.innerHeight / 2;

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );
		}

		/**
		 * When the mouse is down enter inspection mode, allowing the user
		 * to rotate the group on the x/y axis
		 */
		function onDocumentMouseDown( e ) {
			e.preventDefault();

			document.addEventListener( 'mousemove', onDocumentMouseMove, false );
			document.addEventListener( 'mouseup', onDocumentMouseUp, false );
			document.addEventListener( 'mouseout', onDocumentMouseOut, false );

			mouseXOnMouseDown = e.clientX - windowHalfX;
			targetRotationOnMouseDown = targetRotation;
		}

		/**
		 * Once in inspection mode, moving the mouse updates the x/y axis position of the group
		 */
		function onDocumentMouseMove( e ) {
			mouseX = e.clientX - windowHalfX;
			mouseY = e.clientY - windowHalfY;

			targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
			targetYRotation = targetYRotationOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.02;
		}

		/**
		 * Leave inspection mode, and reset model to the default position
		 */
		function onDocumentMouseUp( e ) {
			document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
			document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
			document.removeEventListener( 'mouseout', onDocumentMouseOut, false );

			resetModelPosition();
		}

		/**
		 * Leave inspection mode, and reset model to the default position
		 */
		function onDocumentMouseOut( e ) {
			document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
			document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
			document.removeEventListener( 'mouseout', onDocumentMouseOut, false );

			resetModelPosition();
		}

		/**
		 * Resets model to default position
		 */
		function resetModelPosition() {
			targetRotation = 0;
			targetYRotation =  -1.57;
		}

		/**
		 * Kick off the animation loop
		 */
		function animate() {
			requestAnimationFrame( animate );
			render();
		}

		/**
		 * Render loop for displaying the model
		 */
		function render() {
			group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;
			group.rotation.x += ( targetYRotation - group.rotation.x ) * 0.05;
			renderer.render( scene, camera );
		}

		/**
		 * Prompts the user for the output file name, and uses a library
		 * to generate a downloadable STL
		 */
		function save() {
			var geometry = mesh.geometry,
				stlString = generateSTL( geometry ),
				blob = new Blob([stlString], { type: "text/plain" });

			saveAs(blob, prompt("Name the model") + '.stl');
		}

		init();

		return {
			save: save
		};
	};
})();