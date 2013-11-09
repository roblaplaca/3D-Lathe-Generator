(function() {
	window.Lathe = function(params) {
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
				setupCamera();

				scene = new THREE.Scene();
				group = new THREE.Object3D();

				resetModelPosition();

				group.rotation.x = -(Math.PI / 2);
				scene.add( group );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setSize( window.innerWidth, window.innerHeight );

				$module.append( renderer.domElement );

				document.addEventListener('mousedown', onDocumentMouseDown, false );
				window.addEventListener('resize', onWindowResize, false );

				animate();
			} else {
				throw new Error("instance is a required parameter");
			}
		}

		/**
		 * Adds a shape to the view and then lathes it
		 */
		function addShape(points) {
			var lathe = new THREE.LatheGeometry( points, opts.numSides),	
				latheMaterial = new THREE.MeshBasicMaterial( { color: opts.meshColor, wireframe: true, transparent: true });

			clearShape();

			mesh = new THREE.Mesh(lathe, latheMaterial);
			mesh.overdraw = true;
			mesh.doubleSided = true;

			group.add( mesh );
		}

		/**
		 * Clears out current shape
		 */
		function clearShape() {
			group.remove(mesh);
		}

		/**
		 * Initialize camera
		 */
		function setupCamera() {
			camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
			camera.position.set( 0, 0, 500 );
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
			targetYRotation =  -(Math.PI / 2);
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
			save: save,
			addShape: addShape
		};
	};
})();