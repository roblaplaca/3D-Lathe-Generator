(function() {
	/**
     * @class Mirror
     * @typedef  {params}  configuration parameters.
     * TODO: add class definition
     * TODO: come up with better name than mirror
     */

	window.Mirror = function(params) {
		var opts = $.extend({
			instance: null
		}, params);
	
		var canvas = opts.instance || null,
			mirrorScope = null,
			path = null,
			guide = null,
			strokeColor = "#999";
		
		/**
         * @constructor
         */

		function init() {
			if( canvas !== null ) {
				mirrorScope = new paper.PaperScope();
				mirrorScope.setup(canvas);

				setupPath();
			} else {
				throw new Error("A canvas element is required");
			}
		}

		/**
		 * @private
		 */

		function setupPath() {
			path = new mirrorScope.Path();
			path.strokeColor = strokeColor;
			path.fillColor = "#fff";
		}

		/**
		 * @private
		 */

		function update(newPath) {
			if( newPath !== null  ) {
				path.removeSegments();

				var segments = newPath.segments,
					numSegments = segments.length,
					canvasWidth = getCanvasWidth();

				for( var i=0; i<numSegments; i++ ) {
					var point = new mirrorScope.Point(canvasWidth - segments[i].point.x, segments[i].point.y);
					path.add(point);

					// var from = new mirrorScope.Point(canvasWidth - segments[i].point.x, segments[i].point.y);
					// var to = new mirrorScope.Point(canvasWidth, segments[i].point.y);

					new mirrorScope.Path.Line(
						new mirrorScope.Point(canvasWidth - segments[i].point.x, segments[i].point.y),
						new mirrorScope.Point(canvasWidth, segments[i].point.y)
					);
				}

				if( newPath.closed ) {
					path.add(new mirrorScope.Point(canvasWidth - segments[0].point.x, segments[0].point.y));
				}
				
				mirrorScope.view.update();
			}
		}

		/**
		 * @private
		 */

		function getCanvasWidth() {
			return canvas.width;
		}

		/**
		 * @public
		 */

		function clear() {
			canvas.width = canvas.width;
		}

		init();

		return {
			update: update,
			clear: clear
		};
	};
})();