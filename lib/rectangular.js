// https://ssd.jpl.nasa.gov/?planet_pos

"use strict";
const {asin, atan, cos, sin, sqrt, kepler} = require("./math");
const Ecliptic = require("./ecliptic");

class Rectangular {
  constructor(d, x, y, z) {
    this.d = d;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  ecliptic() {
    const d = this.d;
    const x = this.x;
    const y = this.y;
    const z = this.z;

    const r = sqrt(x * x + y * y + z * z);

    return new Ecliptic(d, atan(y, x), asin(z / r), r);
  }

  static from_kepler(d, a, e, I, M, w, N) {
    const E = kepler(M, e);

    const xv = a * (cos(E) - e);
    const yv = a * sqrt(1 - e * e) * sin(E);

    const sin_I = sin(I);
    const cos_I = cos(I);
    const sin_N = sin(N);
    const cos_N = cos(N);
    const sin_w = sin(w);
    const cos_w = cos(w);
    const xh = xv * ( cos_w * cos_N - sin_w * sin_N * cos_I) +
               yv * (-sin_w * cos_N - cos_w * sin_N * cos_I);
    const yh = xv * ( cos_w * sin_N + sin_w * cos_N * cos_I) +
               yv * (-sin_w * sin_N + cos_w * cos_N * cos_I);
    const zh = xv * (sin_w * sin_I) +
               yv * (cos_w * sin_I);

    return new Rectangular(d, xh, yh, zh);
  }

  static from_jpl_kepler(d, a, e, I, L, w1, N) {
    return Rectangular.from_kepler(a, e, I, L - w1, w1 - N, N);
  }

  static mercury(d) {
    return Rectangular.from_kepler(
      d,
        0.38709927 + d * (     0.00000037 / 36525),
        0.20563593 + d * (     0.00001906 / 36525),
        7.00497902 - d * (     0.00594749 / 36525),
      252.25032350 + d * (149472.67411175 / 36525),
       77.45779628 + d * (     0.16047689 / 36525),
       48.33076593 - d * (     0.12534081 / 36525),
    );
  }

  static venus(d) {
    return Rectangular.from_kepler(
      d,
        0.72333566 + d * (    0.00000390 / 36525),
        0.00677672 - d * (    0.00004107 / 36525),
        3.39467605 - d * (    0.00078890 / 36525),
      181.97909950 + d * (58517.81538729 / 36525),
      131.60246718 + d * (    0.00268329 / 36525),
       76.67984255 - d * (    0.27769418 / 36525),
    );
  }

  static earth(d) {
    return Rectangular.from_kepler(
      d,
        1.00000261 + d * (    0.00000562 / 36525),
        0.01671123 - d * (    0.00004392 / 36525),
       -0.00001531 - d * (    0.01294668 / 36525),
      100.46457166 + d * (35999.37244981 / 36525),
      102.93768193 + d * (    0.32327364 / 36525),
        0,
    );
  }

  static mars(d) {
    return Rectangular.from_kepler(
      d,
        1.52371034 + d * (    0.00001847 / 36525),
        0.09339410 + d * (    0.00007882 / 36525),
        1.84969142 - d * (    0.00813131 / 36525),
      355.44656795 + d * (19140.30268499 / 36525),
      336.05637041 + d * (    0.44441088 / 36525),
       49.55953891 - d * (    0.29257343 / 36525),
    );
  }

  static jupiter(d) {
    return Rectangular.from_kepler(
      d,
        5.20288700 - d * (   0.00011607 / 36525),
        0.04838624 - d * (   0.00013253 / 36525),
        1.30439695 - d * (   0.00183714 / 36525),
       34.39644051 + d * (3034.74612775 / 36525),
       14.72847983 + d * (   0.21252668 / 36525),
      100.47390909 + d * (   0.20469106 / 36525),
    );
  }

  static saturn(d) {
    return Rectangular.from_kepler(
      d,
        9.53667594 - d * (   0.00125060 / 36525),
        0.05386179 - d * (   0.00050991 / 36525),
        2.48599187 + d * (   0.00193609 / 36525),
       49.95424423 + d * (1222.49362201 / 36525),
       92.59887831 - d * (   0.41897216 / 36525),
      113.66242448 - d * (   0.28867794 / 36525),
    );
  }

  static uranus(d) {
    return Rectangular.from_kepler(
      d,
       19.18916464 - d * (  0.00196176 / 36525),
        0.04725744 - d * (  0.00004397 / 36525),
        0.77263783 - d * (  0.00242939 / 36525),
      313.23810451 + d * (428.48202785 / 36525),
      170.95427630 + d * (  0.40805281 / 36525),
       74.01692503 + d * (  0.04240589 / 36525),
    );
  }

  static neptune(d) {
    return Rectangular.from_kepler(
      d,
       30.06992276 + d * (  0.00026291 / 36525),
        0.00859048 + d * (  0.00005105 / 36525),
        1.77004347 + d * (  0.00035372 / 36525),
      304.87997031 + d * (218.45945325 / 36525),
       44.96476227 - d * (  0.32241464 / 36525),
      131.78422574 - d * (  0.00508664 / 36525),
    );
  }
}

module.exports = Rectangular;
