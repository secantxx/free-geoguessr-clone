const geoUrl = (coordinates) => (
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates.join(','))}`
);

export default geoUrl;
