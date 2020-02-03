"use strict";
const J2000 = Date.parse("2000-01-01T11:58:55.816Z");

function to(ms) {
  return (ms - J2000) / 86400000;
}

function from(t) {
  return t * 86400000 + J2000;
}

exports.to = to;
exports.from = from;
