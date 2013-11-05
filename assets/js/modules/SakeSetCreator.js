/**
 * Move around 5 points to draw a line segment which gets 
 * rotated 180 degrees on the y-axis
 * Ported from https://www.shapeways.com/creator/sake-set
 * @class
 */
var SakeSetCreator = function(params) {
	var opts = $.extend({}, params),
		dx = 0, dy = 30,
		w = 700, h = 590,
		$module = opts.module,
		$editBtn = $module.find(".edit"),
		$rotateBtn = $module.find(".rotate");

	/////////////
	var renderer;
	var toxiMesh;

	var container = document.getElementById('workspace'),
		mouse = new toxi.geom.Vec2D(),
		pmouse = new toxi.geom.Vec2D(),
		cameraSensitivity = 1.2,
		stage = new toxi.geom.Vec2D(w,h),
		camera = new THREE.Camera( 70, stage.x / stage.y, 1, 10000 );
		scene = new THREE.Scene(),
		objectRadius = 1,
		meshResolution = 20,
		twist = 0,
		ridge = 0,
		m = [],
		modelW = 0,
		modelH=0,
		toxiToThreeSupport = new toxi.THREE.ToxiclibsSupport(scene),
		threeMesh = undefined;

	var plane;
	var starty = 0;
	var spline = null;

	// this is twice what we need in mm because we scale the screen model in half on export
	var wallthickness = 8;
	var cpts;

	// mouse actions and controls
	var mousePressed = false;

	var pdx = w / 2,
		pdy = h / 2 - starty;
	var selected = -1;

	var material = new THREE.MeshLambertMaterial( { color: 0xEC008C, shading: THREE.FlatShading } );

	var canvas3D;
	var splineCanvas;
	var splineCanvasCtx;
	/////////////

	function init() {
		if( isWebGLSupported() ) {
			initSpline();
			initRenderer();
			bind3DMouseEvents();
			bindSplineEvents();
			bindModeButtons();
		} else {
			// TODO: Inform user that webgl won't work
		}
	}

	/**
	 * Sets up events for manipulating the spline
	 */
	function bindSplineEvents() {
		splineCanvas.onmousedown = function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			canvas3D.style.cursor='pointer';
			mousePressed = true;
		};

		splineCanvas.onmouseup = function() {
			mousePressed = false;
			selected=-1;
			changeMesh(meshResolution);
		};

		splineCanvas.onmousemove = function(event){
			dx = getPositionLeft(document.getElementById("workspace"))-5;
			dy = getPositionTop(document.getElementById("workspace"))-5;

			pmouse.x = mouse.x;
			pmouse.y = mouse.y;

			mouse.x = event.pageX - dx;
			mouse.y = event.pageY - dy;

			showControlPts();
		};
	}

	/**
	 * Sets up events for browsing the 3d view 
	 */
	function bind3DMouseEvents() {
		canvas3D.onmousedown = function(evt) {
			mousePressed = true;
			evt.preventDefault();
			evt.stopPropagation();
			canvas3D.style.cursor = 'move';
		};

		canvas3D.onmouseup = function() {
			mousePressed = false;
		};

		canvas3D.onmousemove = function(e){
			e.preventDefault();
			e.stopPropagation();

			canvas3D.style.cursor='move';
			pmouse.x = mouse.x;
			pmouse.y = mouse.y;
			mouse.x = e.pageX-dx;
			mouse.y = e.pageY-dy;

			if( mousePressed == true ) {
				threeMesh.rotation.x += (mouse.y-pmouse.y) / 100;
				threeMesh.rotation.y += (mouse.x-pmouse.x) / 100;
			}
		};
	}

	/**
	 * Setup toggle so the user can switch between different modes
	 * examples: edit/rotate
	 */
	function bindModeButtons() {
		$editBtn.on("click", function(e) {
			e.preventDefault();
			enterDrawMode();
		});

		$rotateBtn.on("click", function(e) {
			e.preventDefault();
			enterRotateMode();
		});
	}

	/**
	 * Toggles mode buttons and enables draw mode
	 * where a user can drag around 5 handles to creat
	 * a line which will get rotated to make a 3d object
	 */
	function enterDrawMode() {
		showControlPts();
		threeMesh.rotation.x = 0;

		splineCanvas.style.visibility = "visible";

		$("#drawButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/edit-active.png");
		$("#rotateButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/rotate.png");
	}

	/**
	 * Toggles mode buttons and enables rotate mode
	 * Allows user to rotate generated model
	 */
	function enterRotateMode() {
		splineCanvas.style.visibility = "hidden";

		$("#drawButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/edit.png");
		$("#rotateButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/rotate-active.png");
	}

	/**
	 * TODO: document getPositionLeft
	 */
	function getPositionLeft(This){
		var el = This;
		var pL = 0;

		while(el) {
			pL += el.offsetLeft;
			el=el.offsetParent;
		}

		return pL;
	}

	/**
	 * TODO: document getPositionTop
	 */
	function getPositionTop(This){
		var el = This,
			pT = 0;

		while( el ) {
			pT += el.offsetTop;
			el = el.offsetParent;
		}

		return pT;
	}

	/**
	 * returns boolean whether or not webgl is supported
	 */
	function isWebGLSupported() {
		return Modernizr.webgl;
	}

	/**
	 * TODO: document initRenderer
	 */
	function initRenderer() {
		splineCanvas = document.createElement('canvas');
		splineCanvas.id = "canvas2D";
		splineCanvas.width = 700;
		splineCanvas.height = 590;

		$("#workspace").append(splineCanvas);

		splineCanvasCtx = splineCanvas.getContext('2d');

		renderer = isWebGLSupported() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();

		setupLights();

		// TODO: move camera init out of initRenderer method
		camera = new THREE.PerspectiveCamera(50, stage.x / stage.y, 1, 10000);
		camera.position.y = -10;
		camera.position.z = 600;

		renderer.setSize(stage.x,stage.y);
		container.appendChild(renderer.domElement ,container.firstChild);
		renderer.domElement.setAttribute("id", "renderer");

		canvas3D = renderer.domElement;
		
		//create first mesh
		changeMesh(meshResolution);
		animate();

		enterDrawMode();
	}

	/**
	 * TODO: document setupLights
	 */
	function setupLights() {
		var particleLight,
			pointLight,
			pointLight2;

		scene.add( new THREE.AmbientLight( 0x330033 ) );

		window.directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
		directionalLight.position.set( 0, 1, 0 );
		// directionalLight.position.normalize();
		// scene.add( directionalLight );

		var light = new THREE.PointLight( 0xff0000, 1, 100 ); 
		light.position.set( 50, 50, 50 ); 
		scene.add( light );

		if (!isWebGLSupported()) {
			//var plane = new THREE.Mesh( new THREE.PlaneGeometry( 900, 800 ), new THREE.MeshBasicMaterial() );
			var plane = new THREE.Mesh( new THREE.PlaneGeometry( 1200, 1000 ), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'https://www.shapeways.com/creators/sake_set/UI/background1.jpg' ) } ) );

			plane.rotation.x =  360 * ( Math.PI / 180 );
			plane.position.z=-170;
			plane.position.y = camera.position.y+55;
			plane.overdraw = true;
			scene.add( plane );
		}
	}

	/**
	 * TODO: document changeMesh
	 */
	function changeMesh(res){
		if(res === undefined){
			res = meshResolution;
		}

		if(threeMesh !== undefined) {
			scene.remove(threeMesh);
		}

		toxiMesh = createMesh( new toxi.geom.mesh.TriangleMesh(), res, 1, true );
		threeMesh = toxiToThreeSupport.addMesh(toxiMesh, material);
		threeMesh.doubleSided = true;
		threeMesh.overdraw = true;
		scene.add(threeMesh);
	}

	/**
	 * TODO: document animate
	 */
	function animate() {
		requestAnimationFrame( animate );
		render();
	}

	/**
	 * TODO: document render
	 */
	function render() {
		renderer.render( scene, camera );
	}

	/**
	 * TODO: document createMesh
	 */
	function createMesh() {
		//should have either 1, 3 or 4 parameters
		var mesh = undefined,
			res = undefined,
			size = 1,
			isClosed = true;

		if(arguments.length == 1){
			res = arguments[0];
		} else if(arguments.length ==3 ){ //mesh, res, size
			mesh = arguments[0];
			res = arguments[1];
			size = arguments[2];
		} else if(arguments.length == 4){
			mesh = arguments[0];
			res = arguments[1];
			size = arguments[2];
			isClosed = arguments[3];
		}

		if(mesh == null || mesh == undefined) {
			//this is for in case people use it in toxi's examples for p5
			mesh = new toxi.geom.mesh.TriangleMesh();
		}

		var wt = wallthickness / 2;

		cpts = spline.computeVertices(8);

		//clean up the points
		for (var i=0; i<cpts.length-1; i++) {
			var pt1=cpts[i];
			var pt2=cpts[i+1];
			if ((pt2.y-pt1.y)<.1){
				cpts.splice(i,1);
			}
		}
		
		// array of Vec 2D points surrounding spline curve
		var points = [];
		var begin = spline.pointList[0];

		points.push(new toxi.geom.Vec2D(begin.x, begin.y-wt));

		for (var i=0; i<cpts.length-1; i++) { //add points offset from spline points
			var p= cpts[i];
			var p2=cpts[i+1];
			var m= p2.sub(p);
			var t=m.perpendicular().normalize();
			var tp=p.sub(t.scale(wt));
			points.push(tp);
		}

		var end = spline.pointList[spline.pointList.length-1];

		// add the end point; this is the edge of the lathe
		points.push(end);

		// get tangent lines in opposite direction
		for (var i=cpts.length-1; i>0; i--) {
			var p= cpts[i];
			var p2=cpts[i-1];
			var m= p2.sub(p);
			var t=m.perpendicular().normalize();
			var tp=p.sub(t.scale(wt));
			points.push(tp);
		}

		points.push(new toxi.geom.Vec2D(begin.x, begin.y+wt));

		// make the mesh using the new offset curve points
		var longitudes = [];
		var Lres = res;
		var theta = 0;

		if (twist>0 || ridge>0) {
			//longitude curves going around
			for (var i=0; i<Lres*2; i++) { 
				var curvepts = [];
				for (var j=0; j<points.length; j++) {
					var p=points[j];
					var r=Math.abs(p.x);

					if ((i%2==0)) {
						// r=r-4;
						r = r * Math.cos(Math.PI/Lres) - (ridge/10);
					}

					var twistamt=(twist/100)*(Math.PI*2)*(Math.abs(p.y-points[0].y)/points[0].y);
					var x=r*Math.cos(theta+twistamt);
					var z=r*Math.sin(theta+twistamt);

					curvepts.push(new toxi.geom.Vec3D(x, p.y, z));
				}

				longitudes.push(curvepts);
				theta+=(Math.PI)/Lres;
			}
		} else {
			// longitude curves going around
			for (var i=0; i<Lres; i++) {
				var curvepts = [];

				for (var j=0; j<points.length; j++) {
					var p=points[j];
					var r=Math.abs(p.x);
					var twistamt=(twist/100)*(Math.PI*2)*(Math.abs(p.y-points[0].y)/points[0].y);
					var x=r*Math.cos(theta+twistamt);
					var z=r*Math.sin(theta+twistamt);
					curvepts.push(new toxi.geom.Vec3D(x, p.y, z));
				}

				longitudes.push(curvepts);
				theta+=(Math.PI*2)/Lres;
			}
		}

		for (var i=0; i<longitudes.length-1; i++) { //make triangle strips
			var p=longitudes[i];
			var p2=longitudes[i+1];

			for (var j=0; j<p.length-1; j++) {
				var A= p[j];
				var B=p2[j];
				var C=p[j+1];
				var D=p2[j+1];
				mesh.addFace(A,B,C);
				mesh.addFace(C,B,D);
			}
		}

		//make sure to close the last curve with the first curve
		var p=longitudes[longitudes.length-1];
		var p2=longitudes[0];

		for (var j=0; j<p.length-1; j++) {
			var A= p[j];
			var B=p2[j];
			var C=p[j+1];
			var D=p2[j+1];
			mesh.addFace(A,B,C);
			mesh.addFace(C,B,D);
		}

		return mesh;
	}

	/**
	 * TODO: document renderSpline
	 */
	function renderSpline(pts) {
		splineCanvasCtx.beginPath();
		
		// draw points
		for (var i=1; i<pts.length; i++) {
			splineCanvasCtx.beginPath();
		
			var px = pts[i].x*1.2+pdx;
			var py = (starty-pts[i].y*1.2)+pdy;

			if (i==selected) {
				splineCanvasCtx.fillStyle = "rgba(255,102,51,1)";
			} else {
				splineCanvasCtx.fillStyle = "rgba(41,171,226,.8)";
			}

			splineCanvasCtx.arc(px,py,6,0,Math.PI*2);
			splineCanvasCtx.fill();
			splineCanvasCtx.closePath();
		}

		//draw spline
		splineCanvasCtx.strokeStyle="rgba(41,171,226,1)";
		splineCanvasCtx.beginPath();

		var splinepts = spline.computeVertices(8);

		for (var i=0; i<splinepts.length; i++) {
			var px = splinepts[i].x * 1.2 + pdx;
			var py = (starty - splinepts[i].y * 1.2) + pdy;
		
			if( i==0 ) {
				splineCanvasCtx.moveTo(px,py);
			} else {
				splineCanvasCtx.lineTo(px,py);
			}
		}

		splineCanvasCtx.stroke();
		splineCanvasCtx.closePath();
	}

	/**
	 * TODO: document getMaxX
	 */
	function getMaxX(pts) {
		var maxX = 0;
		for( var i = 0; i < pts.length; i++ ) {
			if( pts[i].x > maxX ) {
				maxX=pts[i].x;
			}
		}
		return maxX;
	}

	/**
	 * TODO: document showControlPts
	 */
	function showControlPts() {
		var pts = spline.pointList;
		splineCanvasCtx.clearRect(0,0,700,590);
		renderSpline(pts);
		
		//see if you have selected a node only if one is not currently selected
		if (selected>0) {
			if (mouse.x>(w/2+12)) { //make sure the points don't go past the center line + 12mm
				pts[selected].x=(mouse.x-pdx)/1.2;
			}
		
			pts[selected].y=(starty-(mouse.y-pdy))/1.2;
		} else {
			//skip the first point
			for (var i=1; i<pts.length; i++) {

				var px = pts[i].x*1.2+pdx;
				var py = (starty-pts[i].y*1.2)+pdy;

				if (mouse.distanceTo(new toxi.geom.Vec2D(px,py))<15) {
					splineCanvasCtx.beginPath();
					splineCanvasCtx.fillStyle = "rgba(255,102,51,1)";
					splineCanvasCtx.arc(px,py,6,0,Math.PI*2);
					splineCanvasCtx.fill();
					splineCanvasCtx.closePath();

					if (mousePressed) {
						// set the selected node
						selected = i;
					}
				}
			}
		}

		var h = pts[pts.length-1];

		//here we add a little to account for wall thickness
		modelH = Math.floor((h.y-pts[0].y)/2)+2;
		modelW = Math.floor(getMaxX(cpts))+3;
	}

	/**
	 * TODO: document initSpline
	 */
	function initSpline() {
		spline = new toxi.geom.Spline2D();

		// the first point must be anchored at x=0; this is the bottom
		spline.add(new toxi.geom.Vec2D(0, -160));
		spline.add(new toxi.geom.Vec2D(27.5,-160));
		spline.add(new toxi.geom.Vec2D(44,-155));
		spline.add(new toxi.geom.Vec2D(64, -113));
		spline.add(new toxi.geom.Vec2D(72,-72.5));
		spline.add(new toxi.geom.Vec2D(93,-47.5));	
	}

	/**
	 * TODO: document save
	 */
	function save() {
		geometry = threeMesh.geometry
		var stlString = generateSTL( geometry );
		var blob = new Blob([stlString], {type: 'text/plain'});
		saveAs(blob, prompt("Name the model") + '.stl');
	}

	init();

	return;
};