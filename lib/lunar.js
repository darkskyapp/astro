"use strict";
const astro = require("../index");

function limit_angle(radians) {
  return radians - Math.floor(radians / (2 * Math.PI)) * (2 * Math.PI);
}

/* Lunar position, accurate to about ten minutes between 1950-2050,
 * http://aa.quae.nl/en/reken/hemelpositie.html#2 */
const Q0 = 218.316 * Math.PI / 180;
const Q1 = 13.176396 * Math.PI / 180;
const M0 = 134.963 * Math.PI / 180;
const M1 = 13.064993 * Math.PI / 180;
const F0 = 93.272 * Math.PI / 180;
const F1 = 13.229350 * Math.PI / 180;
const L0 = 6.289 * Math.PI / 180;
const L1 = 5.128 * Math.PI / 180;
const E0 = 23.439 * Math.PI / 180;
const E1 = -0.00000036 * Math.PI / 180;

/* Geocentric ecliptic longitude compared to the equinox */
function ecliptic_equinox_longitude(t) {
  return Q0 + Q1 * t;
}

function mean_anomaly(t) {
  return M0 + M1 * t;
}

/* Mean distance of the moon to its ascending node */
function mean_distance(t) {
  return F0 + F1 * t;
}

/* Ecliptic longitude */
function longitude(t) {
  return ecliptic_equinox_longitude(t) + L0 * Math.sin(mean_anomaly(t));
}

/* Ecliptic latitude */
function latitude(t) {
  return L1 * Math.sin(mean_distance(t));
}

function obliquity(t) {
  return E0 + E1 * t;
}

function right_ascension_direct(lat, lon, obl) {
  return Math.atan2(
    Math.sin(lon) * Math.cos(obl) - Math.tan(lat) * Math.sin(obl),
    Math.cos(lon)
  );
}

function right_ascension(t) {
  return right_ascension_direct(latitude(t), longitude(t), obliquity(t));
}

function declination_direct(lat, lon, obl) {
  return Math.asin(
    Math.sin(lat) * Math.cos(obl) +
    Math.cos(lat) * Math.sin(obl) * Math.sin(lon)
  );
}

function declination(t) {
  return declination_direct(latitude(t), longitude(t), obliquity(t));
}

function hour_angle_direct(lst, ra) {
  return (
    limit_angle(lst) - limit_angle(ra)
  );
}

function transit_direct(t, ha) {
  return t - ha * (12 / Math.PI / 24);
}

function hour_angle(t, lon) {
  return hour_angle_direct(
    astro.local_sidereal_time(t, lon),
    right_ascension(t)
  );
}

function hour_angle_iterative(t, lon, ha0) {
  // Iteratively improve by walking back in time toward a smaller hour angle.
  const t1 = transit_direct(t, ha0);
  const ha1 = hour_angle(t1, lon) + ha0;
  return ha1;
}

function hour_angle_refined(t, lon) {
  let ha = hour_angle(t, lon);

  ha = hour_angle_iterative(t, lon, ha);
  ha = hour_angle_iterative(t, lon, ha);
  ha = hour_angle_iterative(t, lon, ha);
  ha = hour_angle_iterative(t, lon, ha);

  return ha;
}

function hours_later(t, hrs) {
  return t + hrs / 24;
}

function transit(t, lat, lon) {
  // Go 24h ahead and look backwards for the transit...
  const later_t = hours_later(t, 24);
  let result = transit_direct(later_t, hour_angle_refined(later_t, lon));
  if(result <= later_t) {
    return result;
  }
  // If we've passed our max time though... just look near the beginning
  result = transit_direct(t, hour_angle_refined(t, lon));
  if(result >= t) {
    return result;
  }
  return NaN;
}

function altitude(t, lat, lon) {
  const decl = declination(t);
  const ha = hour_angle(t, lon);

  return Math.asin(
    Math.sin(lat) * Math.sin(decl) +
    Math.cos(lat) * Math.cos(decl) * Math.cos(ha)
  );
}

/* http://www.stargazing.net/kepler/moonrise.html article */
const PARALLAX = 0.0023212879051524586;

function rise_and_set(t, lat, lon) {
  const h = -PARALLAX;
  let h0 = altitude(t, lat, lon) - h;
  let h1 = h0;
  // Start at the beginning of the day
  let moonrise = NaN;
  let moonset = NaN;
  // Go in 2 hour chunks.
  for (let i=0; i <= 24; i+=2) {
    if (i !== 0) {
      h1 = altitude(hours_later(t, i), lat, lon) - h;
    }
    const h2 = altitude(hours_later(t, i+1), lat, lon) - h;

    // Fit h0, h1, h2 to a parabola
    const a = (h2 + h0) / 2 - h1;
    const b = (h2 - h0) / 2;
    const xe = -b / (2 * a); // vertex of parabola
    const ye = (a * xe + b) * xe + h1;

    // Discriminant
    const d = b * b - 4 * a * h1;
    let roots = 0;
    let x1;
    let x2;

    // Count roots
    if (d >= 0) {
      const dx = Math.sqrt(d) / (Math.abs(a) * 2);
      x1 = xe - dx;
      x2 = xe + dx;

      if (Math.abs(x1) <= 1) {
        roots++;
      }
      if (Math.abs(x2) <= 1) {
        roots++;
      }
      if (x1 < -1) {
        x1 = x2;
      }
    }

    if (roots === 1) {
      if (h0 < 0 && isNaN(moonrise)) {
        moonrise = i + x1;
      }
      else if(isNaN(moonset)) {
        moonset = i + x1;
      }
    }
    else if (roots === 2) {
      if(isNaN(moonrise)) {
        moonrise = i + (ye < 0 ? x2 : x1);
      }
      if(isNaN(moonset)) {
        moonset = i + (ye < 0 ? x1 : x2);
      }
    }

    // Found all the things!
    if(moonrise < 24 && moonset < 24) {
      break;
    }
    // Move two hours of altitude
    h0 = h2;
  }
  return {
    moonrise: hours_later(t, moonrise),
    moonset: hours_later(t, moonset),
  };
}

/* In the next 24 hours */
function rise(t, lat, lon) {
  return rise_and_set(t, lat, lon).moonrise;
}
/* In the next 24 hours */
function set(t, lat, lon) {
  return rise_and_set(t, lat, lon).moonset;
}

exports.latitude = latitude;
exports.longitude = longitude;
exports.right_ascension = right_ascension;
exports.declination = declination;
exports.altitude = altitude;
exports.transit = transit;
exports.rise_and_set = rise_and_set;
exports.rise = rise;
exports.set = set;
