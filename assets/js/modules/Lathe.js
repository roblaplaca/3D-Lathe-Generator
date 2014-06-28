(function() {
	// TODO: rename Lathe to something that makes more sense
	// TODO: add comments about Lathe class
	// TODO: add JS-doc syntax for all of Lathe.js methods
	// TODO: come up with way to create a partial rotation
	window.Lathe = function(params) {
		var opts = $.extend({
				numSides: 4,
				meshColor: 0x00cc00,
				height: 600,
				width: 800
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
			windowHalfX = opts.width / 2,
			windowHalfY = opts.height / 2;

		/**
         * @constructor
         */

		function init() {
			if( $module !== null ) {
				setupCamera();

				scene = new THREE.Scene();
				group = new THREE.Object3D();

				resetModelPosition();

				// TODO: figure out good lighting type for Lathe.js
				pointLight = new THREE.PointLight( 0xffffff, 3, 0);
				pointLight.position.set(-40, 0, 20);
				scene.add( pointLight );

				group.rotation.x = -(Math.PI / 2);
				scene.add( group );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setSize( opts.width, opts.height );

				$module.append( renderer.domElement );
				$module.get(0).addEventListener('mousedown', onDocumentMouseDown, false );

				animate();
			} else {
				throw new Error("instance is a required parameter");
			}
		}

		/**
		 * Adds a shape to the view and then lathes it
		 * addShape(points) - renders shape with default definition
		 * addShape(points, definition) - renders shape with custom definition, however doesn't reset default
		 */

		function addShape(points, definition) {
			var definition = definition || opts.numSides,
				lathe = new THREE.LatheGeometry( points, definition ),	
				latheMaterial = new THREE.MeshBasicMaterial({
					color: opts.meshColor,
					shading: THREE.FlatShading,
					wireframe: true,
					transparent: true 
				});

			clearShape();

			// TODO: make sure lathe shape has a mesh that reflects light so that it can be exported effectively
			mesh = new THREE.Mesh( lathe, latheMaterial );
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
			camera = new THREE.PerspectiveCamera( 75, opts.width / opts.height, 1, 5000 );
			// camera.position.set( 0, 0, 500 );
			camera.position.z = 1000;
			camera.position.y = -250;
		}

		/**
		 * When the mouse is down enter inspection mode, allowing the user
		 * to rotate the group on the x/y axis
		 *
		 * TODO: redo mouse interactions to be more usable
		 */

		function onDocumentMouseDown( e ) {
			e.preventDefault();

			$module.get(0).addEventListener( 'mousemove', onDocumentMouseMove, false );
			$module.get(0).addEventListener( 'mouseup', onDocumentMouseUp, false );
			$module.get(0).addEventListener( 'mouseout', onDocumentMouseOut, false );

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

		function onDocumentMouseUp(e) {
			// TODO: don't use $module.get(0) for events
			$module.get(0).removeEventListener( 'mousemove', onDocumentMouseMove, false );
			$module.get(0).removeEventListener( 'mouseup', onDocumentMouseUp, false );
			$module.get(0).removeEventListener( 'mouseout', onDocumentMouseOut, false );

			resetModelPosition();
		}

		/**
		 * Leave inspection mode, and reset model to the default position
		 */

		function onDocumentMouseOut(e) {
			// TODO: don't use $module.get(0) for events
			$module.get(0).removeEventListener( 'mousemove', onDocumentMouseMove, false );
			$module.get(0).removeEventListener( 'mouseup', onDocumentMouseUp, false );
			$module.get(0).removeEventListener( 'mouseout', onDocumentMouseOut, false );

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
				stlString = stlFromGeometry( geometry ),
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