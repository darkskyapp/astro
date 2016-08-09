"use strict";
const astro  = require("../index"),
      lunar  = require("../lib/lunar"),
      expect = require("chai").expect;

describe("lunar", () => {
  /* FIXME: lots of methods to test */

  /*http://aa.usno.navy.mil/rstt/onedaytable
   *  ?ID=AA&year=2006&month=3&day=20&state=NM&place=Albuquerque */
  const date = new Date("2006-03-20T19:06:28.800Z"),
      t    = astro.date_to_julian(date),
      lat  = 35.05 * (Math.PI / 180),
      lon  = -106.62 * (Math.PI / 180);

  it("should return the next moonrise to a given time", () => {
    expect(astro.julian_to_date(lunar.rise(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-21T00:16-0700"), 420000);
  });

  it("should return the nearest lunar transit to a given time", () => {
    expect(astro.julian_to_date(lunar.transit(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-20T04:08-0700"), 420000);
  });

  it("should return the next moonset to a given time", () => {
    expect(astro.julian_to_date(lunar.set(t, lat, lon)).getTime()).
      to.be.closeTo(Date.parse("2006-03-21T09:45-0700"), 420000);
  });
});