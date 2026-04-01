# IN progress

## Water system

Have a visual indication on the path showing the direcion of water flow and quantity flowing (like 10 >) That will show how splits are handled too, with both directional numbers shown

  - Water curve around corners
  - Water getting sucked into pipe should have trapezoid with top at the level of the top of the pipe. going down tot he ground, looking like the water is getting sucked up in

Logic for combining streams, two falling into same pool

# Map grid

Grid doesn't seem to line up zero with top row. Numbers shoul be in middle of block height and width› It also doesn't seem to keep things aligned whne zoomed really far out, as it bunches up the grid in the top left where it doesn't even align wiht hte map.
Might be related to camera moving with dwarf

# Mobile Friendly view

I want some mobile friendly version and controls.

# Fog of war

Fog of War - Don't make all squares visible until we can see them (so only 1 square deep, digging / making loose will reveal the block beyond as well). Making a bolock loose should make sure the 4 cardinal direction blocks are now visible, as if we carved all around the block. Also give my person a view distance, maybe up to 10 squares, with it being greyed out if I've seen it before but it's not in viewable distance. So If I dig into a tunnel I can't necessarily see the full length. Also, in order to test this, have it generate some tunnel shapes close to the surface and going down, with at least one breaking the surface near me in a hillside so I can go down it.

# Block Visuals

When two blocks are touching corner to corner, specifically with sky or space in the opposite corners, we need to get the fill and chipping to look right. Right now it will both chip and try to fill, which looks disjointed. We should ahve t he top diagonal block take the top fill, and the bottom diagonal block use it's material for the bottom fill. This way we

When creating ladders off edges, we need wood to fillin the chipped corner.

# Ways to get more followers

Build housing from supply?

# ------------------------- bug

inside/outside corners between layers should have a sloped look just like our chipped corners approach with the air.

Add a black border around blocks, boundaries?



# Brand new features

Generate burried ruins, old building, tunnels, mines
clay layer
better veins, longer, fillaments and branches, chasing the vein