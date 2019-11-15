"use strict";


const PI = Math.PI;
const RAD = PI / 180;
const DEG = 180 / PI;


function asin(x) { return Math.asin(x) * DEG; }
function atan(y, x) { return 180 + Math.atan2(-y, -x) * DEG; }
function cos(x) { return Math.cos(x * RAD); }
function frac(x) { return x - Math.floor(x); }
function sin(x) { return Math.sin(x * RAD); }


class Horizontal {
  constructor(altitude, cos_azimuth, sin_azimuth) {
    this.altitude = altitude;
    this.cos_azimuth = cos_azimuth;
    this.sin_azimuth = sin_azimuth;
  }

  get azimuth() {
    return atan(this.sin_azimuth, this.cos_azimuth);
  }
}

class EclipticHorizontal extends Horizontal {
  constructor(ecliptic, right_ascension, sin_declination, altitude, cos_azimuth, sin_azimuth) {
    super(altitude, cos_azimuth, sin_azimuth);
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
  constructor(equatorial, altitude, cos_azimuth, sin_azimuth) {
    super(altitude, cos_azimuth, sin_azimuth);
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
    const R = this.distance;
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

    const alt_geoc = asin(sin_lat * sin_dec + cos_lat * cos_dec * cos_ha);

    // apply topocentric correction
    // http://stjarnhimlen.se/comp/ppcomp.html#13
    const par = asin(4.263521e-5 / R);
    const alt_topoc = alt_geoc - par * cos(alt_geoc);

    return new EclipticHorizontal(
      this,
      ra,
      sin_dec,
      alt_topoc,
      cos_lat * tan_dec - sin_lat * cos_ha,
      -sin_ha,
    );
  }
}

class MoonEcliptic extends Ecliptic {
  constructor(astro, longitude, latitude, distance, phase_angle) {
    super(astro, longitude, latitude, distance);
    this.phase_angle = phase_angle;
  }

  get illumination() {
    return 0.5 + 0.5 * cos(this.phase_angle);
  }

  get phase() {
    return frac(0.5 - (1 / 360) * this.phase_angle);
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
      asin(sin_lat * sin_dec + cos_lat * cos_dec * cos_ha),
      cos_lat * tan_dec - sin_lat * cos_ha,
      -sin_ha,
    );
  }
}


// solve Kepler's equation
function kepler(M, e) {
  let E = M + e * DEG * sin(M);

  for(;;) {
    const dM = M - (E - e * DEG * sin(E));
    const dE = dM / (1 - e * cos(E));
    E += dE;
    if(Math.abs(dE) <= 10e-6) {
      break;
    }
  }

  return E;
}

function rectangular_from_kepler(a, e, I, L, w1, N) {
  const M = L - w1;
  const w = w1 - N;

  const E = kepler(M, e);

  const xv = a * (cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sin(E);

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

  return [xh, yh, zh];
}

function ecliptic_from_kepler(astro, a, e, I, L, w1, N) {
  const [xe, ye, ze] = astro._emb;
  const [xh, yh, zh] = rectangular_from_kepler(a, e, I, L, w1, N);

  const xg = xh - xe;
  const yg = yh - ye;
  const zg = zh - ze;

  const r = Math.sqrt(xg * xg + yg * yg + zg * zg);

  return new Ecliptic(astro, atan(yg, xg), asin(zg / r), r);
}


class Astro {
  constructor(date) {
    const d = date / 86400000 - 10957.5;
    const ecl = 23.43928 - 0.0000003563 * d;
    const gmst = (18.697374558 * 15) + (24.06570982441908 * 15) * d;

    this.j2000 = d;
    this.obliquity = ecl;
    this.gmst = gmst;

    // cache properties
    this._sun = undefined;
    this._moon = undefined;
    this.__emb = undefined;
    this._mercury = undefined;
    this._venus = undefined;
    this._mars = undefined;
    this._jupiter = undefined;
    this._saturn = undefined;
    this._uranus = undefined;
    this._neptune = undefined;
    this._sirius  = undefined;
    this._canopus = undefined;
    this._rigil_kentaurus = undefined;
    this._arcturus = undefined;
    this._vega = undefined;
    this._capella = undefined;
    this._rigel = undefined;
    this._procyon = undefined;
    this._achernar = undefined;
    this._betelgeuse = undefined;
    this._algol = undefined;
    this._pleiades = undefined;
    this._aldebaran = undefined;
    this._regulus = undefined;
    this._alkaid = undefined;
    this._algorab = undefined;
    this._spica = undefined;
    this._alphecca = undefined;
    this._antares = undefined;
    this._deneb_algedi = undefined;
    this._fomalhaut = undefined;
    this._polaris = undefined;
  }

  // http://aa.usno.navy.mil/faq/docs/SunApprox.php
  get sun() {
    let sun = this._sun;

    if(sun === undefined) {
      const d = this.j2000;

      const g = 357.5291092 + 0.985600281697 * d;

      const sin_1g = sin(g);
      const cos_1g = cos(g);

      // http://mathworld.wolfram.com/Double-AngleFormulas.html
      const sin_2g = 2 * sin_1g * cos_1g;
      const cos_2g = 2 * cos_1g * cos_1g - 1;

      const L = 280.459 + 0.9856473599763 * d + 1.915 * sin_1g + 0.020 * sin_2g;
      const b = 0;
      const R = 1.00014 - 0.01671 * cos_1g - 0.00014 * cos_2g;

      sun = new Ecliptic(this, L, b, R);
      this._sun = sun;
    }

    return sun;
  }

  // Jean Meeus, Astronomical Algorithms, 2nd ed., ch. 47-8
  // NOTE: This has been simplified down to terms >=0.1°.
  get moon() {
    let moon = this._moon;

    if(moon === undefined) {
      const d = this.j2000;

      const D = 297.8501921 + 12.19074911440  * d;
      const g = 357.5291092 +  0.985600281697 * d;
      const M = 134.9633964 + 13.06499295018  * d;
      const F =  93.2720950 + 13.22935024020  * d;

      const sin_1D = sin(D);
      const cos_1D = cos(D);
      const sin_1g = sin(g);
      const sin_1M = sin(M);
      const cos_1M = cos(M);
      const sin_1F = sin(F);
      const cos_1F = cos(F);

      // http://mathworld.wolfram.com/Double-AngleFormulas.html
      const sin_2D = 2 * sin_1D * cos_1D;
      const cos_2D = 2 * cos_1D * cos_1D - 1;
      const sin_2M = 2 * sin_1M * cos_1M;
      const sin_2F = 2 * sin_1F * cos_1F;

      // http://mathworld.wolfram.com/TrigonometricAdditionFormulas.html
      const sin_2Dm1M = sin_2D * cos_1M - cos_2D * sin_1M; // sin(2D - M)
      const sin_1Mp1F = sin_1M * cos_1F + cos_1M * sin_1F; // sin(M + F)
      const sin_1Mm1F = sin_1M * cos_1F - cos_1M * sin_1F; // sin(M - F)
      const sin_2Dm1F = sin_2D * cos_1F - cos_2D * sin_1F; // sin(2D - F)

      const L = 218.3164477 + 13.176396474585 * d + // mean longitude
                  6.288774 * sin_1M + // equation of the center (I)
                  1.274027 * sin_2Dm1M + // evection
                  0.658314 * sin_2D - // variation
                  0.213618 * sin_2M + // equation of the center (II)
                  0.185116 * sin_1g - // annual equation
                  0.114332 * sin_2F; // reduction to the ecliptic
      const b =   5.128122 * sin_1F +
                  0.280602 * sin_1Mp1F +
                  0.277693 * sin_1Mm1F +
                  0.173237 * sin_2Dm1F;
      const R = 0.0025735698 - 1.397e-7 * cos_1M;
      const i = 180 - D - 6.289 * sin_1M +
                          2.100 * sin_1g -
                          1.274 * sin_2Dm1M -
                          0.658 * sin_2D -
                          0.214 * sin_2M -
                          0.110 * sin_1D;

      moon = new MoonEcliptic(this, L, b, R, i);
      this._moon = moon;
    }

    return moon;
  }

  // https://ssd.jpl.nasa.gov/?planet_pos
  // ftp://ssd.jpl.nasa.gov/pub/eph/planets/ioms/ExplSupplChap8.pdf
  get _emb() {
    let emb = this.__emb;

    if(emb === undefined) {
      const d = this.j2000;

      emb = rectangular_from_kepler(
          1.00000261 + (    0.00000562 / 36525) * d,
          0.01671123 - (    0.00004392 / 36525) * d,
         -0.00001531 - (    0.01294668 / 36525) * d,
        100.46457166 + (35999.37244981 / 36525) * d,
        102.93768193 + (    0.32327364 / 36525) * d,
          0,
      );
      this.__emb = emb;
    }

    return emb;
  }

  get mercury() {
    let mercury = this._mercury;

    if(mercury === undefined) {
      const d = this.j2000;

      mercury = ecliptic_from_kepler(
        this,
          0.38709927 + (     0.00000037 / 36525) * d,
          0.20563593 + (     0.00001906 / 36525) * d,
          7.00497902 - (     0.00594749 / 36525) * d,
        252.25032350 + (149472.67411175 / 36525) * d,
         77.45779628 + (     0.16047689 / 36525) * d,
         48.33076593 - (     0.12534081 / 36525) * d,
      );
      this._mercury = mercury;
    }

    return mercury;
  }

  get venus() {
    let venus = this._venus;

    if(venus === undefined) {
      const d = this.j2000;

      venus = ecliptic_from_kepler(
        this,
          0.72333566 + (    0.00000390 / 36525) * d,
          0.00677672 - (    0.00004107 / 36525) * d,
          3.39467605 - (    0.00078890 / 36525) * d,
        181.97909950 + (58517.81538729 / 36525) * d,
        131.60246718 + (    0.00268329 / 36525) * d,
         76.67984255 - (    0.27769418 / 36525) * d,
      );
      this._venus = venus;
    }

    return venus;
  }

  get mars() {
    let mars = this._mars;

    if(mars === undefined) {
      const d = this.j2000;

      mars = ecliptic_from_kepler(
        this,
          1.52371034 + (    0.00001847 / 36525) * d,
          0.09339410 + (    0.00007882 / 36525) * d,
          1.84969142 - (    0.00813131 / 36525) * d,
        355.44656795 + (19140.30268499 / 36525) * d,
        336.05637041 + (    0.44441088 / 36525) * d,
         49.55953891 - (    0.29257343 / 36525) * d,
      );
      this._mars = mars;
    }

    return mars;
  }

  get jupiter() {
    let jupiter = this._jupiter;

    if(jupiter === undefined) {
      const d = this.j2000;

      jupiter = ecliptic_from_kepler(
        this,
          5.20288700 - (   0.00011607 / 36525) * d,
          0.04838624 - (   0.00013253 / 36525) * d,
          1.30439695 - (   0.00183714 / 36525) * d,
         34.39644051 + (3034.74612775 / 36525) * d,
         14.72847983 + (   0.21252668 / 36525) * d,
        100.47390909 + (   0.20469106 / 36525) * d,
      );
      this._jupiter = jupiter;
    }

    return jupiter;
  }

  get saturn() {
    let saturn = this._saturn;

    if(saturn === undefined) {
      const d = this.j2000;

      saturn = ecliptic_from_kepler(
        this,
          9.53667594 - (   0.00125060 / 36525) * d,
          0.05386179 - (   0.00050991 / 36525) * d,
          2.48599187 + (   0.00193609 / 36525) * d,
         49.95424423 + (1222.49362201 / 36525) * d,
         92.59887831 - (   0.41897216 / 36525) * d,
        113.66242448 - (   0.28867794 / 36525) * d,
      );
      this._saturn = saturn;
    }

    return saturn;
  }

  get uranus() {
    let uranus = this._uranus;

    if(uranus === undefined) {
      const d = this.j2000;

      uranus = ecliptic_from_kepler(
        this,
         19.18916464 - (  0.00196176 / 36525) * d,
          0.04725744 - (  0.00004397 / 36525) * d,
          0.77263783 - (  0.00242939 / 36525) * d,
        313.23810451 + (428.48202785 / 36525) * d,
        170.95427630 + (  0.40805281 / 36525) * d,
         74.01692503 + (  0.04240589 / 36525) * d,
      );
      this._uranus = uranus;
    }

    return uranus;
  }

  get neptune() {
    let neptune = this._neptune;

    if(neptune === undefined) {
      const d = this.j2000;

      neptune = ecliptic_from_kepler(
        this,
         30.06992276 + (  0.00026291 / 36525) * d,
          0.00859048 + (  0.00005105 / 36525) * d,
          1.77004347 + (  0.00035372 / 36525) * d,
        304.87997031 + (218.45945325 / 36525) * d,
         44.96476227 - (  0.32241464 / 36525) * d,
        131.78422574 - (  0.00508664 / 36525) * d,
      );
      this._neptune = neptune;
    }

    return neptune;
  }

  // 10 brightest stars
  // https://en.wikipedia.org/wiki/List_of_brightest_stars
  get sirius() {
    let sirius = this._sirius;

    if(sirius === undefined) {
      sirius = new Equatorial(this, 101.287155, -16.716116);
      this._sirius = sirius;
    }

    return sirius;
  }

  get canopus() {
    let canopus = this._canopus;

    if(canopus === undefined) {
      canopus = new Equatorial(this, 95.987958, -52.695661);
      this._canopus = canopus;
    }

    return canopus;
  }

  get rigil_kentaurus() {
    let rigil_kentaurus = this._rigil_kentaurus;

    if(rigil_kentaurus === undefined) {
      rigil_kentaurus = new Equatorial(this, 219.899077, -60.835760);
      this._rigil_kentaurus = rigil_kentaurus;
    }

    return rigil_kentaurus;
  }

  get arcturus() {
    let arcturus = this._arcturus;

    if(arcturus === undefined) {
      arcturus = new Equatorial(this, 213.915417, 19.182222);
      this._arcturus = arcturus;
    }

    return arcturus;
  }

  get vega() {
    let vega = this._vega;

    if(vega === undefined) {
      vega = new Equatorial(this, 279.234735, 38.783689);
      this._vega = vega;
    }

    return vega;
  }

  get capella() {
    let capella = this._capella;

    if(capella === undefined) {
      capella = new Equatorial(this, 79.172328, 45.997991);
      this._capella = capella;
    }

    return capella;
  }

  get rigel() {
    let rigel = this._rigel;

    if(rigel === undefined) {
      rigel = new Equatorial(this, 78.634467, -8.201638);
      this._rigel = rigel;
    }

    return rigel;
  }

  get procyon() {
    let procyon = this._procyon;

    if(procyon === undefined) {
      procyon = new Equatorial(this, 114.825498, 5.224988);
      this._procyon = procyon;
    }

    return procyon;
  }

  get achernar() {
    let achernar = this._achernar;

    if(achernar === undefined) {
      achernar = new Equatorial(this, 24.428523, -57.236753);
      this._achernar = achernar;
    }

    return achernar;
  }

  get betelgeuse() {
    let betelgeuse = this._betelgeuse;

    if(betelgeuse === undefined) {
      betelgeuse = new Equatorial(this, 88.792939, 7.407064);
      this._betelgeuse = betelgeuse;
    }

    return betelgeuse;
  }

  // Behenian fixed stars (alongside sirius, arcturus, vega, capella, procyon)
  // https://en.wikipedia.org/wiki/Behenian_fixed_star
  get algol() {
    let algol = this._algol;

    if(algol === undefined) {
      algol = new Equatorial(this, 47.042219, 40.955647);
      this._algol = algol;
    }

    return algol;
  }

  get pleiades() {
    let pleiades = this._pleiades;

    if(pleiades === undefined) {
      pleiades = new Equatorial(this, 56.850000, 24.116667);
      this._pleiades = pleiades;
    }

    return pleiades;
  }

  get aldebaran() {
    let aldebaran = this._aldebaran;

    if(aldebaran === undefined) {
      aldebaran = new Equatorial(this, 68.980163, 16.509302);
      this._aldebaran = aldebaran;
    }

    return aldebaran;
  }

  get regulus() {
    let regulus = this._regulus;

    if(regulus === undefined) {
      regulus = new Equatorial(this, 152.092962, 11.967208);
      this._regulus = regulus;
    }

    return regulus;
  }

  get alkaid() {
    let alkaid = this._alkaid;

    if(alkaid === undefined) {
      alkaid = new Equatorial(this, 206.885157, 49.313267);
      this._alkaid = alkaid;
    }

    return alkaid;
  }

  get algorab() {
    let algorab = this._algorab;

    if(algorab === undefined) {
      algorab = new Equatorial(this, 187.466063, -16.515431);
      this._algorab = algorab;
    }

    return algorab;
  }

  get spica() {
    let spica = this._spica;

    if(spica === undefined) {
      spica = new Equatorial(this, 201.298246, -11.161319);
      this._spica = spica;
    }

    return spica;
  }

  get alphecca() {
    let alphecca = this._alphecca;

    if(alphecca === undefined) {
      alphecca = new Equatorial(this, 233.671950, 26.714692);
      this._alphecca = alphecca;
    }

    return alphecca;
  }

  get antares() {
    let antares = this._antares;

    if(antares === undefined) {
      antares = new Equatorial(this, 247.351915, -26.432003);
      this._antares = antares;
    }

    return antares;
  }

  get deneb_algedi() {
    let deneb_algedi = this._deneb_algedi;

    if(deneb_algedi === undefined) {
      deneb_algedi = new Equatorial(this, 326.760184, -16.127287);
      this._deneb_algedi = deneb_algedi;
    }

    return deneb_algedi;
  }

  // royal stars (alongside aldebaran, regulus, antares)
  // https://en.wikipedia.org/wiki/Royal_stars
  get fomalhaut() {
    let fomalhaut = this._fomalhaut;

    if(fomalhaut === undefined) {
      fomalhaut = new Equatorial(this, 344.100222, -31.565565);
      this._fomalhaut = fomalhaut;
    }

    return fomalhaut;
  }

  // other culturally important stars
  get polaris() {
    let polaris = this._polaris;

    if(polaris === undefined) {
      polaris = new Equatorial(this, 37.954542, 89.264111);
      this._polaris = polaris;
    }

    return polaris;
  }
}


function astro(date) {
  return new Astro(date);
}


module.exports = astro;
