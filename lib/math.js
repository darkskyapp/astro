"use strict";
const PI = Math.PI;
const RAD = PI / 180;
const DEG = 180 / PI;

const abs = Math.abs;
function asin(x) { return Math.asin(x) * DEG; }
function atan(y, x) { return 180 + Math.atan2(-y, -x) * DEG; }
function cos(x) { return Math.cos(x * RAD); }
function sin(x) { return Math.sin(x * RAD); }

// solve kepler's equation
function kepler(M, e) {
  let E = M + e * DEG * sin(M);

  for(;;) {
    const dM = M - (E - e * DEG * sin(E));
    const dE = dM / (1 - e * cos(E));
    E += dE;
    if(abs(dE) <= 10e-6) {
      break;
    }
  }

  return E;
}

exports.asin = asin;
exports.atan = atan;
exports.cos = cos;
exports.sin = sin;
exports.sqrt = Math.sqrt;
exports.kepler = kepler;
