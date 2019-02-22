"use strict";
const julian = require("./julian");
const sidereal = require("./sidereal");

const RAD = Math.PI / 180;

// Solar position, accurate to within one arcminute between 1800-2200.
// http://aa.usno.navy.mil/faq/docs/SunApprox.php
const G0 = 357.529 * RAD;
const G1 = 0.98560028 * RAD;
const Q0 = 280.459 * RAD;
const Q1 = 0.98564736 * RAD;
const L0 = 1.915 * RAD;
const L1 = 0.020 * RAD;
const E0 = 23.439 * RAD;
const E1 = -0.00000036 * RAD;
const D0 = 1.00014;
const D1 = -0.01671;
const D2 = -0.00014;

// Transit time constants.
const J0 = 0.0009; // Leap second correction
const T0 = 0.0053;
const T1 = -0.0069;

const SUNRISE_SIN_H0 = Math.sin(-0.833 * RAD);
const DAWN_SIN_H0 = Math.sin(-6 * RAD);
const RISE = Math.PI / -2;
const SET = Math.PI / 2;


function mean_anomaly(t) {
  return G0 + G1 * t;
}

function longitude(t) {
  const g = mean_anomaly(t);
  const sin_g = Math.sin(g);
  const sin_2g = Math.sin(2 * g);
  return Q0 + Q1 * t + L0 * sin_g + L1 * sin_2g;
}

// Derivative of the longitude (found using Wolfram Alpha <3)
function longitude_prime(t) {
  const g = mean_anomaly(t);
  const cos_g = Math.cos(g);
  const cos_2g = 2 * cos_g * cos_g - 1;
  return Q1 + G1 * (L0 * cos_g + 2 * L1 * cos_2g);
}

function obliquity(t) {
  return E0 + E1 * t;
}

function distance(t) {
  const g = mean_anomaly(t);
  const cos_g = Math.cos(g);
  const cos_2g = 2 * cos_g * cos_g - 1;
  return D0 + D1 * cos_g + D2 * cos_2g;
}


function julian_cycle(t, lon) {
  return Math.round(t - J0 + lon * (0.5 / 180));
}

// https://en.wikipedia.org/wiki/Sunrise_equation#Mean_solar_noon
function mean_solar_noon(t, lon) {
  return J0 - lon * (0.5 / 180) + julian_cycle(t, lon);
}

// Equation of time.
// https://en.wikipedia.org/wiki/Sunrise_equation#Solar_transit
function transit(t, lon) {
  const t0 = mean_solar_noon(t, lon);

  return t0 +
    T0 * Math.sin(mean_anomaly(t0)) +
    T1 * Math.sin(2 * longitude(t0));
}

// NOTE: This math only works for nonpolar locations!
function julian_for_altitude(sin_h0, rise, t, lat, lon) {
  const sin_dec = Math.sin(longitude(t)) * Math.sin(obliquity(t));
  const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);

  return transit(t, lon) + rise * Math.acos(
    (sin_h0 - Math.sin(lat * RAD) * sin_dec) / (Math.cos(lat * RAD) * cos_dec)
  );
}


class Solar {
  constructor(t, l, e, sin_dec, ra, d) {
    this.julian = t;
    this.longitude = l;
    this.obliquity = e;
    this.sin_declination = sin_dec;
    this.right_ascension = ra;
    this.distance = d;
  }

  static create_julian(t) {
    const l = longitude(t);
    const e = obliquity(t);
    const sin_l = Math.sin(l);
    const cos_l = Math.cos(l);
    const sin_e = Math.sin(e);
    const cos_e = Math.cos(e);
    return new Solar(
      t,
      l,
      e,
      sin_l * sin_e, // equatorial declination angle
      Math.atan2(sin_l * cos_e, cos_l), // equatorial right ascension
      distance(t)
    );
  }

  static create_ms(ms) {
    return Solar.create_julian(julian.from_ms(ms));
  }

  static create_date(date) {
    return Solar.create_ms(date.getTime());
  }

  get declination() {
    return Math.asin(this.sin_declination);
  }

  hour_angle(lon) {
    return sidereal.local(this.julian, lon) - this.right_ascension;
  }

  // Solar elevation angle.
  // https://en.wikipedia.org/wiki/Solar_zenith_angle
  // https://en.wikipedia.org/wiki/Hour_angle
  sin_elevation(lat, lon) {
    const sin_dec = this.sin_declination;
    const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);
    return Math.sin(lat * RAD) * sin_dec +
      Math.cos(lat * RAD) * cos_dec * Math.cos(this.hour_angle(lon));
  }

  // Find Julian date t given ecliptic longitude l (e.g. this is the inverse of
  // ecliptic longitude). In my experience this is accurate to 15 min or so.
  static julian_for_longitude(l) {
    // Make an initial guess based on the mean longitude.
    let t = (l - Q0) / Q1;

    // Iteratively improve the guess using Newton's method. (I've never seen
    // any significant accuracy improvement past two iterations, so I use
    // three, just to be safe. :) )
    t -= (longitude(t) - l) / longitude_prime(t);
    t -= (longitude(t) - l) / longitude_prime(t);
    t -= (longitude(t) - l) / longitude_prime(t);

    return t;
  }

  static ms_for_longitude(l) {
    return julian.from(Solar.julian_for_longitude(l));
  }

  static date_for_longitude(l) {
    return new Date(Solar.ms_for_longitude(l));
  }

  static julian_for_transit(t, lat, lon) {
    return transit(t, lon);
  }

  static ms_for_transit(ms, lat, lon) {
    return julian.from(Solar.julian_for_transit(julian.to(ms), lat, lon));
  }

  static date_for_transit(date, lat, lon) {
    return new Date(Solar.ms_for_transit(date.getTime(), lat, lon));
  }

  static julian_for_rise(t, lat, lon) {
    return julian_for_altitude(SUNRISE_SIN_H0, RISE, t, lat, lon);
  }

  static ms_for_rise(ms, lat, lon) {
    return julian.from(Solar.julian_for_rise(julian.to(ms), lat, lon));
  }

  static date_for_rise(date, lat, lon) {
    return new Date(Solar.ms_for_rise(date.getTime(), lat, lon));
  }

  static julian_for_set(t, lat, lon) {
    return julian_for_altitude(SUNRISE_SIN_H0, SET, t, lat, lon);
  }

  static ms_for_set(ms, lat, lon) {
    return julian.from(Solar.julian_for_set(julian.to(ms), lat, lon));
  }

  static date_for_set(date, lat, lon) {
    return new Date(Solar.ms_for_set(date.getTime(), lat, lon));
  }

  static julian_for_dawn(t, lat, lon) {
    return julian_for_altitude(DAWN_SIN_H0, RISE, t, lat, lon);
  }

  static ms_for_dawn(ms, lat, lon) {
    return julian.from(Solar.julian_for_dawn(julian.to(ms), lat, lon));
  }

  static date_for_dawn(date, lat, lon) {
    return new Date(Solar.ms_for_dawn(date.getTime(), lat, lon));
  }

  static julian_for_dusk(t, lat, lon) {
    return julian_for_altitude(DAWN_SIN_H0, SET, t, lat, lon);
  }

  static ms_for_dusk(ms, lat, lon) {
    return julian.from(Solar.julian_for_dusk(julian.to(ms), lat, lon));
  }

  static date_for_dusk(date, lat, lon) {
    return new Date(Solar.ms_for_dusk(date.getTime(), lat, lon));
  }
}


module.exports = Solar;
