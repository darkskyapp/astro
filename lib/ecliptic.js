"use strict";
const {asin, atan, cos, sin} = require("./math");
const Equatorial = require("./equatorial");
const Rectangular = require("./rectangular");

class Ecliptic {
  constructor(d, longitude, latitude, distance) {
    this.d = d;
    this.longitude = longitude;
    this.latitude = latitude;
    this.distance = distance;
  }

  get obliquity() {
    return 23.43928 - 0.0000003563 * this.d;
  }

  equatorial() {
    const d = this.d;
    const lon = this.longitude;
    const lat = this.latitude;
    const ecl = this.obliquity;

    const sin_lon = sin(lon);
    const cos_lon = cos(lon);
    const sin_lat = sin(lat);
    const cos_lat = cos(lat);
    const tan_lat = sin_lat / cos_lat;
    const sin_ecl = sin(ecl);
    const cos_ecl = cos(ecl);

    return new Equatorial(
      d,
      atan(sin_lon * cos_ecl - tan_lat * sin_ecl, cos_lon),
      asin(sin_lat * cos_ecl + cos_lat * sin_ecl * sin_lon),
    );
  }

  // http://aa.usno.navy.mil/faq/docs/SunApprox.php
  static sun(d) {
    const g = 357.5291 + 0.98560028 * d;
    return new Ecliptic(
      d,
      280.459 + 0.98564736 * d + 1.915 * sin(g) + 0.020 * sin(2 * g),
      0,
      1.00014 - 0.01671 * cos(g) - 0.00014 * cos(2 * g),
    );
  }

  // http://stjarnhimlen.se/comp/ppcomp.html
  static moon(d) {
    // kepler elements of the moon
    const am = 60.2666;
    const em = 0.054900;
    const Im = 5.1454;
    const Mm = 115.3654 + 13.0649929509 * d;
    const wm = 318.0634 +  0.1643573223 * d;
    const Nm = 125.1228 -  0.0529538083 * d;
    const Lm = Mm + wm + Nm;

    // kepler elements of the sun
    const Ms = 356.0470 +  0.9856002585 * d;
    const ws = 282.9404 +  0.0000470935 * d;
    const Ls = Ms + ws;

    // ecliptic coordinates
    const moon = Rectangular.
      from_kepler(d, am, em, Im, Mm, wm, Nm).
      ecliptic();

    // apply corrective terms
    const D = Lm - Ls;
    const F = Lm - Nm;
    moon.longitude += -1.274 * sin(Mm - 2 * D) +
                       0.658 * sin(2 * D) +
                      -0.186 * sin(Ms) +
                      -0.059 * sin(2 * Mm - 2 * D) +
                      -0.057 * sin(Mm - 2 * D + Ms) +
                       0.053 * sin(Mm + 2 * D) +
                       0.046 * sin(2 * D - Ms) +
                       0.041 * sin(Mm - Ms) +
                      -0.035 * sin(D) +
                      -0.031 * sin(Mm + Ms) +
                      -0.015 * sin(2 * F - 2 * D) +
                       0.011 * sin(Mm - 4 * D);
    moon.latitude  += -0.173 * sin(F - 2 * D) +
                      -0.055 * sin(Mm - F - 2 * D) +
                      -0.046 * sin(Mm + F - 2 * D) +
                       0.033 * sin(F + 2 * D) +
                       0.017 * sin(2 * Mm + F);
    moon.distance  += -0.58  * cos(Mm - 2 * D) +
                      -0.46  * cos(2 * D);

    // convert from earth radii to AU
    moon.distance *= 6378.1 / 149597870.7;

    return moon;
  }
}

module.exports = Ecliptic;
