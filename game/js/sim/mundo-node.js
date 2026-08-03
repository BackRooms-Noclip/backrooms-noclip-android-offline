// Puente de pruebas Node ↔ motor del juego offline.
'use strict';

global.window = global;
require('../data.js');
require('../engine/rng.js');
require('../mapgen/mapgen.js');
require('../engine/fov.js');

const DATA = global.GAME_DATA;
const RNG = global.RNG;
const MapGen = global.MapGen;
const FOV = global.FOV;

function defParaLocal(def) {
  return {
    ...def,
    salidas: (def.salidas || []).map((s) => {
      const copia = { ...s };
      delete copia.prob;
      return copia;
    }),
  };
}

function generarMapa(nivelId, semilla) {
  const def = DATA.levels[nivelId];
  if (!def) throw new Error(`nivel desconocido: ${nivelId}`);
  const map = MapGen.generate(defParaLocal(def), RNG.create(semilla));
  return { def, map };
}

function esTransitable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.grid.w || y >= map.grid.h) return false;
  return MapGen.walkable(MapGen.at(map.grid, x, y));
}

module.exports = { DATA, RNG, MapGen, FOV, generarMapa, esTransitable };
