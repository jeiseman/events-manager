em_maps_provider.load = function(){
	if( !this.loaded ){
		if ( jQuery('script#google-maps').length == 0 && ( typeof google !== 'object' || typeof google.maps !== 'object' ) ){
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.id = "google-maps";
			var proto = (EM.is_ssl) ? 'https:' : 'http:';
			if( typeof EM.google_maps_api !== 'undefined' ){
				script.src = proto + '//maps.google.com/maps/api/js?v=quarterly&libraries=places&callback=em_maps_provider.init&key='+EM.google_maps_api;
			}else{
				script.src = proto + '//maps.google.com/maps/api/js?v=quarterly&libraries=places&callback=em_maps_provider.init';
			}
			document.body.appendChild(script);
		}else if( typeof google === 'object' && typeof google.maps === 'object' && !this.loaded ){
			this.init();
		}else if( jQuery('script#google-maps').length > 0 ){
			jQuery(window).load(function(){ if( !this.loaded ) this.init(); }); //google isn't loaded so wait for page to load resources
		}
	}
};
em_maps_provider.init = function(){
	this.loaded = false;
	this.maps = {};
	this.maps_markers = {};
	this.infoWindow = null;

	//Find all the maps on this page and load them
	jQuery('div.em-location-map').each( (index, el) => { this.load_location(el); } );
	jQuery('div.em-locations-map').each( (index, el) => { this.load_locations(el); });

	//Location stuff - only needed if inputs for location exist
	if( jQuery('select#location-select-id, input#location-address').length > 0 ){
		//load map info
		this.refresh_map_location = function(){
			var location_latitude = jQuery('#location-latitude').val();
			var location_longitude = jQuery('#location-longitude').val();
			let hasCoords = location_latitude != 0 || location_longitude != 0;
			if( hasCoords ){
				var position = new google.maps.LatLng(location_latitude, location_longitude); //the location coords
				this.marker.setPosition(position);
				var mapTitle = (jQuery('input#location-name').length > 0) ? jQuery('input#location-name').val():jQuery('input#title').val();
				this.marker.setTitle( mapTitle );
				jQuery('#em-map').show();
				jQuery('#em-map-404').hide();
				google.maps.event.trigger(this.map, 'resize');
				this.map.setCenter(position);
				this.map.panBy(40,-55);
				this.infoWindow.setContent(
					'<div id="location-balloon-content"><strong>' + mapTitle + '</strong><br>' +
					jQuery('#location-address').val() +
					'<br>' + jQuery('#location-town').val() +
					'</div>'
				);
				this.infoWindow.open(this.map, this.marker);
				jQuery(document).triggerHandler('em_maps_location_hook', [this.map, this.infoWindow, this.marker, 0]);
			} else {
				jQuery('#em-map').hide();
				jQuery('#em-map-404').show();
			}
		};

		//Add listeners for changes to address
		this.get_map_by_id = function(id){
			if(jQuery('#em-map').length > 0){
				jQuery('#em-map-404 .em-loading-maps').show();
				jQuery.getJSON(document.URL,{ em_ajax_action:'get_location', id:id }, (data) => {
					let hasCoords = data.location_latitude != 0 && data.location_longitude != 0;
					if( hasCoords ){
						let loc_latlng = new google.maps.LatLng(data.location_latitude, data.location_longitude);
						this.marker.setPosition(loc_latlng);
						this.marker.setTitle( data.location_name );
						this.marker.setDraggable(false);
						jQuery('#em-map').show();
						jQuery('#em-map-404').hide();
						jQuery('#em-map-404 .em-loading-maps').hide();
						this.map.setCenter(loc_latlng);
						this.map.panBy(40,-55);
						this.infoWindow.setContent( '<div id="location-balloon-content">'+ data.location_balloon +'</div>');
						this.infoWindow.open(this.map, this.marker);
						google.maps.event.trigger(this.map, 'resize');
						jQuery(document).triggerHandler('em_maps_location_hook', [this.map, this.infoWindow, this.marker, 0]);
					}else{
						jQuery('#em-map').hide();
						jQuery('#em-map-404').show();
						jQuery('#em-map-404 .em-loading-maps').hide();
					}
				});
			}
		};
		jQuery('#location-select-id, input#location-id').on('change', () => { this.get_map_by_id( jQuery(this).val() ); } );
		jQuery('#location-name, #location-town, #location-address, #location-state, #location-postcode, #location-country').on('change', () => {
			var addresses = [ jQuery('#location-address').val(), jQuery('#location-town').val(), jQuery('#location-state').val(), jQuery('#location-postcode').val() ];
			var address = '';
			jQuery.each( addresses, function(i, val){
				if( val != '' ){
					address = ( address == '' ) ? address+val:address+', '+val;
				}
			});
			if( jQuery('#location-country option:selected').val() != 0 ){
				address = ( address == '' ) ? address+jQuery('#location-country option:selected').text():address+', '+jQuery('#location-country option:selected').text();
			}
			if( address != '' && jQuery('#em-map').length > 0 ){
				let geocoder = new google.maps.Geocoder();
				geocoder.geocode( { 'address': address }, (results, status) => {
					if (status == google.maps.GeocoderStatus.OK) {
						jQuery('#location-latitude').val(results[0].geometry.location.lat());
						jQuery('#location-longitude').val(results[0].geometry.location.lng());
					}
					this.refresh_map_location();
				});
			}
		});

		//Load map
		if(jQuery('#em-map').length > 0){
			var em_LatLng = new google.maps.LatLng(0, 0);
			var map_options = {
				zoom: 14,
				center: em_LatLng,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControl: false,
				gestureHandling: 'cooperative'
			};
			if( typeof EM.google_maps_styles !== 'undefined' ){ map_options.styles = EM.google_maps_styles; }
			this.map = new google.maps.Map( document.getElementById('em-map'), map_options);
			this.marker = new google.maps.Marker({
				position: em_LatLng,
				map: this.map,
				draggable: true
			});
			this.infoWindow = new google.maps.InfoWindow({
				content: ''
			});
			var geocoder = new google.maps.Geocoder();
			google.maps.event.addListener(this.infoWindow, 'domready', function() {
				document.getElementById('location-balloon-content').parentNode.style.overflow='';
				document.getElementById('location-balloon-content').parentNode.parentNode.style.overflow='';
			});
			google.maps.event.addListener(this.marker, 'dragend', () => {
				var position = this.marker.getPosition();
				jQuery('#location-latitude').val(position.lat());
				jQuery('#location-longitude').val(position.lng());
				this.map.setCenter(position);
				this.map.panBy(40,-55);
			});
			if( jQuery('#location-select-id').length > 0 ){
				jQuery('#location-select-id').trigger('change');
			}else{
				this.refresh_map_location();
			}
			jQuery(document).triggerHandler('em_map_loaded', [this.map, this.infoWindow, this.marker]);
		}
	}
	this.loaded = true;
	jQuery(document).triggerHandler('em_maps_loaded');
};

em_maps_provider.load_locations = function( element ){
	let el = element;
	let map_id = el.getAttribute('id').replace('em-locations-map-','');
	let em_data;
	if ( document.getElementById('em-locations-map-coords-'+map_id) ) {
		em_data = JSON.parse( document.getElementById('em-locations-map-coords-'+map_id).text );
	} else {
		let coords_data = el.parentElement.querySelector('.em-locations-map-coords');
		if ( coords_data ) {
			em_data = JSON.parse( coords_data.text );
		} else {
			em_data = {};
		}
	}
	jQuery.getJSON(document.URL, em_data , (data) => {
		if( data.length > 0 ){
			var map_options = { mapTypeId: google.maps.MapTypeId.ROADMAP };
			if( typeof EM.google_map_id_styles == 'object' && typeof EM.google_map_id_styles[map_id] !== 'undefined' ){ map_options.styles = EM.google_map_id_styles[map_id]; }
			else if( typeof EM.google_maps_styles !== 'undefined' ){ map_options.styles = EM.google_maps_styles; }
			jQuery(document).triggerHandler('em_maps_locations_map_options', map_options);
			var marker_options = {};
			jQuery(document).triggerHandler('em_maps_location_marker_options', marker_options);

			this.maps[map_id] = new google.maps.Map(el, map_options);
			this.maps_markers[map_id] = [];
			var bounds = new google.maps.LatLngBounds();

			jQuery.map( data, (location, i) => {
				if( !(location.location_latitude == 0 && location.location_longitude == 0) ){
					var latitude = parseFloat( location.location_latitude );
					var longitude = parseFloat( location.location_longitude );
					var location_position = new google.maps.LatLng( latitude, longitude );
					jQuery.extend(marker_options, {
						position: location_position,
						map: this.maps[map_id]
					})
					var marker = new google.maps.Marker(marker_options);
					this.maps_markers[map_id].push(marker);
					marker.setTitle(location.location_name);
					var myContent = '<div class="em-map-balloon"><div id="em-map-balloon-'+map_id+'" class="em-map-balloon-content">'+ location.location_balloon +'</div></div>';
					this.map_infobox(marker, myContent, this.maps[map_id]);
					bounds.extend(new google.maps.LatLng(latitude,longitude))
				}
			});
			this.maps[map_id].fitBounds(bounds);
		} else {
			el.firstElementChild.innerHTML = 'No locations found';
		}
	});
};

em_maps_provider.load_location = function(el){
	el = jQuery(el);
	var map_id = el.attr('id').replace('em-location-map-','');
	let em_LatLng = new google.maps.LatLng( jQuery('#em-location-map-coords-'+map_id+' .lat').text(), jQuery('#em-location-map-coords-'+map_id+' .lng').text());
	var map_options = {
		zoom: 14,
		center: em_LatLng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		gestureHandling: 'cooperative'
	};
	if( typeof EM.google_map_id_styles == 'object' && typeof EM.google_map_id_styles[map_id] !== 'undefined' ){ map_options.styles = EM.google_map_id_styles[map_id]; }
	else if( typeof EM.google_maps_styles !== 'undefined' ){ map_options.styles = EM.google_maps_styles; }
	jQuery(document).triggerHandler('em_maps_location_map_options', map_options);
	this.maps[map_id] = new google.maps.Map( document.getElementById('em-location-map-'+map_id), map_options);
	var marker_options = {
		position: em_LatLng,
		map: this.maps[map_id]
	};
	jQuery(document).triggerHandler('em_maps_location_marker_options', marker_options);
	this.maps_markers[map_id] = new google.maps.Marker(marker_options);
	this.infoWindow = new google.maps.InfoWindow({ content: jQuery('#em-location-map-info-'+map_id+' .em-map-balloon').get(0) });
	this.infoWindow.open(this.maps[map_id],this.maps_markers[map_id]);
	this.maps[map_id].panBy(40,-70);
};

em_maps_provider.map_infobox = function(marker, message, map) {
	var iw = new google.maps.InfoWindow({ content: message });
	google.maps.event.addListener(marker, 'click', () => {
		if( this.infoWindow ) this.infoWindow.close();
		this.infoWindow = iw;
		iw.open(map,marker);
	});
};

em_maps_provider.load();
