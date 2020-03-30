"use strict";

// Jean Meeus, "Astronomical Algorithms, 2nd Ed.", p. 147.
// radians
function obliquity(time) {
  return 0.412994 - 4121e-18 * time;
}

// http://aa.usno.navy.mil/faq/docs/GAST.php
// hours
function gmst(time) {
  return 6.699851 + 278538308153e-18 * time;
}

// http://stjarnhimlen.se/comp/ppcomp.html#13
// degrees
function parallax(distance) {
  return 0.002443 / distance;
}

class Observer {
  constructor(planet, lat, lon) {
    const sin_lat = Math.sin(lat * (Math.PI / 180));
    const cos_lat = Math.cos(lat * (Math.PI / 180));

    const dec = planet.declination;
    const sin_dec = Math.sin(dec * (Math.PI / 180));
    const cos_dec = Math.cos(dec * (Math.PI / 180));

    const ha = planet.hour_angle(lon);
    const sin_ha = Math.sin(ha * (Math.PI / 12));
    const cos_ha = Math.cos(ha * (Math.PI / 12));

    // calculate geocentric horizontal coordinates
    const sin_altitude = sin_lat * sin_dec + cos_lat * cos_dec * cos_ha;
    const cos_altitude = Math.sqrt(1 - sin_altitude * sin_altitude);
    const azimuth = Math.atan2(cos_dec * sin_ha, sin_lat * cos_dec * cos_ha - cos_lat * sin_dec) * (180 / Math.PI) + 180;

    // apply parallax for topocentric horizontal coordinates
    // http://stjarnhimlen.se/comp/ppcomp.html#13
    // FIXME: is there a clean way to _only_ do this for the moon?
    const altitude = Math.asin(sin_altitude) * (180 / Math.PI) - parallax(planet.distance) * cos_altitude;

    // initialize this object
    this.altitude = altitude;
    this.azimuth = azimuth;
  }
}

class Luminary {
  constructor(time) {
    this.setTime(time);
  }

  // https://ssd.jpl.nasa.gov/?planet_pos
  // abstract
  setTime(time, a, e, i, λ, π, Ω) {
    const M = λ - π;
    const w = π - Ω;

    // solve Kepler's equation
    let E = M + e * Math.sin(M);
    for(;;) {
      const dM = M - (E - e * Math.sin(E));
      const dE = dM / (1 - e * Math.cos(E));
      E += dE;

      if(Math.abs(dE) <= 1e-8) {
        break;
      }
    }

    // in-plane coordinates
    const u = a * (Math.cos(E) - e);
    const v = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // ecliptic coordinates
    const sin_i = Math.sin(i);
    const cos_i = Math.cos(i);
    const sin_Ω = Math.sin(Ω);
    const cos_Ω = Math.cos(Ω);
    const sin_w = Math.sin(w);
    const cos_w = Math.cos(w);
    const x = u * (cos_w * cos_Ω - sin_w * sin_Ω * cos_i) + v * (-sin_w * cos_Ω - cos_w * sin_Ω * cos_i);
    const y = u * (cos_w * sin_Ω + sin_w * cos_Ω * cos_i) + v * (-sin_w * sin_Ω + cos_w * cos_Ω * cos_i);
    const z = u * (sin_w * sin_i) + v * (cos_w * sin_i);

    // initialize this object
    this.time = time;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // https://www.aa.quae.nl/en/reken/hemelpositie.html#1_6
  // AU
  get distance() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  // http://stjarnhimlen.se/comp/ppcomp.html#7
  // degrees
  get longitude() {
    return Math.atan2(-this.y, -this.x) * (180 / Math.PI) + 180;
  }

  // https://www.aa.quae.nl/en/reken/hemelpositie.html#1_6
  // degrees
  get latitude() {
    return Math.asin(this.z / this.distance) * (180 / Math.PI);
  }

  // http://stjarnhimlen.se/comp/ppcomp.html#12
  // hours
  get right_ascension() {
    const e = obliquity(this.time);
    return Math.atan2(this.z * Math.sin(e) - this.y * Math.cos(e), -this.x) * (12 / Math.PI) + 12;
  }

  // same as ecliptic latitude, but in equatorial coordinates
  // https://www.aa.quae.nl/en/reken/hemelpositie.html#1_6
  // http://stjarnhimlen.se/comp/ppcomp.html#12
  // degrees
  get declination() {
    const e = obliquity(this.time);
    return Math.asin((this.y * Math.sin(e) + this.z * Math.cos(e)) / this.distance) * (180 / Math.PI);
  }

  // https://www.aa.quae.nl/en/reken/hemelpositie.html#1_9
  // hours
  hour_angle(lon) {
    const ha = gmst(this.time) + lon * (1 / 15) - this.right_ascension;
    return ha - Math.floor(ha / 24) * 24;
  }

  // http://stjarnhimlen.se/comp/riset.html
  // NOTE: latitude not used, but kept for consistency with rise/set
  // timestamp
  transit(lat, lon) {
    let ha = this.hour_angle(lon);
    if(ha > 12) { ha -= 24; }

    return this.time - 3590170.4 * ha;
  }

  // http://stjarnhimlen.se/comp/riset.html
  // timestamp
  riseset(lat, lon, h0, direction) {
    // save state
    const {time, x, y, z} = this;

    const sin_lat = Math.sin(lat * (Math.PI / 180));
    const cos_lat = Math.cos(lat * (Math.PI / 180));

    const sin_h0 = Math.sin(h0 * (Math.PI / 180));

    for(;;) {
      // solve the sunrise equation
      const dec = this.declination;
      const sin_dec = Math.sin(dec * (Math.PI / 180));
      const cos_dec = Math.cos(dec * (Math.PI / 180));
      const cos_lha = (sin_h0 - sin_lat * sin_dec) / (cos_lat * cos_dec);
      // FIXME: would be nicer to try hunting for the appropriate time
      if(Math.abs(cos_lha) > 1) {
        // restore state
        this.time = time;
        this.x = x;
        this.y = y;
        this.z = z;

        // bail
        return NaN;
      }

      // calculate the candidate rise or set time
      const riseset = this.transit(lat, lon) + 13713440.9 * direction * Math.acos(cos_lha);

      // if the candidate is far enough from the current time, we might be
      // inaccurate. update the this's time, and iterate
      if(Math.abs(riseset - this.time) >= 60000) {
        this.setTime(riseset);
        continue;
      }

      // otherwise, we're done!

      // restore state
      this.time = time;
      this.x = x;
      this.y = y;
      this.z = z;

      // return
      return riseset;
    }
  }

  // convenience method for the above
  // timestamp
  rise(lat, lon) {
    return this.riseset(lat, lon, 0, -1);
  }

  // convenience method for the above
  // timestamp
  set(lat, lon) {
    return this.riseset(lat, lon, 0, +1);
  }

  // object
  observer(lat, lon) {
    return new Observer(this, lat, lon);
  }
}

class Planet extends Luminary {
  setTime(time, a, e, i, λ, π, Ω) {
    super.setTime(time, a, e, i, λ, π, Ω);

    // planets orbit the sun, not the earth
    // FIXME: Would be good to cache a sun object rather than making new ones.
    const {x, y, z} = new Sun(time);
    this.x += x;
    this.y += y;
    this.z += z;
  }
}

// The Kepler element formulae below are all from J. L. Simon _et. al._,
// "Numerical expressions for precession formulae and mean elements for the
// Moon and planets," 1992.
class Sun extends Luminary {
  setTime(time) {
    super.setTime(
      time,
      1.000001,
      0.016721 -        13e-18 * time,
      0,
      4.891045 + 199106385e-18 * time,
      4.929185 +      9510e-18 * time,
      0,
    );
  }

  dawn(lat, lon) {
    return this.riseset(lat, lon, -6, -1);
  }

  rise(lat, lon) {
    return this.riseset(lat, lon, -0.833, -1);
  }

  set(lat, lon) {
    return this.riseset(lat, lon, -0.833, +1);
  }

  dusk(lat, lon) {
    return this.riseset(lat, lon, -6, +1);
  }
}

class Moon extends Luminary {
  setTime(time) {
    const d = 4.847230 + 2462600814e-18 * time;
    const f = 3.711908 + 2672404162e-18 * time;
    const l = 4.456050 + 2639203053e-18 * time;
    const g = 6.245046 +  199096875e-18 * time;

    super.setTime(
      time,
      0.002563 + 0.000023 * Math.cos(2 * d),
      0.055546 + 0.014216 * Math.cos(2 * d - l)
               + 0.008551 * Math.cos(2 * d - 2 * l)
               - 0.001383 * Math.cos(l)
               + 0.001356 * Math.cos(2 * d + l)
               - 0.001147 * Math.cos(4 * d - 3 * l)
               - 0.000914 * Math.cos(4 * d - 2 * l)
               + 0.000869 * Math.cos(2 * d - g - l)
               - 0.000627 * Math.cos(2 * d)
               - 0.000394 * Math.cos(4 * d - 4 * l)
               + 0.000282 * Math.cos(2 * d - g - 2 * l)
               - 0.000279 * Math.cos(d - l)
               - 0.000236 * Math.cos(2 * l)
               + 0.000231 * Math.cos(4 * d)
               + 0.000229 * Math.cos(6 * d - 4 * l)
               - 0.000201 * Math.cos(2 * l - 2 * f),
      0.090001 + 0.002357 * Math.cos(2 * d - 2 * f)
               - 0.000195 * Math.cos(2 * d)
               + 0.000182 * Math.cos(2 * f)
               + 0.000125 * Math.cos(2 * l - 2 * f)
               + 0.000097 * Math.cos(2 * d - g - 2 * f),
      3.455090 + 2661707199e-18 * time - 0.016158 * Math.sin(2 * d)
                                       + 0.005805 * Math.sin(2 * d - l)
                                       - 0.003212 * Math.sin(g)
                                       + 0.001921 * Math.sin(l)
                                       - 0.001057 * Math.sin(2 * d - g),
      5.282226 +   22504146e-18 * time - 0.269600 * Math.sin(2 * d - l)
                                       - 0.168284 * Math.sin(2 * d - 2 * l)
                                       - 0.047473 * Math.sin(l)
                                       + 0.045500 * Math.sin(4 * d - 3 * l)
                                       + 0.036385 * Math.sin(4 * d - 2 * l)
                                       + 0.025782 * Math.sin(2 * d + l)
                                       + 0.016891 * Math.sin(4 * d - 4 * l)
                                       - 0.016566 * Math.sin(2 * d - g - l)
                                       - 0.012266 * Math.sin(6 * d - 4 * l)
                                       - 0.011519 * Math.sin(2 * d)
                                       - 0.010060 * Math.sin(2 * d - 3 * l)
                                       - 0.009129 * Math.sin(2 * l)
                                       - 0.008416 * Math.sin(6 * d - 5 * l)
                                       + 0.007883 * Math.sin(g)
                                       - 0.006686 * Math.sin(6 * d - 3 * l),
      6.026367 -   10696962e-18 * time - 0.026141 * Math.sin(2 * d - 2 * f)
                                       - 0.002618 * Math.sin(g)
                                       - 0.002138 * Math.sin(2 * d)
                                       + 0.002051 * Math.sin(2 * f)
                                       - 0.001396 * Math.sin(2 * l - 2 * f),
    );
  }

  // http://stjarnhimlen.se/comp/riset.html#4
  rise(lat, lon) {
    return this.riseset(lat, lon, -0.583 - parallax(this.distance), -1);
  }

  // http://stjarnhimlen.se/comp/riset.html#4
  set(lat, lon) {
    return this.riseset(lat, lon, -0.583 - parallax(this.distance), +1);
  }
}

class Mercury extends Planet {
  setTime(time) {
    super.setTime(
      time,
      0.387098,
      0.205626 +         6e-18 * time,
      0.122251 +        10e-18 * time,
      0.873228 + 826683495e-18 * time,
      1.343715 +      8608e-18 * time,
      0.837323 +      6560e-18 * time,
    );
  }
}

class Venus extends Planet {
  setTime(time) {
    super.setTime(
      time,
      0.723330,
      0.006786 -        15e-18 * time,
      0.059243 +         6e-18 * time,
      4.646365 + 323647217e-18 * time,
      2.288878 +      7755e-18 * time,
      1.333599 +      4983e-18 * time,
    );
  }
}

class Mars extends Planet {
  setTime(time) {
    super.setTime(
      time,
      1.523679,
      0.093374 +        29e-18 * time,
      0.032287 -         3e-18 * time,
      0.225575 + 105865347e-18 * time,
      5.855718 +     10182e-18 * time,
      0.860910 +      4270e-18 * time,
    );
  }
}

class Jupiter extends Planet {
  setTime(time) {
    super.setTime(
      time,
      5.202603 - 0.002762 * Math.cos(5.591681 + 20051705e-18 * time)
               - 0.002000 * Math.cos(1.727862 + 16565442e-18 * time)
               + 0.000883 * Math.cos(0.705774 + 13295647e-18 * time)
               + 0.000654 * Math.cos(2.782676 + 10025852e-18 * time)
               - 0.000462 * Math.cos(1.948722 +  3269795e-18 * time)
               - 0.000290 * Math.cos(2.049188 + 30077557e-18 * time)
               + 0.000273 * Math.cos(5.788194 +   216467e-18 * time)
               - 0.000231 * Math.cos(3.467895 + 23321500e-18 * time),
      0.048449 +       52e-18 * time,
      0.022775 -       30e-18 * time,
      3.551060 + 16792621e-18 * time + 0.005749 * Math.cos(1.233091 +   216467e-18 * time)
                                     - 0.000945 * Math.cos(0.879411 + 20051705e-18 * time)
                                     - 0.000776 * Math.cos(3.297453 + 16565442e-18 * time)
                                     - 0.000602 * Math.cos(3.430583 +  3269795e-18 * time)
                                     - 0.000400 * Math.cos(5.404771 + 13295647e-18 * time)
                                     + 0.000387 * Math.cos(4.353461 + 10025852e-18 * time)
                                     - 0.000081 * Math.cos(0.493957 +  6539590e-18 * time)
                                     - 0.000079 * Math.cos(3.632640 + 30077557e-18 * time),
      0.241683 +     8919e-18 * time,
      1.748089 +     5647e-18 * time,
    );
  }
}

class Saturn extends Planet {
  setTime(time) {
    super.setTime(
      time,
      9.542918 -       1e-18 * time + 0.015325 * Math.cos(5.227390 +  6539590e-18 * time)
                                    + 0.008308 * Math.cos(2.773173 + 10025852e-18 * time)
                                    + 0.005414 * Math.cos(1.952079 +  3269795e-18 * time)
                                    - 0.002477 * Math.cos(5.870808 +   216467e-18 * time)
                                    + 0.001417 * Math.cos(5.597425 + 20051705e-18 * time)
                                    + 0.000926 * Math.cos(0.437055 + 13295647e-18 * time)
                                    - 0.000528 * Math.cos(2.598829 +  3486262e-18 * time),
      0.055652 -     110e-18 * time,
      0.043459 -      21e-18 * time,
      0.750913 + 6766768e-18 * time - 0.013984 * Math.cos(1.232826 +   216467e-18 * time)
                                    + 0.003300 * Math.cos(0.512664 +  6539590e-18 * time)
                                    + 0.002062 * Math.cos(3.430723 +  3269795e-18 * time)
                                    - 0.000162 * Math.cos(4.084532 +  3486262e-18 * time)
                                    + 0.000156 * Math.cos(0.878448 + 20051705e-18 * time)
                                    + 0.000148 * Math.cos(1.425845 +   136716e-18 * time)
                                    + 0.000136 * Math.cos(5.628929 +   353183e-18 * time)
                                    - 0.000129 * Math.cos(0.883481 +   432935e-18 * time),
      1.613873 +   10861e-18 * time,
      1.979245 +    4851e-18 * time,
    );
  }
}

class Uranus extends Planet {
  setTime(time) {
    super.setTime(
      time,
      19.192234 + 0.041284 * Math.cos(4.423865 +  2324175e-18 * time)
                - 0.005769 * Math.cos(5.074979 +  2016563e-18 * time)
                + 0.004975 * Math.cos(0.323382 + 14412163e-18 * time)
                - 0.004779 * Math.cos(5.170813 +    45572e-18 * time)
                - 0.003394 * Math.cos(0.621459 +  4386310e-18 * time)
                - 0.002704 * Math.cos(2.577915 +  2278603e-18 * time)
                - 0.001581 * Math.cos(3.130825 +  2369747e-18 * time),
       0.046389 -       9e-18 * time,
       0.013491 +       4e-18 * time,
       3.230531 + 2377412e-18 * time - 0.015286 * Math.cos(0.441637 +    45572e-18 * time)
                                     - 0.004363 * Math.cos(2.853103 +  2324175e-18 * time)
                                     + 0.000679 * Math.cos(3.469916 +  2016563e-18 * time)
                                     - 0.000637 * Math.cos(5.310891 +    91144e-18 * time)
                                     - 0.000593 * Math.cos(5.631656 +   353183e-18 * time)
                                     - 0.000290 * Math.cos(4.148739 +  2278603e-18 * time)
                                     + 0.000258 * Math.cos(5.035927 + 14412163e-18 * time)
                                     - 0.000177 * Math.cos(3.785510 +  1162087e-18 * time),
       3.011729 +    8221e-18 * time,
       1.288919 +    2882e-18 * time,
    );
  }
}

class Neptune extends Planet {
  setTime(time) {
    super.setTime(
      time,
      30.069163 - 0.015961 * Math.cos(5.362477 +  1162087e-18 * time)
                - 0.013689 * Math.cos(0.195809 +  1207659e-18 * time)
                + 0.007926 * Math.cos(5.166641 +    45572e-18 * time)
                - 0.005322 * Math.cos(0.329712 +  1116515e-18 * time)
                - 0.004958 * Math.cos(2.534444 + 15574250e-18 * time)
                - 0.002746 * Math.cos(6.017464 +  5548398e-18 * time)
                + 0.001029 * Math.cos(4.439457 +  2324175e-18 * time),
       0.009454 +       2e-18 * time,
       0.030940 -      51e-18 * time,
       4.160580 + 1216090e-18 * time + 0.010179 * Math.cos(0.443976 +    45572e-18 * time)
                                     + 0.001184 * Math.cos(3.790845 +  1162087e-18 * time)
                                     + 0.000922 * Math.cos(4.902746 +  1207659e-18 * time)
                                     + 0.000418 * Math.cos(5.326966 +    91144e-18 * time)
                                     + 0.000374 * Math.cos(5.043787 +  1116515e-18 * time)
                                     + 0.000165 * Math.cos(4.104978 + 15574250e-18 * time)
                                     + 0.000090 * Math.cos(1.304998 +  5548398e-18 * time)
                                     - 0.000045 * Math.cos(2.864244 +  2324175e-18 * time),
       0.832389 +    7888e-18 * time,
       2.294295 +    6096e-18 * time,
    );
  }
}

exports.sun     = time => new Sun    (time);
exports.moon    = time => new Moon   (time);
exports.mercury = time => new Mercury(time);
exports.venus   = time => new Venus  (time);
exports.mars    = time => new Mars   (time);
exports.jupiter = time => new Jupiter(time);
exports.saturn  = time => new Saturn (time);
exports.uranus  = time => new Uranus (time);
exports.neptune = time => new Neptune(time);
