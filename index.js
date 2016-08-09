"use strict";
const lunar = require("./lib/lunar"),
      solar = require("./lib/solar");

/* Convert to/from J2000 dates. */
const J1970 = -10957.5;

function unix_to_julian(unix) {
  return J1970 + unix / 86400;
}

function date_to_julian(date) {
  return J1970 + date.getTime() / 86400000;
}

function julian_to_unix(t) {
  return (t - J1970) * 86400;
}

function julian_to_date(t) {
  return new Date((t - J1970) * 86400000);
}

/* Greenwich mean sidereal time, accurate to ~1 second.
 * http://aa.usno.navy.mil/faq/docs/GAST.php */
const GMST0 = 18.697374558      * Math.PI / 12,
      GMST1 = 24.06570982441908 * Math.PI / 12;

function greenwich_mean_sidereal_time(t) {
  return GMST0 + GMST1 * t;
}

function local_sidereal_time(t, lon) {
  return greenwich_mean_sidereal_time(t) + lon;
}

exports.unix_to_julian      = unix_to_julian;
exports.date_to_julian      = date_to_julian;
exports.julian_to_unix      = julian_to_unix;
exports.julian_to_date      = julian_to_date;
exports.local_sidereal_time = local_sidereal_time;
exports.solar               = solar;
exports.lunar               = lunar;
