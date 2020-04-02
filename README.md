# Astro
A Javascript library that calculates the position of the sun, moon, and
planets. We aim to keep the library as simple and elegant as possible while
maintaining 1-2' accuracy.

## Usage
To look up the position of a planet in the solar system, do:

```javascript
const astro = require("astro");

const time = Date.now();
// or new Date(...).getTime(), or the like

const planet = astro.sun(time);
// or, similarly, astro.moon, astro.mercury, astro.venus, astro.mars,
// astro.jupiter, astro.saturn, astro.uranus, or astro.neptune.

console.log(
  planet.latitude, // ecliptic latitude, in degrees
  planet.longitude, // ecliptic longitude, in degrees
  planet.distance, // distance from the center of the earth, in AU
  planet.right_ascension, // equatorial right ascension, in hours
  planet.declination, // equatorial declination, in degrees
);
```

_(PLEASE NOTE: the formulae that we use are only valid between 1800 and 2050.)_

If you're interested in the position of a planet in the sky, you will need to
know the observer's latitude and longitude coordinates:

```javascript
// example latitude and longitude are for New York City
const lat = ;
const lon = ;

const observer = planet.observer(lat, lon);

console.log(
  observer.altitude, // altitude of the planet, in degrees
  observer.azimuth, // azimuth of the planet (measured clockwise
                    // from true north), in degrees
);
```

_(PLEASE NOTE: the moon is so close to the earth that its position as
measured from the center of the earth varies significantly from its position as
measured from the surface of the earth. This is called "parallax," and we
account for it.)_

If you're interested in knowing the time of the nearest rise, transit (e.g.
passing as close to overhead as possible), or set nearest to the given time for
an observer, you can do that too:

```javascript
console.log(
  new Date(planet.dawn(lat, lon)), // only defined for astro.sun()
  new Date(planet.rise(lat, lon)),
  new Date(planet.transit(lat, lon)),
  new Date(planet.set(lat, lon)),
  new Date(planet.dusk(lat, lon)), // only defined for astro.sun()
);

_(PLEASE NOTE: we define sunrise and sunset as "the apparent top of the sun
touches the horizon", we define moonrise and moonset as "the apparent center of
the moon touches the horizon", and for the planets as "the geometric center of
the planet touches the horizon".)_

Finally, if you're very performance-conscious, it is possible to reuse objects
if you want to see how the planet's position changes over time:

```javascript
// This will print the sunrise times for the upcoming month.
for(let i = 0; i < 30; i++) {
  planet.setTime(time + i * 86400000);
  console.log(new Date(planet.sunrise(lat, lon));
}
```

## Future Work
*   Add support for  moon phase and illumination percentage.
*   Add support for planetary magnitude (brightness).
*   Add support for computing astrological house cusps. I propose supporting
    Placidus (divide the celestial sphere temporally, used in modern US/UK
    astrology), Regiomontanus (divide the celestial sphere spatially, used in
    traditional Western astrology), Whole House (use the zodiac directly, used
    in traditional Hellenic astrology) for starters.
*   Extend the supported time interval from 1800–2050 to 1000–3000.
