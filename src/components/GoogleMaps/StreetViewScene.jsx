import { useEffect, useRef } from 'react';

import genRandomCoords from '../../utils/random/gen-random-coords';

function StreetViewScene({ instanceRef, onError, onHeadingChange, onReady, region }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const panorama = new window.google.maps.StreetViewPanorama(containerRef.current, {
      addressControl: false,
      clickToGo: true,
      disableDefaultUI: true,
      fullscreenControl: false,
      linksControl: true,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: false,
      pov: { heading: Math.random() * 360, pitch: 0 },
      showRoadLabels: false,
      visible: true,
      zoomControl: false,
    });
    const service = new window.google.maps.StreetViewService();
    instanceRef.current = panorama;

    const headingListener = panorama.addListener('pov_changed', () => {
      onHeadingChange((360 - panorama.getPov().heading) % 360);
    });

    async function findPanorama() {
      for (let attempt = 0; attempt < 16 && !cancelled; attempt += 1) {
        try {
          const [lat, lng] = genRandomCoords(region);
          const { data } = await service.getPanorama({
            location: { lat, lng },
            preference: window.google.maps.StreetViewPreference.NEAREST,
            radius: 15_000,
            source: window.google.maps.StreetViewSource.OUTDOOR,
          });

          if (cancelled || !data.location?.latLng || !data.links?.length) continue;
          const position = [data.location.latLng.lat(), data.location.latLng.lng()];
          panorama.setPano(data.location.pano);
          panorama.setPov({ heading: Math.random() * 360, pitch: 0 });
          panorama.setZoom(0);
          onReady(position);
          return;
        } catch {
          // Empty Street View coverage is expected while sampling random points.
        }
      }

      if (!cancelled) {
        onError('No Street View panorama was found in this region.');
      }
    }

    void findPanorama();

    return () => {
      cancelled = true;
      headingListener.remove();
      window.google.maps.event.clearInstanceListeners(panorama);
      instanceRef.current = null;
    };
  }, [instanceRef, onError, onHeadingChange, onReady, region]);

  return <div ref={containerRef} className="street-view-canvas" aria-label="Google Street View" />;
}

export default StreetViewScene;
