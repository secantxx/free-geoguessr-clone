const readableDistance = (distance) => (
  distance >= 1000
    ? `${(distance / 1000).toFixed(2)} km`
    : `${Math.floor(distance)} m`
);

export default readableDistance;
