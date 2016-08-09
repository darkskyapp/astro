"use strict";
const astro = require("../index");

/* Solar position, accurate to within one arcminute between 1800-2200.
 * http://aa.usno.navy.mil/faq/docs/SunApprox.php */
const G0 = 357.529      * Math.PI / 180,
      G1 =   0.98560028 * Math.PI / 180,
      Q0 = 280.459      * Math.PI / 180,
      Q1 =   0.98564736 * Math.PI / 180,
      L0 =   1.915      * Math.PI / 180,
      L1 =   0.020      * Math.PI / 180,
      E0 =  23.439      * Math.PI / 180,
      E1 =  -0.00000036 * Math.PI / 180;

function mean_anomaly(t) {
  return G0 + G1 * t;
}

function longitude(t) {
  const g = mean_anomaly(t),
        sin_g = Math.sin(g),
        sin_2g = Math.sin(2 * g);
  return Q0 + Q1 * t + L0 * sin_g + L1 * sin_2g;
}

/* This is simply the derivative of `longitude`, found using Wolfram
 * Alpha. <3 */
function longitude_prime(t) {
  const g = mean_anomaly(t),
        cos_g  = Math.cos(g),
        cos_2g = 2 * cos_g * cos_g - 1;
  return Q1 + G1 * (L0 * cos_g + 2 * L1 * cos_2g);
}

/* In my experience this should be accurate to fifteen minutes or so. */
function longitude_julian(l) {
  /* Make an initial guess based on the mean longitude. */
  let t = (l - Q0) / Q1;

  /* Iteratively improve the guess using Newton's method. (I've never seen
   * any significant accuracy improvement past two iterations, so I use
   * three, just to be safe. :) ) */
  t = t - (longitude(t) - l) / longitude_prime(t);
  t = t - (longitude(t) - l) / longitude_prime(t);
  t = t - (longitude(t) - l) / longitude_prime(t);

  return t;
}

function obliquity(t) {
  return E0 + E1 * t;
}

function right_ascension(t) {
  const l = longitude(t);
  return Math.atan2(Math.sin(l) * Math.cos(obliquity(t)), Math.cos(l));
}

function declination(t) {
  return Math.asin(Math.sin(longitude(t)) * Math.sin(obliquity(t)));
}

const D0 =  1.00014,
      D1 = -0.01671,
      D2 = -0.00014;

function distance(t) {
  const g = mean_anomaly(t),
        cos_g  = Math.cos(g),
        cos_2g = 2 * cos_g * cos_g - 1;
  return D0 + D1 * cos_g + D2 * cos_2g;
}

/* Transit time constants. */
const J0 = 0.0009, // Leap second correction
      T0 = 0.0053,
      T1 = 0.0069;

function julian_cycle(t, lon) {
  return Math.round(t - J0 + lon/(2 * Math.PI));
}

/* https://en.wikipedia.org/wiki/Sunrise_equation#Mean_solar_noon */
function mean_solar_noon(t, lon) {
  return J0 - lon / (2 * Math.PI) + julian_cycle(t, lon);
}
/* Equation of time.
https://en.wikipedia.org/wiki/Sunrise_equation#Solar_transit */
function transit(t, lat, lon) {
  const t0 = mean_solar_noon(t, lon);
  return t0 +
    T0 * Math.sin(mean_anomaly(t0)) -
    T1 * Math.sin(2 * longitude(t0));
}

function altitude_julian_direct(h0, rise, lat, trans, decl) {
  return trans +
    rise *
    Math.acos(
      (Math.sin(h0)  - Math.sin(lat) * Math.sin(decl)) /
      (Math.cos(lat) * Math.cos(decl))
    ) *
    (12 / Math.PI / 24);
}

function altitude_julian(h0, rise, t, lat, lon) {
  return altitude_julian_direct(
    h0,
    rise,
    lat,
    transit(t, lat, lon),
    declination(t)
  );
}

/* Notable solar elevation angles.
 * https://en.wikipedia.org/wiki/Sunrise#Angle
 * https://en.wikipedia.org/wiki/Twilight#Civil_twilight */
const SUNRISE = -0.833 * Math.PI / 180,
      DAWN    = -6     * Math.PI / 180,
      RISE    = -1,
      SET     =  1;


function rise(t, lat, lon) {
  return altitude_julian(SUNRISE, RISE, t, lat, lon);
}

function set(t, lat, lon) {
  return altitude_julian(SUNRISE, SET,  t, lat, lon);
}

function dawn(t, lat, lon) {
  return altitude_julian(DAWN,    RISE, t, lat, lon);
}

function dusk(t, lat, lon) {
  return altitude_julian(DAWN,    SET,  t, lat, lon);
}

exports.longitude        = longitude;
exports.longitude_julian = longitude_julian;
exports.obliquity        = obliquity;
exports.right_ascension  = right_ascension;
exports.declination      = declination;
exports.distance         = distance;
exports.transit          = transit;
exports.altitude_julian  = altitude_julian;
exports.rise             = rise;
exports.set              = set;
exports.dawn             = dawn;
exports.dusk             = dusk;

/* Solar elevation angle.
 * https://en.wikipedia.org/wiki/Solar_zenith_angle
 * https://en.wikipedia.org/wiki/Hour_angle */
function sin_elevation(t, lat, lon) {
  const l     = longitude(t),
        e     = obliquity(t),
        sin_l = Math.sin(l),
        cos_l = Math.cos(l),
        sin_e = Math.sin(e),
        cos_e = Math.cos(e),
        sin_d = sin_l * sin_e, // sin_declination
        cos_d = Math.sqrt(1 - sin_d * sin_d),
        ra    = Math.atan2(sin_l * cos_e, cos_l), // right ascension
        h     = astro.local_sidereal_time(t, lon) - ra, // hour angle
        cos_h = Math.cos(h);

  return Math.sin(lat) * sin_d + Math.cos(lat) * cos_d * cos_h;
}

function elevation(t, lat, lon) {
  return Math.asin(sin_elevation(t, lat, lon));
}

exports.sin_elevation = sin_elevation;
exports.elevation = elevation;
