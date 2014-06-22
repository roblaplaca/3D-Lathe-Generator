(function() {
	/**
     * Sets up canvas elements
     *
     * @class LatheWorkArea
     * @typedef  {params}  configuration parameters.
     */

	window.LatheWorkArea = function(params) {
		var opts = $.extend({
			instance: null
		}, params);
	
		var $module = opts.instance || null,
			MIRROR_CANVAS_CLASS = "mirror",
			DRAWING_CANVAS_CLASS = "drawingArea";
		
		/**
         * @constructor
         */

		function init() {
			if( $module !== null ) {
				var latheToolHeight = $module.height(),
					latheToolWidth = $module.width(),
					latheToolWidthHalved = latheToolWidth / 2;

				appendCanvas(MIRROR_CANVAS_CLASS, latheToolHeight, latheToolWidthHalved);
				appendCanvas(DRAWING_CANVAS_CLASS, latheToolHeight, latheToolWidthHalved);
			} else {
				throw new Error("instance is a required parameter");
			}
		}

		/**
         * @private
         */

		function appendCanvas(className, height, width) {
			$module.append('<canvas class="' + className + '" height="' + height + '" width="' + width + '" />');
		}

		/**
         * @returns {element} - canvas element
         * @public
         */

		function getMirrorCanvas() {
			return getCanvas(MIRROR_CANVAS_CLASS);
		}

		/**
         * @returns {element} - canvas element
         * @public
         */

		function getDrawingCanvas() {
			return getCanvas(DRAWING_CANVAS_CLASS);
		}

		/**
         * @returns {element} - canvas element
         * @private
         */

		function getCanvas(className) {
			return $module.find("." + className).get(0);
		}

		/**
         * @params {int} mode - the index of the current slide
         * @public
         */

		function setMode(mode) {

		}

		init();

		return {
			setMode: setMode,
			getDrawingCanvas: getDrawingCanvas,
			getMirrorCanvas: getMirrorCanvas
		};
	};
})();