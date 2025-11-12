<?php
/**
 * Plugin Name: Events Manager - OpenStreetMap
 * Plugin URI: https://www.example.com/
 * Description: Adds OpenStreetMap as a map provider for Events Manager.
 * Version: 1.0
 * Author: Your Name
 * Author URI: https://www.example.com/
 * License: GPL2
 */

function em_osm_enqueue_scripts() {
    if ( get_option( 'dbem_map_provider' ) === 'osm' ) {
        wp_enqueue_style( 'leaflet', 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css', array(), '1.7.1' );
        wp_enqueue_script( 'leaflet', 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js', array(), '1.7.1' );
        wp_enqueue_script( 'em-osm', plugin_dir_url( __FILE__ ) . 'js/osm.js', array( 'leaflet' ), '1.0', true );
    }
}
add_action( 'wp_enqueue_scripts', 'em_osm_enqueue_scripts' );

function em_osm_admin_enqueue_scripts( $hook_suffix ) {
    if ( 'toplevel_page_events-manager-options' === $hook_suffix ) {
        wp_enqueue_script( 'em-osm-admin', plugin_dir_url( __FILE__ ) . 'js/admin.js', array( 'jquery' ), '1.0', true );
    }
}
add_action( 'admin_enqueue_scripts', 'em_osm_admin_enqueue_scripts' );

function em_osm_localize_script( $localized_vars ) {
    if ( get_option( 'dbem_map_provider' ) === 'osm' ) {
        unset( $localized_vars['google_maps_api'] );
    }
    return $localized_vars;
}
add_filter( 'em_wp_localize_script', 'em_osm_localize_script' );
