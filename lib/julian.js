"use strict";
const J1970 = -10957.5;

function to(ms) {
  return J1970 + ms / 86400000;
}

function from(t) {
  return (t - J1970) * 86400000;
}

exports.to = to;
exports.from = from;
