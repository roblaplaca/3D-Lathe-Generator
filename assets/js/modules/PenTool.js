(function() {
	window.PenTool = function(params) {
		var opts = $.extend({
			instance: null
		}, params);
	
		var $module = opts.instance || null;
		
		function init() {
			if( $module !== null ) {
				
			} else {
				throw new Error("instance is a required parameter");
			}
		}
	};
})();