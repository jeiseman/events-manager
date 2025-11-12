(function($) {
    $(document).ready(function() {
        var mapProviderSelect = $('select[name="dbem_map_provider"]');
        if (mapProviderSelect.length) {
            mapProviderSelect.append('<option value="osm">OpenStreetMap</option>');
        }
    });
})(jQuery);
