(function() {
	/**
     * @class PenTool
     * @typedef  {params}  configuration parameters.
     */

	window.PenTool = function(params) {
		var opts = $.extend({
			instance: null,
			onPathClosed: $.noop
		}, params);
	
		var canvas = opts.instance || null,
			drawingAreaScope = null,
			path, currentSegment, mode, type,
			types = ['point', 'handleIn', 'handleOut'],
			strokeColor = "#999";
		
		/**
         * @constructor
         */

		function init() {
			if( canvas !== null ) {
				drawingAreaScope = new paper.PaperScope();
				drawingAreaScope.setup(canvas);

				bindEvents();
			} else {
				throw new Error("A canvas element is required");
			}
		}

		/**
         * @private
         */

		function bindEvents() {
			var tool = new drawingAreaScope.Tool();

			tool.onMouseDown = onMouseDown;
			tool.onMouseDrag = onMouseDrag;
		}

		/**
         * @private
         */

		function findHandle(point) {
			for (var i = 0, l = path.segments.length; i < l; i++) {
				for (var j = 0; j < 3; j++) {
					var type = types[j];
					var segment = path.segments[i];
					var segmentPoint = type == 'point' ? segment.point : segment.point.add(segment[type]);
					var distance = (point.subtract(segmentPoint)).length;

					if (distance < 3) {
						return {
							type: type,
							segment: segment
						};
					}
				}
			}
			return null;
		}

		/**
         * @private
         */

		function onMouseDown(event) {
			if (currentSegment)
				currentSegment.selected = false;
			mode = type = currentSegment = null;

			if (!path) {
				path = new drawingAreaScope.Path();
				// path.strokeColor = strokeColor;
			}

			var result = findHandle(event.point);

			if (result) {
				currentSegment = result.segment;
				type = result.type;
				if (path.segments.length > 1 && result.type == 'point' && result.segment.index === 0) {
					mode = 'close';
					path.closed = true;
					opts.onPathClosed();
					// path.selected = false;
					// path = null;
				}
			}
			
			mode = currentSegment ? 'move' : 'add';

			if (!currentSegment && !path.closed)
				currentSegment = path.add(event.point);
			currentSegment.selected = true;
		}

		/**
         * @private
         */

		function onMouseDrag(event) {
			if (mode == 'move' && type == 'point') {
				currentSegment.point = event.point;
				opts.onPathClosed();
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
		};
	};
})();