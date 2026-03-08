// General
import human from './general/human.json';

// Fantasy
import aarakocra from './fantasy/aarakocra.json';
import aasimar from './fantasy/aasimar.json';
import aboleth from './fantasy/aboleth.json';
import brownie from './fantasy/brownie.json';
import bugbear from './fantasy/bugbear.json';
import centaur from './fantasy/centaur.json';
import changeling from './fantasy/changeling.json';
import cyclops from './fantasy/cyclops.json';
import dhampir from './fantasy/dhampir.json';
import dragonborn from './fantasy/dragonborn.json';
import dryad from './fantasy/dryad.json';
import dwarf from './fantasy/dwarf.json';
import elemental from './fantasy/elemental.json';
import elf from './fantasy/elf.json';
import fairy from './fantasy/fairy.json';
import firbolg from './fantasy/firbolg.json';
import genasi from './fantasy/genasi.json';
import giant from './fantasy/giant.json';
import giff from './fantasy/giff.json';
import githyanki from './fantasy/githyanki.json';
import githzerai from './fantasy/githzerai.json';
import gnoll from './fantasy/gnoll.json';
import gnome from './fantasy/gnome.json';
import goblin from './fantasy/goblin.json';
import goliath from './fantasy/goliath.json';
import grung from './fantasy/grung.json';
import hadozee from './fantasy/hadozee.json';
import hag from './fantasy/hag.json';
import halfling from './fantasy/halfling.json';
import harengon from './fantasy/harengon.json';
import harpy from './fantasy/harpy.json';
import hexblood from './fantasy/hexblood.json';
import hobgoblin from './fantasy/hobgoblin.json';
import kalashtar from './fantasy/kalashtar.json';
import kenku from './fantasy/kenku.json';
import kobold from './fantasy/kobold.json';
import kuoToa from './fantasy/kuo_toa.json';
import lamia from './fantasy/lamia.json';
import leonin from './fantasy/leonin.json';
import lizardfolk from './fantasy/lizardfolk.json';
import locathah from './fantasy/locathah.json';
import loxodon from './fantasy/loxodon.json';
import medusa from './fantasy/medusa.json';
import merfolk from './fantasy/merfolk.json';
import mindFlayer from './fantasy/mind_flayer.json';
import minotaur from './fantasy/minotaur.json';
import naga from './fantasy/naga.json';
import nymph from './fantasy/nymph.json';
import ogre from './fantasy/ogre.json';
import orc from './fantasy/orc.json';
import owlin from './fantasy/owlin.json';
import pixie from './fantasy/pixie.json';
import plasmoid from './fantasy/plasmoid.json';
import reborn from './fantasy/reborn.json';
import sahuagin from './fantasy/sahuagin.json';
import satyr from './fantasy/satyr.json';
import seaHag from './fantasy/sea_hag.json';
import seelieCourtNoble from './fantasy/seelie_court_noble.json';
import shifter from './fantasy/shifter.json';
import simicHybrid from './fantasy/simic_hybrid.json';
import siren from './fantasy/siren.json';
import sphinx from './fantasy/sphinx.json';
import sprite from './fantasy/sprite.json';
import tabaxi from './fantasy/tabaxi.json';
import thriKreen from './fantasy/thri_kreen.json';
import tiefling from './fantasy/tiefling.json';
import tortle from './fantasy/tortle.json';
import treant from './fantasy/treant.json';
import triton from './fantasy/triton.json';
import troglodyte from './fantasy/troglodyte.json';
import troll from './fantasy/troll.json';
import unseelieCourtNoble from './fantasy/unseelie_court_noble.json';
import vedalken from './fantasy/vedalken.json';
import warforged from './fantasy/warforged.json';
import yuanTi from './fantasy/yuan_ti.json';

// { world: [[raceName, description], ...] }
// Each race file has { subraces: [[name, desc], ...] }
export const racesByWorld = {
  general: [
    ...human.subraces,
  ],
  fantasy: [
    ...aarakocra.subraces,
    ...aasimar.subraces,
    ...aboleth.subraces,
    ...brownie.subraces,
    ...bugbear.subraces,
    ...centaur.subraces,
    ...changeling.subraces,
    ...cyclops.subraces,
    ...dhampir.subraces,
    ...dragonborn.subraces,
    ...dryad.subraces,
    ...dwarf.subraces,
    ...elemental.subraces,
    ...elf.subraces,
    ...fairy.subraces,
    ...firbolg.subraces,
    ...genasi.subraces,
    ...giant.subraces,
    ...giff.subraces,
    ...githyanki.subraces,
    ...githzerai.subraces,
    ...gnoll.subraces,
    ...gnome.subraces,
    ...goblin.subraces,
    ...goliath.subraces,
    ...grung.subraces,
    ...hadozee.subraces,
    ...hag.subraces,
    ...halfling.subraces,
    ...harengon.subraces,
    ...harpy.subraces,
    ...hexblood.subraces,
    ...hobgoblin.subraces,
    ...kalashtar.subraces,
    ...kenku.subraces,
    ...kobold.subraces,
    ...kuoToa.subraces,
    ...lamia.subraces,
    ...leonin.subraces,
    ...lizardfolk.subraces,
    ...locathah.subraces,
    ...loxodon.subraces,
    ...medusa.subraces,
    ...merfolk.subraces,
    ...mindFlayer.subraces,
    ...minotaur.subraces,
    ...naga.subraces,
    ...nymph.subraces,
    ...ogre.subraces,
    ...orc.subraces,
    ...owlin.subraces,
    ...pixie.subraces,
    ...plasmoid.subraces,
    ...reborn.subraces,
    ...sahuagin.subraces,
    ...satyr.subraces,
    ...seaHag.subraces,
    ...seelieCourtNoble.subraces,
    ...shifter.subraces,
    ...simicHybrid.subraces,
    ...siren.subraces,
    ...sphinx.subraces,
    ...sprite.subraces,
    ...tabaxi.subraces,
    ...thriKreen.subraces,
    ...tiefling.subraces,
    ...tortle.subraces,
    ...treant.subraces,
    ...triton.subraces,
    ...troglodyte.subraces,
    ...troll.subraces,
    ...unseelieCourtNoble.subraces,
    ...vedalken.subraces,
    ...warforged.subraces,
    ...yuanTi.subraces,
  ],
  modern: [],
  ocean: [],
  scifi: [],
};

/**
 * Get deduplicated race/subrace names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Race name strings
 */
export function getRaceNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of racesByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
