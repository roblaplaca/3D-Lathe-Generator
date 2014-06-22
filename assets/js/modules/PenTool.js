(function() {
	/**
     * @class PenTool
     * @typedef  {params}  configuration parameters.
     */

	window.PenTool = function(params) {
		var opts = $.extend({
			instance: null
		}, params);
	
		var canvas = opts.instance || null,
			path = null,
			strokeColor = "#999";
		
		/**
         * @constructor
         */

		function init() {
			if( canvas !== null ) {
				
				var drawingAreaScope = new paper.PaperScope();
			
				drawingAreaScope.setup(canvas);

				var start = new drawingAreaScope.Point(0, 100);

				path = new drawingAreaScope.Path();

				path.strokeColor = strokeColor;
				
				path.moveTo(start);
				path.lineTo(start.add([ 300, 400 ]));
				path.lineTo(start.add([ 100, 400 ]));
				path.lineTo(start.add([ 0, 150 ]));
				path.closed = true;
				
				paper.view.draw();
			} else {
				throw new Error("A canvas element is required");
			}
		}

		/**
         * @returns {element} - canvas element
         * @public
         */

		function getPath() {
			return path;
		}

		init();

		return {
			getPath: getPath
		}
	};
})();