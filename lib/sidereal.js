"use strict";

// Greenwich mean sidereal time, accurate to ~1 second.
// http://aa.usno.navy.mil/faq/docs/GAST.php
const GMST0 = 18.697374558 * Math.PI / 12;
const GMST1 = 24.06570982441908 * Math.PI / 12;


function greenwich_mean_sidereal_time(t) {
  return GMST0 + GMST1 * t;
}

function local_sidereal_time(t, lon) {
  return greenwich_mean_sidereal_time(t) + lon;
}


exports.greenwich = greenwich_mean_sidereal_time;
exports.local = local_sidereal_time;
