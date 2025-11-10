em_maps_provider.loaded = false;
em_maps_provider.maps = {};
em_maps_provider.maps_markers = {};

em_maps_provider.load = function(){
	if( !this.loaded ){
		// Load Leaflet CSS
		if( jQuery('link#leaflet-css').length == 0 ){
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.id = "leaflet-css";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
			link.crossOrigin = "";
			document.head.appendChild(link);
		}
		// Load Leaflet JS
		if( jQuery('script#leaflet-js').length == 0 && typeof L === 'undefined' ){
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.id = "leaflet-js";
			script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
			script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
			script.crossOrigin = "";
			script.onload = () => {
				this.init();
			};
			document.body.appendChild(script);
		}else if( typeof L !== 'undefined' && !this.loaded ){
			this.init();
		}
	}
};

em_maps_provider.init = function(){
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
				var position = [location_latitude, location_longitude]; //the location coords
				if( !this.marker ){
					this.marker = L.marker(position).addTo(this.map);
				}else{
					this.marker.setLatLng(position);
				}
				var mapTitle = (jQuery('input#location-name').length > 0) ? jQuery('input#location-name').val():jQuery('input#title').val();
				this.marker.bindPopup('<strong>' + mapTitle + '</strong><br>' + jQuery('#location-address').val() + '<br>' + jQuery('#location-town').val()).openPopup();
				this.map.setView(position, 14);
				jQuery('#em-map').show();
				jQuery('#em-map-404').hide();
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
						let position = [data.location_latitude, data.location_longitude];
						if( !this.marker ){
							this.marker = L.marker(position).addTo(this.map);
						}else{
							this.marker.setLatLng(position);
						}
						this.marker.bindPopup(data.location_balloon).openPopup();
						this.map.setView(position, 14);
						jQuery('#em-map').show();
						jQuery('#em-map-404').hide();
						jQuery('#em-map-404 .em-loading-maps').hide();
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
				jQuery.getJSON('https://nominatim.openstreetmap.org/search?format=json&q=' + address, (data) => {
					if( data.length > 0 ){
						jQuery('#location-latitude').val(data[0].lat);
						jQuery('#location-longitude').val(data[0].lon);
					}
					this.refresh_map_location();
				});
			}
		});

		//Load map
		if(jQuery('#em-map').length > 0){
			this.map = L.map('em-map').setView([0, 0], 2);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(this.map);

			if( jQuery('#location-select-id').length > 0 ){
				jQuery('#location-select-id').trigger('change');
			}else{
				this.refresh_map_location();
			}
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
			this.maps[map_id] = L.map(el);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(this.maps[map_id]);
			this.maps_markers[map_id] = [];
			var bounds = [];

			jQuery.map( data, (location, i) => {
				if( !(location.location_latitude == 0 && location.location_longitude == 0) ){
					var latitude = parseFloat( location.location_latitude );
					var longitude = parseFloat( location.location_longitude );
					var location_position = [ latitude, longitude ];
					var marker = L.marker(location_position).addTo(this.maps[map_id]);
					this.maps_markers[map_id].push(marker);
					marker.bindPopup('<div class="em-map-balloon"><div id="em-map-balloon-'+map_id+'" class="em-map-balloon-content">'+ location.location_balloon +'</div></div>');
					bounds.push(location_position);
				}
			});
			if( bounds.length > 0 ){
				this.maps[map_id].fitBounds(bounds);
			}else{
				this.maps[map_id].setView([0,0], 2);
			}
		} else {
			el.firstElementChild.innerHTML = 'No locations found';
		}
	});
};

em_maps_provider.load_location = function(el){
	el = jQuery(el);
	var map_id = el.attr('id').replace('em-location-map-','');
	let lat = jQuery('#em-location-map-coords-'+map_id+' .lat').text();
	let lng = jQuery('#em-location-map-coords-'+map_id+' .lng').text();
	if( lat != 0 || lng != 0 ){
		var position = [lat, lng];
		this.maps[map_id] = L.map(el[0]).setView(position, 14);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(this.maps[map_id]);
		this.maps_markers[map_id] = L.marker(position).addTo(this.maps[map_id]);
		this.maps_markers[map_id].bindPopup(jQuery('#em-location-map-info-'+map_id+' .em-map-balloon').get(0).innerHTML).openPopup();
	}
};

em_maps_provider.load();
