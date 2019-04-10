"use strict";
const solar = require("../lib/solar");
const expect = require("chai").expect;


function limit_degrees(rad) {
  const degrees = rad * 180/ Math.PI /360.0;
  let limited = 360.0 * (degrees-Math.floor(degrees));
  if(limited < 0) {
    limited += 360.0;
  }
  return limited;
}

describe("solar", () => {
  /* FIXME: lots of methods to test */

  /* http://aa.usno.navy.mil/rstt/onedaytable
   *  ?ID=AA&year=2006&month=3&day=20&state=NM&place=Albuquerque */
  const ms = Date.parse("2006-03-20T19:06:28.800Z");
  const lat = 35.05;
  const lon = -106.62;

  it("should return the nearest civil dawn to a given time", () => {
    expect(solar.dawn(ms, lat, lon)).
      to.be.closeTo(Date.parse("2006-03-20T05:45-0700"), 120000);
  });

  it("should return the nearest sunrise to a given time", () => {
    expect(solar.rise(ms, lat, lon)).
      to.be.closeTo(Date.parse("2006-03-20T06:10-0700"), 120000);
  });

  it("should return the nearest solar transit to a given time", () => {
    expect(solar.transit(ms, lat, lon)).
      to.be.closeTo(Date.parse("2006-03-20T12:14-0700"), 120000);
  });

  it("should return the nearest sunset to a given time", () => {
    expect(solar.set(ms, lat, lon)).
      to.be.closeTo(Date.parse("2006-03-20T18:18-0700"), 120000);
  });

  it("should return the nearest civil dusk to a given time", () => {
    expect(solar.dusk(ms, lat, lon)).
      to.be.closeTo(Date.parse("2006-03-20T18:43-0700"), 120000);
  });

  it("should look up the position of the sun for an observer", () => {
    // OK, kids, gather round! We're going to digitally repeat Eratosthenes'
    // experiment to estimate the meridian arc using the sun.

    // At noon on the summer solstice, the sun is directly above Syene. We know
    // this since you can look down a deep well and see no shadow.
    // (NOTE: I cheated a little here! Syene is now Aswan, and Aswan is no
    // longer on the Tropic of Cancer (since the tropics migrate about 15 m/yr).
    // So I took Aswan's longitude but used the modern latitude.)
    const pos = solar.position(Date.parse("2019-06-21T11:50:07+0200"));

    const syene = pos.observer(23.43679, 32.899722);
    expect(90 - syene.elevation * 180 / Math.PI).to.be.closeTo(0, 0.01);
    expect(syene.azimuth * 180 / Math.PI).to.be.closeTo(88.8, 1);

    // Now, I'm in Alexandria and I measure the sun's angle at solar noon using
    // a meter-long gnomon. The length of its shadow is about 1/7 m.
    const alexandria = pos.observer(31.200000, 29.916667);
    expect(1 / Math.tan(alexandria.elevation)).to.be.closeTo(0.14, 0.01);
    expect(alexandria.azimuth * 180 / Math.PI).to.be.closeTo(161.2, 1);

    // I know from merchant traders that the distance between Alexandria and
    // Syene is about ~5000 stadia~ 912km. So how big is the earth?
    const earth = 912.017 * 2 * Math.PI / (syene.elevation - alexandria.elevation);
    expect(earth).to.be.closeTo(40075.017, 100);

    // Hey! Accurate to within a quarter of a percent! That's pretty good.
  });

  const spring = Date.parse("1999-03-21T01:46Z");
  const summer = Date.parse("1999-06-21T19:49Z");
  const autumn = Date.parse("1999-09-23T11:32Z");
  const winter = Date.parse("1999-12-22T07:44Z");

  it("should calculate the time of a given solar longitude", () => {
    const eps = 600000; // try to be accurate to 10 minutes

    // Note these dates are the times of the equinoxes and solstices in 1999.
    expect(solar.inverse_longitude(Math.PI * 0.0)).to.be.closeTo(spring, eps);
    expect(solar.inverse_longitude(Math.PI * 0.5)).to.be.closeTo(summer, eps);
    expect(solar.inverse_longitude(Math.PI * 1.0)).to.be.closeTo(autumn, eps);
    expect(solar.inverse_longitude(Math.PI * 1.5)).to.be.closeTo(winter, eps);
  });

  it("should calculate the distance of the sun", () => {
    expect(solar.distance(spring)).to.be.closeTo(1.00, 0.01);
    expect(solar.distance(summer)).to.be.closeTo(1.02, 0.01);
    expect(solar.distance(autumn)).to.be.closeTo(1.00, 0.01);
    expect(solar.distance(winter)).to.be.closeTo(0.98, 0.01);
  });

  it("should calculate azimuth of the sun", () => {
    // https://aa.usno.navy.mil/cgi-bin/aa_altazw.pl?form=2&body=10&year=2019&month=4&day=10&intv_mag=10&place=Salvador%2C+Brazil&lon_sign=-1&lon_deg=38&lon_min=28&lat_sign=-1&lat_deg=12&lat_min=58&tz=3&tz_sign=-1
    // Salvador, Brazil: -12.96667, -38.46667
    // April 10, 2019, 05:00 - 18:10-0300
    const salvador_positions = [
      84.2, 83.7, 83.1, 82.6, 82.0, 81.5, 80.9, 80.3, 79.7, 79.0, 78.4, 77.7,
      76.9, 76.2, 75.4, 74.5, 73.6, 72.6, 71.6, 70.5, 69.4, 68.1, 66.7, 65.2,
      63.6, 61.9, 59.9, 57.8, 55.4, 52.7, 49.8, 46.5, 42.8, 38.6, 34.0, 28.8,
      23.2, 17.0, 10.5, 3.6, 356.7, 349.9, 343.3, 337.2, 331.5, 326.3, 321.7,
      317.5, 313.8, 310.5, 307.5, 304.8, 302.4, 300.3, 298.3, 296.6, 294.9,
      293.5, 292.1, 290.8, 289.6, 288.6, 287.5, 286.6, 285.7, 284.8, 284.0,
      283.3, 282.5, 281.8, 281.2, 280.5, 279.9, 279.3, 278.7, 278.2, 277.6,
      277.1, 276.5, 276.0,
    ];
    const salvador_ms = Date.parse("2019-04-10T05:00:00-0300");
    for(let i = 0; i < salvador_positions.length; i++) {
      const azimuth = salvador_positions[i];
      const actual = solar.azimuth(salvador_ms + 600000 * i, -12.96667, -38.46667);
      expect(limit_degrees(actual)).to.be.closeTo(azimuth, 1);
    }

    // https://aa.usno.navy.mil/cgi-bin/aa_altazw.pl?form=2&body=10&year=2019&month=4&day=10&intv_mag=10&place=Stockholm%2C+Sweden&lon_sign=1&lon_deg=18&lon_min=4&lat_sign=1&lat_deg=59&lat_min=19&tz=2&tz_sign=1
    // Stockholm, Sweden: 59.31667, 18.06667
    // April 10, 2019, 4:10 - 21:30-0400
    const stockholm_positions = [
      51.1, 53.4, 55.7, 57.9, 60.2, 62.4, 64.6, 66.8, 69.0, 71.2, 73.3, 75.5,
      77.6, 79.7, 81.9, 84.0, 86.2, 88.3, 90.4, 92.6, 94.8, 96.9, 99.1, 101.3,
      103.6, 105.8, 108.1, 110.4, 112.7, 115.1, 117.5, 119.9, 122.4, 124.9,
      127.5, 130.0, 132.7, 135.4, 138.1, 140.9, 143.7, 146.5, 149.4, 152.4,
      155.4, 158.4, 161.5, 164.5, 167.7, 170.8, 173.9, 177.1, 180.3, 183.4,
      186.6, 189.8, 192.9, 196.0, 199.1, 202.1, 205.2, 208.1, 211.1, 214.0,
      216.8, 219.7, 222.4, 225.1, 227.8, 230.4, 233.0, 235.6, 238.1, 240.5,
      243.0, 245.4, 247.7, 250.1, 252.4, 254.6, 256.9, 259.1, 261.3, 263.5,
      265.7, 267.9, 270.0, 272.2, 274.3, 276.4, 278.6, 280.7, 282.9, 285.0,
      287.2, 289.3, 291.5, 293.7, 295.9, 298.1, 300.3, 302.6, 304.8, 307.1,
      309.4,
    ];
    const stockholm_ms = Date.parse("2019-04-10T04:10:00+0200");
    for(let i = 0; i < stockholm_positions.length; i++) {
      const azimuth = stockholm_positions[i];
      const actual = solar.azimuth(stockholm_ms + 600000 * i, 59.31667, 18.06667);
      expect(limit_degrees(actual)).to.be.closeTo(azimuth, 1);
    }

    // https://aa.usno.navy.mil/cgi-bin/aa_altazw.pl?form=2&body=10&year=2019&month=4&day=10&intv_mag=10&place=Sydney%2C+Australia&lon_sign=-1&lon_deg=151&lon_min=12&lat_sign=-1&lat_deg=33&lat_min=51&tz=10&tz_sign=-1
    // Sydney, Australia: -33.85, 151.2
    // April 10, 2019, 5:20 - 18:40+1000
    const sydney_positions = [
      88.3, 86.9, 85.6, 84.2, 82.8, 81.4, 80.0, 78.6, 77.2, 75.8, 74.3, 72.8,
      71.3, 69.7, 68.1, 66.5, 64.8, 63.0, 61.2, 59.4, 57.4, 55.4, 53.3, 51.1,
      48.9, 46.5, 44.0, 41.4, 38.7, 35.9, 33.0, 30.0, 26.8, 23.6, 20.2, 16.8,
      13.2, 9.6, 5.9, 2.3, 358.6, 354.9, 351.2, 347.6, 344.0, 340.6, 337.2,
      333.9, 330.7, 327.7, 324.7, 321.9, 319.2, 316.6, 314.1, 311.7, 309.4,
      307.2, 305.1, 303.1, 301.1, 299.3, 297.5, 295.7, 294.0, 292.3, 290.7,
      289.2, 287.6, 286.1, 284.7, 283.2, 281.8, 280.4, 279.0, 277.6, 276.3,
      274.9, 273.5, 272.2,
    ];
    const sydney_ms = Date.parse("2019-04-10T05:20:00+1000");
    for(let i = 0; i < sydney_positions.length; i++) {
      const azimuth = sydney_positions[i];
      const actual = solar.azimuth(sydney_ms + 600000 * i, -33.85, 151.2);
      expect(limit_degrees(actual)).to.be.closeTo(azimuth, 1);
    }
  });
});
