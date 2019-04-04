"use strict";
const solar = require("../lib/solar");
const expect = require("chai").expect;

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

    // Now, I'm in Alexandria and I measure the sun's angle at solar noon using
    // ~a gnomon~ Javascript and some math.
    const alexandria = pos.observer(31.200000, 29.916667);
    expect(90 - alexandria.elevation * 180 / Math.PI).to.be.closeTo(8, 1);

    // I know from merchant traders that the distance between Alexandria and
    // Syene is about ~5000 stadia~ 912km. So how big is the earth?
    const earth = 912.017 * 2 * Math.PI / (syene.elevation - alexandria.elevation);
    expect(earth).to.be.closeTo(40075.017, 200);

    // Hey! Accurate to within half a percent! That's pretty good.
  });
});
