var em_maps_provider = {};

jQuery(document).ready( function($){
	if( typeof EM.map_provider !== 'undefined' ){
		if( EM.map_provider === 'google' ){
			$.getScript( EM.url + '/includes/js/src/parts/google.js' );
		}else if( EM.map_provider === 'osm' ){
			$.getScript( EM.url + '/includes/js/src/parts/osm.js' );
		}
	}
});