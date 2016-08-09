"use strict";
const astro  = require("../index"),
      solar  = require("../lib/solar"),
      expect = require("chai").expect;

describe("solar", () => {
  /* FIXME: lots of methods to test */

  /*http://aa.usno.navy.mil/rstt/onedaytable
   *  ?ID=AA&year=2006&month=3&day=20&state=NM&place=Albuquerque */
  const date = new Date("2006-03-20T19:06:28.800Z"),
      t    = astro.date_to_julian(date),
      lat  = 35.05 * (Math.PI / 180),
      lon  = -106.62 * (Math.PI / 180);

  it("should return the nearest civil dawn to a given time", () => {
    expect(astro.julian_to_date(solar.dawn(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-20T05:45-0700"), 120000);
  });

  it("should return the nearest sunrise to a given time", () => {
    expect(astro.julian_to_date(solar.rise(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-20T06:10-0700"), 120000);
  });

  it("should return the nearest solar transit to a given time", () => {
    expect(
        astro.julian_to_date(solar.transit(t, lat, lon)).getTime()
      ).
      to.be.closeTo(Date.parse("2006-03-20T12:14-0700"), 120000);
  });

  it("should return the nearest sunset to a given time", () => {
    expect(astro.julian_to_date(solar.set(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-20T18:18-0700"), 120000);
  });

  it("should return the nearest civil dusk to a given time", () => {
    expect(astro.julian_to_date(solar.dusk(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-20T18:43-0700"), 120000);
  });
});