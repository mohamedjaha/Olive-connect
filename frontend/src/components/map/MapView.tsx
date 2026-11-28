import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    popupContent: React.ReactNode;
  }>;
  style?: 'mapbox://styles/mapbox/light-v11' | 'mapbox://styles/mapbox/dark-v11' | 'mapbox://styles/mapbox/satellite-v9';
}

export function MapView({ 
  center = [10.76, 34.74],
  zoom = 12,
  markers = [],
  style = 'mapbox://styles/mapbox/light-v11'
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox token non configuré (VITE_MAPBOX_TOKEN)');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style,
      center,
      zoom,
    });

    markers.forEach(({ coordinates, popupContent }) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px; max-width: 280px;">${popupContent}</div>`
      );
      
      new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom, markers, style]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full" 
      style={{ minHeight: '400px' }}
      aria-label="Carte des vergers"
    />
  );
}