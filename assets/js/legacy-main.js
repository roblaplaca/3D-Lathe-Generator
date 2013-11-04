/**
 * Move around 5 points to draw a line segment which gets 
 * rotated 180 degrees on the y-axis
 * Ported from https://www.shapeways.com/creator/sake-set
 * @class
 */
var SakeSetCreator = function(params) {
	var opts = $.extend({}, params),
		$module = opts.module,
		$editBtn = $module.find(".edit"),
		$rotateBtn = $module.find(".rotate");

	function init() {
		console.log('init');
		bindModeButtons();
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

	init();

	return;
};

$(function() {
	var $creatorContainer = $("#creator-container");

	sakeCreator = new SakeSetCreator({
		module: $creatorContainer
	});
});

/**
 * TODO: document enterDrawMode
 */
function enterDrawMode() {
	camera.position.y = -85;
	showControlPts();
	threeMesh.rotation.x = 0;
	// plane.rotation.x=0;

	CV2.style.visibility = "visible";

	$("#drawButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/edit-active.png");
	$("#rotateButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/rotate.png");
}

/**
 * TODO: document enterRotateMode
 */
function enterRotateMode() {
	camera.position.y = 30;
	CV2.style.visibility = "hidden";

	$("#drawButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/edit.png");
	$("#rotateButton").attr("src","https://www.shapeways.com/creators/sake_set/UI/rotate-active.png");
}

/**
 * TODO: document showCredits
 */
function showCredits() {
	jQuery("#creditsbox").show();
}

/**
 * TODO: document hideCredits
 */
function hideCredits() {
	jQuery("#creditsbox").hide();
}

/**
 * TODO: document updateRes
 */
function updateRes() {
	meshResolution=jQuery("#smoothslider").slider("value");
	changeMesh(meshResolution);
}

/**
 * TODO: document updateTwist
 */
function updateTwist() {
	twist = jQuery("#twistslider").slider("value");
	changeMesh(meshResolution);
}

/**
 * TODO: document updateRidge
 */
function updateRidge(val) {
	ridge=val;
	changeMesh(meshResolution);
}

jQuery( "#smoothslider" ).slider({
	orientation: "horizontal",
	range: "min",
	min: 4,
	max: 50,
	value: 20,
	change: updateRes
});

jQuery( "#twistslider" ).slider({
	orientation: "horizontal",
	range: "min",
	min: 0,
	max: 40,
	value: 0,
	change: updateTwist
});

var dx=0, dy=30;
var w=700, h=590;

/**
 * TODO: document getPositionLeft
 */
function getPositionLeft(This){
	var el = This;
	var pL = 0;

	while(el){
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

var container = document.getElementById('threejs_container'),
	$m = jQuery("#m"),
	mouse = new toxi.Vec2D(),
	pmouse = new toxi.Vec2D(),
	cameraSensitivity = 1.2,
	stage = new toxi.Vec2D(w,h),
	camera = new THREE.Camera( 70, stage.x / stage.y, 1, 10000 );
	scene = new THREE.Scene(),
	objectRadius = 1,
	meshResolution = 20,
	twist=0,
	ridge=0,
	m = [],
	modelW=0,
	modelH=0,
	toxiToThreeSupport = new toxi.THREE.ToxiclibsSupport(scene),
	threeMesh = undefined; //<--we'll put the converted mesh here

var plane;
var WebGLSupported = isWebGLSupported();

//stores url for last saved model;
var recentlysaved = "";

var starty = 0;
var spline = new toxi.Spline2D();

//the first point must be anchored at x=0; this is the bottom
spline.add(new toxi.Vec2D(0, -160));
spline.add(new toxi.Vec2D(27.5,-160));
spline.add(new toxi.Vec2D(44,-155));
spline.add(new toxi.Vec2D(64, -113));
spline.add(new toxi.Vec2D(72,-72.5));
spline.add(new toxi.Vec2D(93,-47.5));

var preset1=[6,0,0,-160,27.5,-160,51.667,-123.334,75,43.334,37.5,93.334,65,134.1667];
var preset2=[14,25,0,-160,45.83,-161.667,64.167,-146.667,120,-70,37.5,9.1667,71.667,74.167];
var preset3=[8,19,0,-160,30.8334,-160,50,-163.334,75.833,-145.833,105.833,-132.5,118.334,-117.5];
var preset4=[8,0,0,-160,15,-160,34.167,-163.33,44.167,-142.5,58.334,-107.5,77.5,-85];
//this is twice what we need in mm because we scale the screen model in half on export
var wallthickness = 8;
var cpts;

//mouse actions and controls
var mousePressed=false;

var pdx = w/2, pdy = h/2-starty;
var selected=-1;

function isWebGLSupported() {
	var cvs = document.createElement('canvas');
	var contextNames = ["webgl","experimental-webgl","moz-webgl","webkit-3d"];
	var ctx;

	if ( navigator.userAgent.indexOf("MSIE") >= 0 ) {
		try {
			ctx = WebGLHelper.CreateGLContext(cvs, 'canvas');
		} catch(e) {}
	} else {
		for ( var i = 0; i < contextNames.length; i++ ) {
			try {
				ctx = cvs.getContext(contextNames[i]);
				if ( ctx ) break;
			} catch(e){}
		}
	}

	if ( ctx ) return true;
	return false;
}

var material = new THREE.MeshLambertMaterial( { color: 0xee00ee, shading: THREE.FlatShading } );
//var material = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x111111, specular: 0xffaa00, shininess: 10});
var CV;
var CV2;
var ctx;

BrowserDetect.init();

if ((BrowserDetect.browser != "Explorer") || (BrowserDetect.browser == "Explorer" && BrowserDetect.version==9)) {
	//console.log("good to go");
	initRenderer();

	CV.onmousedown = function(evt) {
		mousePressed = true;
		evt.preventDefault();
		evt.stopPropagation();
		CV.style.cursor = 'move';
	};

	CV.onmouseup = function() {
		mousePressed = false;
	};

	CV.onmousemove = function(event){
		event.preventDefault();
		event.stopPropagation();

		CV.style.cursor='move';
		pmouse.x = mouse.x;
		pmouse.y = mouse.y;
		mouse.x = event.pageX-dx;
		mouse.y = event.pageY-dy;

		if (mousePressed == true){
			threeMesh.rotation.x += (mouse.y-pmouse.y)/100;
			threeMesh.rotation.y += (mouse.x-pmouse.x)/100;
			//plane.rotation.x += (mouse.y-pmouse.y)/100;
			//plane.rotation.y += (mouse.x-pmouse.x)/100;
		}
	};

	CV2.onmousedown = function(evt) {
		evt.preventDefault();
		evt.stopPropagation();
		CV.style.cursor='pointer';
		mousePressed = true;
	};

	CV2.onmouseup = function() {
		mousePressed = false;
		selected=-1;
		changeMesh(meshResolution);
	};

	CV2.onmousemove = function(event){
		dx=getPositionLeft(document.getElementById("threejs_container"))-5;
		dy=getPositionTop(document.getElementById("threejs_container"))-5;

		pmouse.x=mouse.x;
		pmouse.y=mouse.y;

		mouse.x = event.pageX-dx;
		mouse.y = event.pageY-dy;

		showControlPts();
	};
} else {
	jQuery("#main-box").hide();
	//$(".message").innerHTML("3D won't work");
}

var renderer;

/**
 * TODO: document initRenderer
 */
function initRenderer() {
	CV2 = document.createElement('canvas');
	CV2.id = "canvas2D";
	CV2.width=700;
	CV2.height=590;
	jQuery("#threejs_container").append(CV2);
	//CV2 = document.getElementById('canvas2D');
	ctx = CV2.getContext('2d');

	renderer= WebGLSupported ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();

	setupLights();

	camera.position.y = 30;
	camera.position.z = 400;

	renderer.setSize(stage.x,stage.y);
	container.appendChild(renderer.domElement ,container.firstChild);
	renderer.domElement.setAttribute("id", "renderer");

	CV = renderer.domElement;

	//create first mesh
	changeMesh(meshResolution);
	resetFields();
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

	scene.addLight( new THREE.AmbientLight( 0x505050 ) );

	var directionalLight = new THREE.DirectionalLight( 0x7E7E7E, 1.5 );
	directionalLight.position.x = 5.3;
	directionalLight.position.y = -5.2;
	directionalLight.position.z = -5.5;
	directionalLight.position.normalize();

	scene.addLight( directionalLight );

  if (!isWebGLSupported()) {
	//var plane = new THREE.Mesh( new THREE.PlaneGeometry( 900, 800 ), new THREE.MeshBasicMaterial() );
	var plane = new THREE.Mesh( new THREE.PlaneGeometry( 1200, 1000 ), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'https://www.shapeways.com/creators/sake_set/UI/background1.jpg' ) } ) );

	plane.rotation.x =  360 * ( Math.PI / 180 );
	plane.position.z=-170;
	plane.position.y = camera.position.y+55;
	plane.overdraw = true;
	scene.addObject( plane );
  }
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
 * TODO: document loadDesign
 */
function loadDesign(splineptsX, splineptsY, smoothval, twistval) {
	for (var i=0; i<splineptsX.length; i++) {
		spline.add(new toxi.Vec2D(splineptsX[i], splineptsY[i]));
	}

	jQuery( "#smoothslider" ).slider({
		value: smoothval
	});

	jQuery( "#twistslider" ).slider({
		value: twistval
	});

	changeMesh(smoothval);
}

/**
 * TODO: document loadPreset
 */
function loadPreset(presetVal) {
	// console.log(presetVal);
	jQuery( "#smoothslider" ).slider({
		value: presetVal[0]
	});

	jQuery( "#twistslider" ).slider({
		value: presetVal[1]
	});

	var p=2;
	var pts = spline.pointList;

	for (var i=0; i<pts.length; i++) {
		pts[i].x=presetVal[p];
		pts[i].y=presetVal[p+1];
		p=p+2;
	}

	changeMesh(presetVal[0]);
	showControlPts();
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
		mesh = new toxi.TriangleMesh();
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

	points.push(new toxi.Vec2D(begin.x, begin.y-wt));

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

	points.push(new toxi.Vec2D(begin.x, begin.y+wt));

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

				curvepts.push(new toxi.Vec3D(x, p.y, z));
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
				curvepts.push(new toxi.Vec3D(x, p.y, z));
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

var toxiMesh;

/**
 * TODO: document changeMesh
 */
function changeMesh(res){
	if(res === undefined){
		res = meshResolution;
	}

	if(threeMesh !== undefined) {
		scene.removeObject(threeMesh);
	}

	toxiMesh = createMesh(new toxi.TriangleMesh(),res,1,true);
	threeMesh = toxiToThreeSupport.addMesh(toxiMesh,material);
	threeMesh.doubleSided = true;
	threeMesh.overdraw=true;
	scene.addObject(threeMesh);
}

/**
 * TODO: document triArea
 */
function triArea(a,b,c) {
	var da = a.distanceTo(b);
	var db = b.distanceTo(c);
	var dc = c.distanceTo(a);
	var p = (da+db+dc)/2;
	var A = Math.sqrt(p*(p-da)*(p-db)*(p-dc));
	return A;
}

/**
 * TODO: document showControlPts
 */
function showControlPts() {
	var pts = spline.pointList;
	ctx.clearRect(0,0,700,590);
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

		if (mouse.distanceTo(new toxi.Vec2D(px,py))<15) {
			ctx.beginPath();
			ctx.fillStyle = "rgba(255,102,51,1)";
			ctx.arc(px,py,6,0,Math.PI*2);
			ctx.fill();
			ctx.closePath();

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

	//write dimensions
	ctx.font="monospace 20px sans-serif";
	ctx.fillStyle="rgba(50,50,50,100)";
	ctx.strokeStyle="rgba(90,90,90,50)";
	ctx.beginPath();

	//ruler line for height
	ctx.moveTo(w/2-modelW*1.5+5, -h.y*1.2+pdy);
	ctx.lineTo(w/2-modelW*1.5, -h.y*1.2+pdy);
	ctx.lineTo(w/2-modelW*1.5, -pts[0].y*1.2+pdy);
	ctx.lineTo(w/2-modelW*1.5+5, -pts[0].y*1.2+pdy);

	//ruler line for width
	ctx.moveTo(w/2-modelW*1.2, -pts[0].y*1.2+pdy+35);
	ctx.lineTo(w/2-modelW*1.2, -pts[0].y*1.2+pdy+40);
	ctx.lineTo(w/2+modelW*1.2, -pts[0].y*1.2+pdy+40);
	ctx.lineTo(w/2+modelW*1.2, -pts[0].y*1.2+pdy+35);

	ctx.stroke();
	ctx.closePath();

	ctx.fillText(modelW/10+" cm", w/2+modelW*1.2, -pts[0].y*1.2+pdy+50);
	ctx.fillText(modelH/10+" cm", w/2-modelW*1.5-40, -h.y*1.2+pdy);

// TODO: figure out where this { opens
}

/**
 * TODO: document renderSpline
 */
function renderSpline(pts) {
	ctx.beginPath();
	
	//draw points
	for (var i=1; i<pts.length; i++) {
		ctx.beginPath();
	
		var px = pts[i].x*1.2+pdx;
		var py = (starty-pts[i].y*1.2)+pdy;

		if (i==selected) {
			ctx.fillStyle = "rgba(255,102,51,1)";
		} else {
			ctx.fillStyle = "rgba(41,171,226,.8)";
		}

		ctx.arc(px,py,6,0,Math.PI*2);
		ctx.fill();
		ctx.closePath();
	}

	//draw spline
	ctx.strokeStyle="rgba(41,171,226,1)";
	ctx.beginPath();

	var splinepts = spline.computeVertices(8);

	for (var i=0; i<splinepts.length; i++) {
		var px = splinepts[i].x*1.2+pdx;
		var py = (starty-splinepts[i].y*1.2)+pdy;
	
		if (i==0){
			ctx.moveTo(px,py);
		} else {
			ctx.lineTo(px,py);
		}
	}

	ctx.stroke();
	ctx.closePath();
}

/**
 * TODO: document getMaxX
 */
function getMaxX(pts) {
  	var maxX=0;

	for( var i = 0; i < pts.length; i++ ) {
		if( pts[i].x > maxX ) {
			maxX=pts[i].x;
		}
  	}

  	return maxX;
}

/**
 * TODO: document resetFields
 */
function resetFields() {
	//jQuery("p.message").html("Approve and order your creation!");
	errorCount = 0;
	recentlysaved = "";
}

var errorCount = 0;

/**
 * TODO: document submitform
 */
function submitform(session) {
	//console.log(spline.pointList);
	jQuery("#save-cover").show();
	SWCF.processing();

	//console.log(session);
	camera.position.y = -85;
	threeMesh.rotation.x=0;

	var modeltitle = document.getElementById('modeltitle').value;
	if (modeltitle == "") {
		modeltitle= "Untitled";
	}

	var splinepts="";
	var pts = spline.pointList;

	for (var i=0; i<pts.length-1; i++) {
		splinepts=splinepts + pts[i].x;
		splinepts=splinepts + "_";
		splinepts=splinepts + pts[i].y;
		splinepts=splinepts + "_";
	}

	splinepts=splinepts+pts[pts.length-1].x;
	splinepts=splinepts + "_";
	splinepts=splinepts + pts[pts.length-1].y;

	// Send to Server
	var xhreq = createXMLHttpRequest();
	xhreq.open("post", "/creator-generators/sakeset/save", true);
	xhreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	xhreq.onreadystatechange = function statechanged() {
		if (xhreq.readyState==4 && xhreq.status==200) {
			jQuery("#save-cover").hide();
			var xmlDoc=xhreq.responseXML;
			var success = isSuccess(xmlDoc);

			if (success == "true") {
				errorCount=0;
				setTimeout(function() {
					SWCF.success(getModelID(xmlDoc))
				}, 15000);
			} else {
				if (errorCount>0){
					SWCF.error2('there is a problem');
				} else {
					SWCF.error('there is a problem');
					errorCount++;
				}
			}
		
			console.log(xhreq.responseXML);
		}
	}

	//"&materials=63" +
	xhreq.send("sessionID=" + session +
		"&title=" + modeltitle +
		"&p_smooth=" + meshResolution +
		"&p_twist=" + twist +
		"&p_spline=" + splinepts+
		"&materials=Glazed Ceramics"+
		"&desc=" + "This was made with the <a href='/creator/sake-set'>Sake Set Creator</a>" +
		"&tags=Create:SakeSet"
		//"&soapServer=TEST6"
	);
}

/**
 * TODO: document isSuccess
 */
function isSuccess(xmlDoc) {
	var result = xmlDoc.getElementsByTagName("KernelResults")[0];
	var success = result.getAttribute("success");
	return success;
}

/**
 * TODO: document getModelID
 */
function getModelID(xmlDoc) {
	var result = xmlDoc.getElementsByTagName("KernelResults")[0];
	var id = result.getAttribute("modelID");
	return id;
}

/**
 * TODO: document createXMLHttpRequest
 */
function createXMLHttpRequest() {
	try { return new XMLHttpRequest(); } catch(e) {}
	try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
	alert("XMLHttpRequest not supported");
	return null;
}