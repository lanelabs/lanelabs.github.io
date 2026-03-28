# Water flow

Pool not draining out side hole correctly

# Map generation

HOles are not overlapping sections, they're geting cut off by the dirt layer.
Tunnels connecting things

Generate burried ruins, old building, tunnels, mines

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

# Move system for companions

Have falling blocks not be blocked by companions, have the companion move out of the way towards me. Only have me stop falling blocks

Make companions always just be teleported to near me when they're part of my train, no need to actually get blocked, unless they are running errands

# Map layers

have types of fill depend on what layer is getting generated

More caverns to fill spaces in the stone layer.
more small caverns in the dirt layer
wider dirt layer
vertical "layers"
cavern layer that is mostly space, disjoined "floor" levels

Sky
dirt
clay
stone
bedrock
cavern layer (much more caverns)


# Water system

should only color top chip if 5/5 layers filled

Wtaer pools in map

Other liquids in map

Flip water system for gas

I want water to be affected by gravity, flow downward (in ticks, etc). But not be a performance drag. Let's research a good recommended way to implement this in our stack.

generate random paths downward (lightning shaped ziz sag along block edges) where water seeps in that season. If intersects with an open area then it starts filling with water there.

# Ways to get more followers

Build housing from supply?

# ------------------------- bug

Noise tunnels should go up or down, any direction, basically long thinnish shapes that can fork or combine, but are 1 to 3 in width.


inside/outside corners between layers should have a sloped look just like our chipped corners approach with the air.

Have full show full map in screen ,and DOESN'T move with my character

Add a black border around blocks, boundaries?

