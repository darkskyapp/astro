"use strict";
const PI = Math.PI;
const RAD = PI / 180;
const DEG = 180 / PI;


function asin(x) { return Math.asin(x) * DEG; }
function atan(y, x) { return 180 + Math.atan2(-y, -x) * DEG; }
function cos(x) { return Math.cos(x * RAD); }
function sin(x) { return Math.sin(x * RAD); }


class Horizontal {
  constructor(sin_altitude, cos_azimuth, sin_azimuth) {
    this.sin_altitude = sin_altitude;
    this.cos_azimuth = cos_azimuth;
    this.sin_azimuth = sin_azimuth;
  }

  get altitude() {
    return asin(this.sin_altitude);
  }

  get azimuth() {
    return atan(this.sin_azimuth, this.cos_azimuth);
  }
}

class EclipticHorizontal extends Horizontal {
  constructor(ecliptic, right_ascension, sin_declination, sin_altitude, cos_azimuth, sin_azimuth) {
    super(sin_altitude, cos_azimuth, sin_azimuth);
    this.ecliptic = ecliptic;
    this.right_ascension = right_ascension;
    this.sin_declination = sin_declination;
  }

  get declination() {
    return asin(this.sin_declination);
  }

  get longitude() {
    return this.ecliptic.longitude;
  }

  get latitude() {
    return this.ecliptic.latitude;
  }

  get distance() {
    return this.ecliptic.distance;
  }

  get j2000() {
    return this.ecliptic.j2000;
  }
}

class EquatorialHorizontal extends Horizontal {
  constructor(equatorial, sin_altitude, cos_azimuth, sin_azimuth) {
    super(sin_altitude, cos_azimuth, sin_azimuth);
    this.equatorial = equatorial;
  }

  get right_ascension() {
    return this.equatorial.right_ascension;
  }

  get declination() {
    return this.equatorial.declination;
  }

  get j2000() {
    return this.equatorial.j2000;
  }
}


class Star {
  constructor(astro) {
    this.astro = astro;
  }

  get j2000() {
    return this.astro.j2000;
  }
}

class Ecliptic extends Star {
  constructor(astro, longitude, latitude, distance) {
    super(astro);
    this.longitude = longitude;
    this.latitude = latitude;
    this.distance = distance;
  }

  horizontal(lat, lon) {
    const ecl_lon = this.longitude;
    const ecl_lat = this.latitude;
    const ecl = this.astro.obliquity;
    const gmst = this.astro.gmst;

    const sin_ecl_lon = sin(ecl_lon);
    const cos_ecl_lon = cos(ecl_lon);
    const sin_ecl_lat = sin(ecl_lat);
    const cos_ecl_lat = cos(ecl_lat);
    const tan_ecl_lat = sin_ecl_lat / cos_ecl_lat;
    const sin_ecl = sin(ecl);
    const cos_ecl = cos(ecl);

    const ra = atan(sin_ecl_lon * cos_ecl - tan_ecl_lat * sin_ecl, cos_ecl_lon);
    const sin_dec = sin_ecl_lat * cos_ecl + cos_ecl_lat * sin_ecl * sin_ecl_lon;
    const ha = gmst + lon - ra;

    const sin_lat = sin(lat);
    const cos_lat = cos(lat);
    const cos_dec = Math.sqrt(1 - sin_dec * sin_dec);
    const tan_dec = sin_dec / cos_dec;
    const sin_ha = sin(ha);
    const cos_ha = cos(ha);

    return new EclipticHorizontal(
      this,
      ra,
      sin_dec,
      sin_lat * sin_dec + cos_lat * cos_dec * cos_ha,
      cos_lat * tan_dec - sin_lat * cos_ha,
      -sin_ha,
    );
  }
}

class Equatorial extends Star {
  constructor(astro, right_ascension, declination) {
    super(astro);
    this.right_ascension = right_ascension;
    this.declination = declination;
  }

  horizontal(lat, lon) {
    const ra = this.right_ascension;
    const dec = this.declination;
    const gmst = this.astro.gmst;
    const ha = gmst + lon - ra;

    const cos_lat = cos(lat);
    const sin_lat = sin(lat);
    const cos_dec = cos(dec);
    const sin_dec = sin(dec);
    const tan_dec = sin_dec / cos_dec;
    const cos_ha = cos(ha);
    const sin_ha = sin(ha);

    return new EquatorialHorizontal(
      this,
      sin_lat * sin_dec + cos_lat * cos_dec * cos_ha,
      cos_lat * tan_dec - sin_lat * cos_ha,
      -sin_ha,
    );
  }
}


class Astro {
  constructor(date) {
    const d = date / 86400000 - 10957.5;
    const ecl = 23.43928 - 0.0000003563 * d;
    const gmst = (18.697374558 * 15) + (24.06570982441908 * 15) * d;

    this.j2000 = d;
    this.obliquity = ecl;
    this.gmst = gmst;
  }

  // http://aa.usno.navy.mil/faq/docs/SunApprox.php
  // http://mathworld.wolfram.com/Double-AngleFormulas.html
  get sun() {
    const d = this.j2000;

    const g = 357.5291 + (360 / 365.259635864) * d;
    const sin_g = sin(g);
    const cos_g = cos(g);
    const sin_2g = 2 * sin_g * cos_g;
    const cos_2g = 2 * cos_g * cos_g - 1;

    const q = 280.459 + (360 / 365.2421896698) * d;
    const L = q + 1.915 * sin_g + 0.020 * sin_2g;
    const b = 0;
    const R = 1.00014 - 0.01671 * cos_g - 0.00014 * cos_2g;

    const sun = new Ecliptic(this, L, b, R);
    Object.defineProperty(this, "sun", {value: sun});
    return sun;
  }

  // 10 brightest stars
  // https://en.wikipedia.org/wiki/List_of_brightest_stars
  get sirius() {
    const sirius = new Equatorial(this, 101.287155, -16.716116);
    Object.defineProperty(this, "sirius", {value: sirius});
    return sirius;
  }

  get canopus() {
    const canopus = new Equatorial(this, 95.987958, -52.695661);
    Object.defineProperty(this, "canopus", {value: canopus});
    return canopus;
  }

  get rigil_kentaurus() {
    const rigil_kentaurus = new Equatorial(this, 219.899077, -60.835760);
    Object.defineProperty(this, "rigil_kentaurus", {value: rigil_kentaurus});
    return rigil_kentaurus;
  }

  get arcturus() {
    const arcturus = new Equatorial(this, 213.915417, 19.182222);
    Object.defineProperty(this, "arcturus", {value: arcturus});
    return arcturus;
  }

  get vega() {
    const vega = new Equatorial(this, 279.234735, 38.783689);
    Object.defineProperty(this, "vega", {value: vega});
    return vega;
  }

  get capella() {
    const capella = new Equatorial(this, 79.172328, 45.997991);
    Object.defineProperty(this, "capella", {value: capella});
    return capella;
  }

  get rigel() {
    const rigel = new Equatorial(this, 78.634467, -8.201638);
    Object.defineProperty(this, "rigel", {value: rigel});
    return rigel;
  }

  get procyon() {
    const procyon = new Equatorial(this, 114.825498, 5.224988);
    Object.defineProperty(this, "procyon", {value: procyon});
    return procyon;
  }

  get achernar() {
    const achernar = new Equatorial(this, 24.428523, -57.236753);
    Object.defineProperty(this, "achernar", {value: achernar});
    return achernar;
  }

  get betelgeuse() {
    const betelgeuse = new Equatorial(this, 88.792939, 7.407064);
    Object.defineProperty(this, "betelgeuse", {value: betelgeuse});
    return betelgeuse;
  }

  // Behenian fixed stars (alongside sirius, arcturus, vega, capella, procyon)
  // https://en.wikipedia.org/wiki/Behenian_fixed_star
  get algol() {
    const algol = new Equatorial(this, 47.042219, 40.955647);
    Object.defineProperty(this, "algol", {value: algol});
    return algol;
  }

  get pleiades() {
    const pleiades = new Equatorial(this, 56.850000, 24.116667);
    Object.defineProperty(this, "pleiades", {value: pleiades});
    return pleiades;
  }

  get aldebaran() {
    const aldebaran = new Equatorial(this, 68.980163, 16.509302);
    Object.defineProperty(this, "aldebaran", {value: aldebaran});
    return aldebaran;
  }

  get regulus() {
    const regulus = new Equatorial(this, 152.092962, 11.967208);
    Object.defineProperty(this, "regulus", {value: regulus});
    return regulus;
  }

  get alkaid() {
    const alkaid = new Equatorial(this, 206.885157, 49.313267);
    Object.defineProperty(this, "alkaid", {value: alkaid});
    return alkaid;
  }

  get algorab() {
    const algorab = new Equatorial(this, 187.466063, -16.515431);
    Object.defineProperty(this, "algorab", {value: algorab});
    return algorab;
  }

  get spica() {
    const spica = new Equatorial(this, 201.298246, -11.161319);
    Object.defineProperty(this, "spica", {value: spica});
    return spica;
  }

  get alphecca() {
    const alphecca = new Equatorial(this, 233.671950, 26.714692);
    Object.defineProperty(this, "alphecca", {value: alphecca});
    return alphecca;
  }

  get antares() {
    const antares = new Equatorial(this, 247.351915, -26.432003);
    Object.defineProperty(this, "antares", {value: antares});
    return antares;
  }

  get deneb_algedi() {
    const deneb_algedi = new Equatorial(this, 326.760184, -16.127287);
    Object.defineProperty(this, "deneb_algedi", {value: deneb_algedi});
    return deneb_algedi;
  }

  // royal stars (alongside aldebaran, regulus, antares)
  // https://en.wikipedia.org/wiki/Royal_stars
  get fomalhaut() {
    const fomalhaut = new Equatorial(this, 344.100222, -31.565565);
    Object.defineProperty(this, "fomalhaut", {value: fomalhaut});
    return fomalhaut;
  }

  // other culturally important stars
  get polaris() {
    const polaris = new Equatorial(this, 37.954542, 89.264111);
    Object.defineProperty(this, "polaris", {value: polaris});
    return polaris;
  }
}


function astro(date) {
  return new Astro(date);
}


module.exports = astro;
