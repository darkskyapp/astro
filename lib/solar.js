"use strict";
const julian = require("./julian");
const sidereal = require("./sidereal");

const RAD = Math.PI / 180;


// Solar position, accurate to within one arcminute between 1800-2200.
// http://aa.usno.navy.mil/faq/docs/SunApprox.php

// mean anomaly
const G0 = 357.529 * RAD;
const G1 = 0.98560028 * RAD;
function _mean_anomaly(t) {
  return G0 + G1 * t;
}

// ecliptic longitude
const Q0 = 280.459 * RAD;
const Q1 = 0.98564736 * RAD;
const L0 = 1.915 * RAD;
const L1 = 0.020 * RAD;
function _longitude(t) {
  const g = _mean_anomaly(t);
  return Q0 + Q1 * t + L0 * Math.sin(g) + L1 * Math.sin(2 * g);
}

// derivative of ecliptic longitude
function _longitude_prime(t) {
  const g = _mean_anomaly(t);
  const cos_g = Math.cos(g);
  const cos_2g = 2 * cos_g * cos_g - 1;
  return Q1 + G1 * (L0 * cos_g + 2 * L1 * cos_2g);
}

// inverse of ecliptic longitude (that is, given a longitude, return the time).
// accurate to 15 minutes or so.
function _inverse_longitude(l) {
  // Make an initial guess based on the mean longitude.
  let t = (l - Q0) / Q1;

  // Iteratively improve the guess using Newton's method. (I've never seen
  // any significant accuracy improvement past two iterations, so I use
  // three, just to be safe. :) )
  t -= (_longitude(t) - l) / _longitude_prime(t);
  t -= (_longitude(t) - l) / _longitude_prime(t);
  t -= (_longitude(t) - l) / _longitude_prime(t);

  return t;
}

// obliquity of the ecliptic
const E0 = 23.439 * RAD;
const E1 = -0.00000036 * RAD;
function _obliquity(t) {
  return E0 + E1 * t;
}

// distance to the sun in AU
const D0 = 1.00014;
const D1 = -0.01671;
const D2 = -0.00014;
function _distance(t) {
  const g = _mean_anomaly(t);
  const cos_g = Math.cos(g);
  const cos_2g = 2 * cos_g * cos_g - 1;
  return D0 + D1 * cos_g + D2 * cos_2g;
}

function _sin_declination(t) {
  return Math.sin(_longitude(t)) * Math.sin(_obliquity(t));
}

function _right_ascension(t) {
  const l = _longitude(t);
  return Math.atan2(Math.sin(l) * Math.cos(_obliquity(t)), Math.cos(l));
}

// solar transit time
const J0 = 0.0009; // Leap second correction
function _julian_cycle(t, lon) {
  return Math.round(t - J0 + lon * (0.5 / Math.PI));
}

// https://en.wikipedia.org/wiki/Sunrise_equation#Mean_solar_noon
function _mean_solar_noon(t, lon) {
  return J0 - lon * (0.5 / Math.PI) + _julian_cycle(t, lon);
}

// https://en.wikipedia.org/wiki/Sunrise_equation#Solar_transit
const T0 = 0.0053;
const T1 = -0.0069;
function _transit(t, lon) {
  const t0 = _mean_solar_noon(t, lon);
  return t0 + T0 * Math.sin(_mean_anomaly(t0)) + T1 * Math.sin(2 * _longitude(t0));
}

function _altitude(sin_h0, rise, t, lat, lon) {
  const sin_dec = _sin_declination(t);
  const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);

  return _transit(t, lon) + rise * Math.acos(
    (sin_h0 - Math.sin(lat) * sin_dec) / (Math.cos(lat) * cos_dec)
  );
}


// Display methods. Internally we work with Julian dates and radians.
// Externally we work with millisecond timestamps and degrees (for input) and
// radians (for output).

function latitude() {
  return 0;
}

function longitude(ms) {
  return _longitude(julian.to(ms));
}

function inverse_longitude(l) {
  return julian.from(_inverse_longitude(l));
}

function obliquity(ms) {
  return _obliquity(julian.to(ms));
}

function distance(ms) {
  return _distance(julian.to(ms));
}

function declination(ms) {
  return Math.asin(_sin_declination(julian.to(ms)));
}

function right_ascension(ms) {
  return _right_ascension(julian.to(ms));
}

function sin_elevation(ms, lat, lon) {
  const t = julian.to(ms);
  const sin_lat = Math.sin(lat * RAD);
  const cos_lat = Math.cos(lat * RAD);
  const sin_dec = _sin_declination(t);
  const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);
  const hour_angle = sidereal.local(t, lon * RAD) - _right_ascension(t);
  return sin_lat * sin_dec + cos_lat * cos_dec * Math.cos(hour_angle);
}

// Solar position classes. Helpful if you need to cache results!
class Location {
  constructor(hour_angle, sin_elevation) {
    this.hour_angle = hour_angle;
    this.sin_elevation = sin_elevation;
  }

  get elevation() {
    return Math.asin(this.sin_elevation);
  }
}

class Time {
  constructor(time, longitude, obliquity, sin_declination, right_ascension) {
    this.time = time;
    this.longitude = longitude;
    this.obliquity = obliquity;
    this.sin_declination = sin_declination;
    this.right_ascension = right_ascension;
  }

  get declination() {
    return Math.asin(this.sin_declination);
  }

  get distance() {
    return _distance(julian.to(this.time));
  }

  hour_angle(lon) {
    return sidereal.local(julian.to(this.time), lon * RAD) - this.right_ascension;
  }

  observer(lat, lon) {
    // https://en.wikipedia.org/wiki/Hour_angle
    const hour_angle = this.hour_angle(lon);

    // Solar elevation angle.
    // https://en.wikipedia.org/wiki/Solar_zenith_angle
    const sin_lat = Math.sin(lat * RAD);
    const cos_lat = Math.cos(lat * RAD);
    const sin_dec = this.sin_declination;
    const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);
    return new Location(
      hour_angle,
      sin_lat * sin_dec + cos_lat * cos_dec * Math.cos(hour_angle)
    );
  }
}

function position(ms) {
  const t = julian.to(ms);
  const l = _longitude(t);
  const e = _obliquity(t);
  const sin_l = Math.sin(l);
  const cos_l = Math.cos(l);
  const sin_e = Math.sin(e);
  const cos_e = Math.cos(e);
  return new Time(
    ms,
    l,
    e,
    sin_l * sin_e, // sin declination
    Math.atan2(sin_l * cos_e, cos_l) // right ascension
  );
}

function transit(ms, lat, lon) {
  return julian.from(_transit(julian.to(ms), lon * RAD));
}

const SUNRISE_SIN_H0 = Math.sin(-0.833 * RAD);
const DAWN_SIN_H0 = Math.sin(-6 * RAD);
const RISE = -0.5 / Math.PI;
const SET = 0.5 / Math.PI;
function rise(ms, lat, lon) {
  return julian.from(_altitude(SUNRISE_SIN_H0, RISE, julian.to(ms), lat * RAD, lon * RAD));
}

function set(ms, lat, lon) {
  return julian.from(_altitude(SUNRISE_SIN_H0, SET, julian.to(ms), lat * RAD, lon * RAD));
}

function dawn(ms, lat, lon) {
  return julian.from(_altitude(DAWN_SIN_H0, RISE, julian.to(ms), lat * RAD, lon * RAD));
}

function dusk(ms, lat, lon) {
  return julian.from(_altitude(DAWN_SIN_H0, SET, julian.to(ms), lat * RAD, lon * RAD));
}


exports.latitude = latitude;
exports.longitude = longitude;
exports.inverse_longitude = inverse_longitude;
exports.obliquity = obliquity;
exports.distance = distance;
exports.declination = declination;
exports.right_ascension = right_ascension;
exports.sin_elevation = sin_elevation;
exports.position = position;
exports.transit = transit;
exports.rise = rise;
exports.set = set;
exports.dawn = dawn;
exports.dusk = dusk;
