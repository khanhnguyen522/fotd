const RAIN_THRESHOLD_MM = 0.1; // any measurable current precipitation counts as "rainy"
const WIND_THRESHOLD_MPH = 15; // sustained wind above this is noticeably windy

const isRainy = (precipitationMm) => precipitationMm > RAIN_THRESHOLD_MM;
const isWindy = (windSpeedMph) => windSpeedMph > WIND_THRESHOLD_MPH;

module.exports = { isRainy, isWindy };
