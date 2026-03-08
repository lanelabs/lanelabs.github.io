// General
import antagonistic from './general/antagonistic.json';
import classicStoryArchetypes from './general/classic_story_archetypes.json';
import complexDynamic from './general/complex_dynamic.json';
import familyAndKinship from './general/family_and_kinship.json';
import functionalStory from './general/functional_story.json';
import professional from './general/professional.json';
import socialRelationship from './general/social_relationship.json';
import socialStatus from './general/social_status.json';
import supportingAndAllied from './general/supporting_and_allied.json';

// { world: [[name, description], ...] }
export const rolesByWorld = {
  general: [
    ...antagonistic.roles,
    ...classicStoryArchetypes.roles,
    ...complexDynamic.roles,
    ...familyAndKinship.roles,
    ...functionalStory.roles,
    ...professional.roles,
    ...socialRelationship.roles,
    ...socialStatus.roles,
    ...supportingAndAllied.roles,
  ],
  fantasy: [],
  modern: [],
  ocean: [],
  scifi: [],
};

/**
 * Get deduplicated role names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Role name strings
 */
export function getRoleNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of rolesByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
