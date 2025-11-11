var em_maps_provider = {};

jQuery(document).ready( function($){
	if( typeof EM.map_provider !== 'undefined' ){
		if( EM.map_provider === 'google' ){
			em_maps_provider = em_maps_provider_google;
			em_maps_provider.load();
		}else if( EM.map_provider === 'osm' ){
			em_maps_provider = em_maps_provider_osm;
			em_maps_provider.load();
		}
	}
});