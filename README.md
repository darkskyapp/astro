# astro
A library that calculates the position of the sun and moon in the sky.

Installation
------------

Use NPM in the usual way.

    npm install


Usage
-----

Methods for calculating positions of the moon are in the `lunar` submodule;
method for calculating positions of the sun, in `solar`. The top-level `astro`
module contains methods for calculating astronomical times.

    const astro = require("astro"),
          lunar = astro.lunar,
          solar = astro.solar;