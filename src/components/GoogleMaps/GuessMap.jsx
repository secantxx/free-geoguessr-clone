import { useEffect, useRef } from 'react';

const GUESS_STYLE = {
  scale: 9,
  fillColor: '#8bdcf3',
  fillOpacity: 1,
  strokeColor: '#10242b',
  strokeWeight: 3,
};

function GuessMap({ onGuessChange, resizeKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(containerRef.current, {
      center: { lat: 10, lng: 0 },
      clickableIcons: false,
      controlSize: 28,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      minZoom: 2,
      restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: false,
      },
      zoom: 2,
      zoomControl: true,
    });
    mapRef.current = map;
    map.data.setStyle({
      icon: { ...GUESS_STYLE, path: window.google.maps.SymbolPath.CIRCLE },
    });

    let feature = null;
    const clickListener = map.addListener('click', (event) => {
      if (!event.latLng) return;
      if (feature) map.data.remove(feature);
      feature = map.data.add({ geometry: new window.google.maps.Data.Point(event.latLng) });
      onGuessChange([event.latLng.lat(), event.latLng.lng()]);
    });

    return () => {
      clickListener.remove();
      map.data.forEach((item) => map.data.remove(item));
      window.google.maps.event.clearInstanceListeners(map);
      mapRef.current = null;
    };
  }, [onGuessChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = window.setTimeout(() => window.google.maps.event.trigger(map, 'resize'), 240);
    return () => window.clearTimeout(id);
  }, [resizeKey]);

  return <div ref={containerRef} className="guess-map-canvas" aria-label="Guess map" />;
}

export default GuessMap;
