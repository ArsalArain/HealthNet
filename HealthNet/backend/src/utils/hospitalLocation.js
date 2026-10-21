function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function parseLocationSource(source) {
  if (!source || typeof source !== "object") return null;

  const lat = toFiniteNumber(source.lat ?? source.latitude ?? source.latitude_deg ?? source.y ?? source[1]);
  const lng = toFiniteNumber(source.lng ?? source.lon ?? source.longitude ?? source.longitude_deg ?? source.x ?? source[0]);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }

  return { lat, lng };
}

function parseHospitalLocation(input = {}) {
  const direct = parseLocationSource(input.geo_location)
    || parseLocationSource(input.location)
    || parseLocationSource(input.coordinates);

  if (direct) return direct;

  const lat = toFiniteNumber(input.lat ?? input.latitude ?? input.latitude_deg);
  const lng = toFiniteNumber(input.lng ?? input.lon ?? input.longitude ?? input.longitude_deg);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }

  return { lat, lng };
}

function extractHospitalLocation(hospital = {}) {
  return parseLocationSource(hospital.geo_location)
    || parseLocationSource(hospital.location)
    || parseLocationSource(hospital.coordinates)
    || parseHospitalLocation(hospital);
}

module.exports = {
  extractHospitalLocation,
  parseHospitalLocation,
  toFiniteNumber,
};