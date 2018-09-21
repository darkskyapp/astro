"use strict";
const Lunar = require("./lunar");
const Solar = require("./solar");

class Astro {
  constructor() {
    this.lunar_cache = null;
    this.solar_cache = null;
  }

  lunar(time_ms) {
    if(this.lunar_cache === null) {
      this.lunar_cache = new Map();
    }

    let lunar = this.lunar_cache.get(time_ms);
    if(lunar === undefined) {
      lunar = new Lunar(time_ms);
      this.lunar_cache.set(time_ms, lunar);
    }

    return lunar;
  }

  solar(time_ms) {
    if(this.solar_cache === null) {
      this.solar_cache = new Map();
    }

    let solar = this.solar_cache.get(time_ms);
    if(solar === undefined) {
      solar = new Solar(time_ms);
      this.solar_cache.set(time_ms, solar);
    }

    return solar;
  }
}

module.exports = Astro;
