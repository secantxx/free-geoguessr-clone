import { useEffect, useRef } from 'react';

const POINT_COLORS = {
  guess: '#8bdcf3',
  actual: '#9bea9b',
};

function ResultsMap({ actualPosition, guessPosition }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(containerRef.current, {
      center: { lat: 10, lng: 0 },
      clickableIcons: false,
      controlSize: 32,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      minZoom: 1,
      zoom: 2,
      zoomControl: true,
    });

    const guessLatLng = new window.google.maps.LatLng(...guessPosition);
    const actualLatLng = new window.google.maps.LatLng(...actualPosition);
    map.data.add({
      geometry: new window.google.maps.Data.Point(guessLatLng),
      properties: { kind: 'guess' },
    });
    map.data.add({
      geometry: new window.google.maps.Data.Point(actualLatLng),
      properties: { kind: 'actual' },
    });
    map.data.add({
      geometry: new window.google.maps.Data.LineString([guessLatLng, actualLatLng]),
      properties: { kind: 'line' },
    });
    map.data.setStyle((feature) => {
      const kind = feature.getProperty('kind');
      if (kind === 'line') {
        return { strokeColor: '#c5d1d4', strokeOpacity: 0.85, strokeWeight: 3 };
      }
      return {
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: POINT_COLORS[kind],
          fillOpacity: 1,
          strokeColor: '#10242b',
          strokeWeight: 3,
        },
      };
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(guessLatLng);
    bounds.extend(actualLatLng);
    const idle = window.google.maps.event.addListenerOnce(map, 'idle', () => {
      map.fitBounds(bounds, 72);
    });

    return () => {
      idle.remove();
      map.data.forEach((item) => map.data.remove(item));
      window.google.maps.event.clearInstanceListeners(map);
    };
  }, [actualPosition, guessPosition]);

  return <div ref={containerRef} className="results-map-canvas" aria-label="Round result map" />;
}

export default ResultsMap;
