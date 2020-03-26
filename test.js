"use strict";
const assert = require("assert");
const astro = require("./");

function assert_close(actual, expected, threshold) {
  if(!(Math.abs(actual - expected) <= threshold)) {
    throw new assert.AssertionError({
      message: `expected ${actual} to be within ${threshold} of ${expected}`,
      actual: actual,
      expected: expected,
    });
  }
}

function assert_angle(actual, expected, threshold) {
  let difference = Math.abs(actual - expected);
  if(difference > 180) {
    difference = 360 - difference;
  }

  if(!(difference <= threshold)) {
    throw new assert.AssertionError({
      message: `expected ${actual} to be within ${threshold} of ${expected}`,
      actual: actual,
      expected: expected,
    });
  }
}

describe("astro", () => {
  it("should return the position of the sun", () => {
    const spring = astro.sun(Date.parse("1999-03-21T01:46Z"));
    const summer = astro.sun(Date.parse("1999-06-21T19:49Z"));
    const autumn = astro.sun(Date.parse("1999-09-23T11:32Z"));
    const winter = astro.sun(Date.parse("1999-12-22T07:44Z"));

    assert_angle(spring.longitude,   0, 1/60);
    assert_angle(summer.longitude,  90, 1/60);
    assert_angle(autumn.longitude, 180, 1/60);
    assert_angle(winter.longitude, 270, 1/60);
    assert_angle(spring.latitude, 0, 1/3600);
    assert_angle(summer.latitude, 0, 1/3600);
    assert_angle(autumn.latitude, 0, 1/3600);
    assert_angle(winter.latitude, 0, 1/3600);
    assert_close(spring.distance, 0.996, 0.001);
    assert_close(summer.distance, 1.016, 0.001);
    assert_close(autumn.distance, 1.003, 0.001);
    assert_close(winter.distance, 0.984, 0.001);
  });

  it("should correctly determine rise/set/transit times", () => {
    const sun = astro.sun(Date.parse("2020-03-25T17:23-0400"));
    const lat =  42.6525;
    const lon = -73.7572;

    assert_close(
      sun.transit(lon),
      Date.parse("2020-03-25T13:00-0400"),
      60000,
    );
    assert_close(
      sun.ascend(lat, lon),
      Date.parse("2020-03-25T06:48-0400"),
      60000,
    );
    assert_close(
      sun.descend(lat, lon),
      Date.parse("2020-03-25T19:13-0400"),
      60000,
    );
  });
});
