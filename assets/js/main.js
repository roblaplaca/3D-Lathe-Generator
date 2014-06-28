// TODO: add namespace for app
$(function() {
	var $slider = $(".num-segments");

	// TODO: store segment-count $segmentCount variable
	$(".segment-count").text($slider.val());

	var workarea = new LatheWorkArea({
		instance: $(".module-lathe-tool")
	});

	var lathe = new Lathe({
		instance: $(".module-lathe-output").eq(0),
		height: 300,
		width: 300
	});

	var mirror = new Mirror({
		instance: workarea.getMirrorCanvas()
	});

	var penTool = new PenTool({
		instance: workarea.getDrawingCanvas(),
		onPathClosed: function() {
			var path = penTool.getPath();

			if( path !== null && typeof path !== "undefined") {
				var shapePoints = convertPathToShape(path);
				lathe.addShape(shapePoints, $slider.val());	
				mirror.update(path);

				// TODO: make toggle for download button a 
				if( path.closed ) {
					$(".download").prop('disabled', false);	
				} else {
					$(".download").prop('disabled', true);
				}
			} else {
				lathe.addShape([], 0);
				mirror.clear();
				$(".download").prop('disabled', true);
			}
		}
	});
	
	$slider.on("input", function(e) {
		$(".segment-count").text($(e.target).val());
		penTool.updateSides();
	});

	$(".download").on("click", function(e) {
		lathe.save();
	});

	$(".reset").on("click", function(e) {
		$(".download").prop('disabled', true);
		penTool.reset();
	});

	// TODO: make convertPathToShape a part of one of the lathe object
	function convertPathToShape(paperJSPath) {
		var shape = new THREE.Shape(),
			shapePoints = [],
			adjustedPoints = [];

		shape.moveTo(paperJSPath.firstSegment.point.x, paperJSPath.firstSegment.point.y);

		for( var i=1; i<paperJSPath.segments.length; i++) {
			shape.lineTo(paperJSPath.segments[i].point.x, paperJSPath.segments[i].point.y);
		}

		shape.lineTo(paperJSPath.firstSegment.point.x, paperJSPath.firstSegment.point.y);
		shape.moveTo(paperJSPath.firstSegment.point.x, paperJSPath.firstSegment.point.y);

		shapePoints = shape.extractPoints().shape;

		for( var k=0; k<shapePoints.length; k++ ) {
			adjustedPoints.push( new THREE.Vector3(shapePoints[k].x, 0, -shapePoints[k].y) );
		}

		return adjustedPoints;
	}
});