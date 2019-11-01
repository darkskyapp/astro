"use strict";
const Equatorial = require("./lib/equatorial");
const Ecliptic = require("./lib/ecliptic");
const Rectangular = require("./lib/rectangular");

function j2000(date) {
  return date / 86400000 - 10957.5;
}

for(const luminary of [
  "sun",
  "moon",
]) {
  exports[luminary] = date => Ecliptic[luminary](j2000(date));
}

for(const planet of [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
]) {
  exports[planet] = date => {
    const d = j2000(date);
    const p = Rectangular[planet](d);

    const e = Rectangular.earth(d);
    p.x -= e.x;
    p.y -= e.y;
    p.z -= e.z;

    return p.ecliptic();
  };
}

for(const [fixed_star, lat, lon] of [
  // 10 brightest stars
  // https://en.wikipedia.org/wiki/List_of_brightest_stars
  ["sirius"         , 101.287155, -16.716116],
  ["canopus"        ,  95.987958, -52.695661],
  ["rigil_kentaurus", 219.899077, -60.835760],
  ["arcturus"       , 213.915417,  19.182222],
  ["vega"           , 279.234735,  38.783689],
  ["capella"        ,  79.172328,  45.997991],
  ["rigel"          ,  78.634467,  -8.201638],
  ["procyon"        , 114.825498,   5.224988],
  ["achernar"       ,  24.428523, -57.236753],
  ["betelgeuse"     ,  88.792939,   7.407064],

  // Behenian fixed stars (alongside sirius, arcturus, vega, capella, procyon)
  // https://en.wikipedia.org/wiki/Behenian_fixed_star
  ["algol"          ,  47.042219,  40.955647],
  ["pleiades"       ,  56.850000,  24.116667],
  ["aldebaran"      ,  68.980163,  16.509302],
  ["regulus"        , 152.092962,  11.967208],
  ["alkaid"         , 206.885157,  49.313267],
  ["algorab"        , 187.466063, -16.515431],
  ["spica"          , 201.298246, -11.161319],
  ["alphecca"       , 233.671950,  26.714692],
  ["antares"        , 247.351915, -26.432003],
  ["deneb_algedi"   , 326.760184, -16.127287],

  // royal stars (alongside aldebaran, regulus, antares)
  // https://en.wikipedia.org/wiki/Royal_stars
  ["fomalhaut"      , 344.100222, -31.565565],

  // other culturally important stars
  ["polaris"        ,  37.954542,  89.264111],
]) {
  exports[fixed_star] = date => new Equatorial(j2000(date), lat, lon);
}
