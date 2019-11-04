"use strict";
const {expect} = require("chai");
const astro = require("./");

function tan(x) {
  return Math.tan(x * (Math.PI / 180));
}

function angle_difference(a, b) {
  let c = Math.abs(a - b);
  if(c > 180) {
    c = 360 - c;
  }
  return c;
}

describe("astro", () => {
  it("should correctly find the sun's position at seasonal ingress", () => {
    const spring = astro(Date.parse("1999-03-21T01:46Z")).sun;
    const summer = astro(Date.parse("1999-06-21T19:49Z")).sun;
    const autumn = astro(Date.parse("1999-09-23T11:32Z")).sun;
    const winter = astro(Date.parse("1999-12-22T07:44Z")).sun;

    expect(spring.distance).to.be.closeTo(1.00, 0.01);
    expect(summer.distance).to.be.closeTo(1.02, 0.01);
    expect(autumn.distance).to.be.closeTo(1.00, 0.01);
    expect(winter.distance).to.be.closeTo(0.98, 0.01);

    expect(spring.longitude).to.be.closeTo(  0, 0.01);
    expect(summer.longitude).to.be.closeTo( 90, 0.01);
    expect(autumn.longitude).to.be.closeTo(180, 0.01);
    expect(winter.longitude).to.be.closeTo(270, 0.01);

    expect(spring.latitude).to.be.closeTo(0, 0.01);
    expect(summer.latitude).to.be.closeTo(0, 0.01);
    expect(autumn.latitude).to.be.closeTo(0, 0.01);
    expect(winter.latitude).to.be.closeTo(0, 0.01);
  });

  it("should correctly repeat Eratosthenes' experiment", () => {
    // OK, kids, gather round! We're going to digitally repeat Eratosthenes'
    // experiment to estimate the meridian arc using the sun.

    // At noon on the summer solstice, the sun is directly above Syene. We know
    // this since you can look down a deep well and see no shadow.
    // (NOTE: I cheated a little here! Syene is now Aswan, and Aswan is no
    // longer on the Tropic of Cancer (since the tropics migrate about 15 m/yr).
    // So I took Aswan's longitude but used the modern latitude.)
    const sun = astro(Date.parse("2019-06-21T11:50:07+0200")).sun;

    const syene = sun.horizontal(23.43679, 32.899722);
    expect(syene.altitude).to.be.closeTo(90, 0.01);
    // NOTE: Don't test azimuth here. It's a non-sense number when the sun is
    // directly overhead.

    // Now, I'm in Alexandria and I measure the sun's angle at solar noon using
    // a meter-long gnomon. The length of its shadow is about 1/7 m.
    const alexandria = sun.horizontal(31.200000, 29.916667);
    expect(1 / tan(alexandria.altitude)).to.be.closeTo(1 / 7, 0.01);
    // Check the azimuth, just to make sure it's there and correct.
    expect(angle_difference(alexandria.azimuth, 161.2)).to.be.at.most(1);

    // I know from merchant traders that the distance between Alexandria and
    // Syene is about ~5000 stadia~ 912km. So how big is the earth?
    const earth = 912.017 * 360 / (syene.altitude - alexandria.altitude);
    expect(earth).to.be.closeTo(40075.017, 100);

    // Hey! Accurate to within a quarter of a percent! That's pretty good.
  });

  it("should correctly find azimuth of the sun", () => {
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
      const actual = astro(salvador_ms + i * 600000).sun.horizontal(-12.96667, -38.46667).azimuth;
      const expected = salvador_positions[i];
      expect(angle_difference(actual, expected)).to.be.at.most(1);
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
      const actual = astro(stockholm_ms + i * 600000).sun.horizontal(59.31667, 18.06667).azimuth;
      const expected = stockholm_positions[i];
      expect(angle_difference(actual, expected)).to.be.at.most(1);
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
      const actual = astro(sydney_ms + i * 600000).sun.horizontal(-33.85, 151.20).azimuth;
      const expected = sydney_positions[i];
      expect(angle_difference(actual, expected)).to.be.at.most(1);
    }
  });

  // https://www.astro.com/swisseph/ae/2000/ae_2019.pdf
  it("should correctly give the positions of the planets", () => {
    const a = astro(Date.UTC(2019));

    // FIXME: these tolerances seem way too high to me... bug?
    expect(angle_difference(a.sun.longitude, 280.25)).to.be.at.most(0.01);
    // FIXME: enable this when the moon is supported again
    // expect(angle_difference(a.moon.longitude, 222.37)).to.be.at.most(0.02);
    expect(angle_difference(a.mercury.longitude, 263.85)).to.be.at.most(0.25);
    expect(angle_difference(a.venus.longitude, 233.50)).to.be.at.most(0.27);
    expect(angle_difference(a.mars.longitude, 359.93)).to.be.at.most(0.25);
    expect(angle_difference(a.jupiter.longitude, 251.77)).to.be.at.most(0.22);
    expect(angle_difference(a.saturn.longitude, 281.38)).to.be.at.most(0.24);
    expect(angle_difference(a.uranus.longitude, 28.62)).to.be.at.most(0.25);
    expect(angle_difference(a.neptune.longitude, 344.08)).to.be.at.most(0.25);
  });

  it("should correctly give the position of polaris", () => {
    // polaris should be pretty close to the north celestial pole
    const polaris = astro(Date.UTC(2000)).polaris.horizontal(40.661, -73.944);
    expect(polaris.declination).to.be.closeTo(90, 1);
    expect(angle_difference(polaris.azimuth, 0)).to.be.at.most(1);
  });
});
