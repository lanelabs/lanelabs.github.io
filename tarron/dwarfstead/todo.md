
# Mobile Friendly view

I want some mobile friendly version and controls.

Fog of War - Don't make all squares visible until we can see them (so only 1 square deep, digging / making loose will reveal the block beyond as well). Making a bolock loose should make sure the 4 cardinal direction blocks are now visible, as if we carved all around the block. Also give my person a view distance, maybe up to 10 squares, with it being greyed out if I've seen it before but it's not in viewable distance. So If I dig into a tunnel I can't necessarily see the full length. Also, in order to test this, have it generate some tunnel shapes close to the surface and going down, with at least one breaking the surface near me in a hillside so I can go down it.


# Move system for companions

Have falling blocks not be blocked by companions, have the companion move out of the way towards me. Only have me stop falling blocks

# Features to add


# Block generation

Let's have the top layer be grass (green), then next layer be dirt (dark brown) then next layer be clay (current brown color). Actually, let's have the top layer be the dark brown with a small layer of green grass on top, and when we carve it out it just becomes all brown with flecks of green in it, as if it's a pile of dirt and some grass



Less sky, maybe only 20 blocks high.
Have sky be different color above ground vs below ground (ligher above, current color for below)
Have a gound line, were we keep track of above ground vs below ground, which we can use to have things like rain only show up above ground
Top layer of ground should have small bit of grass on top, maybe just a cosmetic color on the block that goes away when I mine it into a block. Have the op copule layers be dirt. If I mine a block of dirt that has grass in it, maybe turn it ito a dirt  block with flecks of grass in it? But cementing a dirt with grass block just turns it into a regular dirt block.
Have the top ground-level have some variation, ups and downs.


# Water system

I want water to be affected by gravity, flow downward (in ticks, etc). But not be a performance drag. Let's research a good recommended way to implement this in our stack.

generate random paths downward (lightning shaped ziz sag along block edges) where water seeps in that season. If intersects with an open area then it starts filling with water there.

# Ways to get more followers

Build housing from supply?

# ------------------------- bug

Noise tunnels should go up or down, any direction, basically long thinnish shapes that can fork or combine, but are 1 to 3 in width.


ladder endedu p with two anchors .Should only have one. I starte dfrom the bottom and built up to platform, when it anchord to platform instead. Also it shouldn't let me build a platform over a ladder (in the same tile, so it looks like the platform and the ladder top are aligned). Right now it shows green, but doesn't dow anything

inside/outside corners between layers should have a sloped look just like our chipped corners approach with the air.

Have full show full map in screen ,and DOESN'T move with my character

Add a black border around blocks, boundaries?