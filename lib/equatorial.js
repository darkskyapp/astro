"use strict";
const {asin, atan, cos, sin} = require("./math");
const Horizontal = require("./horizontal");

class Equatorial {
  constructor(d, right_ascension, declination) {
    this.d = d;
    this.right_ascension = right_ascension;
    this.declination = declination;
  }

  get gmst() {
    return (18.697374558 * 15) + (24.06570982441908 * 15) * this.d;
  }

  horizontal(lat, lon) {
    const ra = this.right_ascension;
    const dec = this.declination;
    const gmst = this.gmst;

    const ha = gmst + lon - ra;

    const sin_lat = sin(lat);
    const cos_lat = cos(lat);
    const sin_dec = sin(dec);
    const cos_dec = cos(dec);
    const tan_dec = sin_dec / cos_dec;
    const sin_ha = sin(ha);
    const cos_ha = cos(ha);

    return new Horizontal(
      asin(sin_lat * sin_dec + cos_lat * cos_dec * cos_ha),
      atan(-sin_ha, cos_lat * tan_dec - sin_lat * cos_ha),
    );
  }
}

module.exports = Equatorial;
