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
});
