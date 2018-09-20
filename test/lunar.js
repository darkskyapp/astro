"use strict";
const astro  = require("../index"),
      lunar  = require("../lib/lunar"),
      expect = require("chai").expect;

describe("lunar", () => {
  /* FIXME: lots of methods to test */

  /* http://aa.usno.navy.mil/data/docs/RS_OneDay.php */
  const inputs = [
      {
        // Albuquerque
        t: astro.date_to_julian(new Date("2006-03-20T19:06:28.800Z")),
        lat: 35.05,
        lon: -106.62
      },
      {
          // NYC starting at midnight for some day...
          t: astro.date_to_julian(new Date("2016-03-13T00:00:00-0500")),
          lat: 40.71,
          lon: -74.01
      },
      {
          // NYC ... later that day so we can get a diff moonrise time!
          t: astro.date_to_julian(new Date("2016-03-13T12:00:00-0500")),
          lat: 40.71,
          lon: -74.01
      },
      {
          // NYC ... a different period entirely...
          t: astro.date_to_julian(new Date("2017-12-01T00:00:00-0500")),
          lat: 40.71,
          lon: -74.01
      },
      {
          // NYC ... and forward in that period so we get no transit ...
          t: astro.date_to_julian(new Date("2017-12-01T22:30:00-0500")),
          lat: 40.71,
          lon: -74.01
      },
      {
          // NYC ... and forward in that period so we get next transit ...
          t: astro.date_to_julian(new Date("2017-12-01T23:30:00-0500")),
          lat: 40.71,
          lon: -74.01
      },
      {
          // Troy, NY .. but what's more important, right around the moon
          // transit time!!
          t: astro.date_to_julian(new Date("2016-01-01T05:00:00-0500")),
          lat: 42.73,
          lon: -73.68
      },
    ];

  const rises = [
    Date.parse("2006-03-21T00:16-0700"),
    Date.parse("2016-03-13T10:17-0400"),
    Date.parse("2016-03-14T11:04-0400"),
    Date.parse("2017-12-01T15:27-0500"),
    Date.parse("2017-12-02T16:10-0500"),
    Date.parse("2017-12-02T16:10-0500"),
    Date.parse("2016-01-02T00:04-0500"),
  ];

  const transits = [
    Date.parse("2006-03-21T05:02-0700"),
    Date.parse("2016-03-13T17:24-0400"),
    Date.parse("2016-03-13T17:24-0400"),
    Date.parse("2017-12-01T22:22-0500"),
    NaN,
    Date.parse("2017-12-02T23:20-0500"),
    Date.parse("2016-01-01T05:20-0500"),
  ];

  const sets = [
    Date.parse("2006-03-21T09:45-0700"),
    Date.parse("2016-03-14T00:31-0400"),
    Date.parse("2016-03-14T00:31-0400"),
    Date.parse("2017-12-01T04:13-0500"),
    Date.parse("2017-12-02T05:26-0500"),
    Date.parse("2017-12-02T05:26-0500"),
    Date.parse("2016-01-01T11:26-0500"),
  ];

  function _check_calculation(input, result, lookup_function) {
    const calculation = lookup_function(
        input.t,
        input.lat * (Math.PI / 180),
        input.lon * (Math.PI / 180)
    );
    const calculated_value = astro.julian_to_date(calculation).getTime();
    if(isNaN(result)) {
        expect(calculated_value).to.be.NaN; // jshint ignore:line
    } else {
        expect(
            calculated_value
        ).to.be.closeTo(result, 10 * 60 * 1000); // Allow error of 10min
    }
  }

  it("should return the next moonrise to a given time", () => {
    for(let i = 0; i < rises.length; i++) {
      _check_calculation(inputs[i], rises[i], lunar.rise);
    }
  });

  it("should return the nearest lunar transit to a given time", () => {
    for(let i = 0; i < transits.length; i++) {
        _check_calculation(inputs[i], transits[i], lunar.transit);
    }
  });

  it("should return the next moonset to a given time", () => {
    for(let i = 0; i < sets.length; i++) {
        _check_calculation(inputs[i], sets[i], lunar.set);
    }
  });


});
