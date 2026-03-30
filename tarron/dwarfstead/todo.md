# IN progress

## Water system

- [ ] Water breach or pipe draining into same pool as coming from?
- [ ] Wate3r snakes converging with other snakes
- [ ] water should not enter pipe if no valid entrace (to able-to-recive side slot or below slot)
- [ ] water draining ito pipe should take only 1 quantity to fill entire pipe tile, not 4 like regular tile
- [ ] pipes should not have gaps in the water fill color between connecting pipes
- [ ] pipes not disgorging all their water, they are hanging on to it
- [ ] have some pipes that drain to the side so we can verify this.
- [ ] have reservoir with pipe and breach
- [ ] have reservoir with multiple pipes
- [ ] have reservoir with multiple breachs at differnt size layers
- [ ] splitting snakes should have each head only advance when pushed to from above, meaning we don't get gaps in the snake from the alternating. That means the two heads will move at half speed, but the column of water stays all connected

- water not splitting correctly
- water should not be able to exit pipe flowing up. That breaks our free water rule. It should not be able to exit a pipe upwards. So our water world needs to have the upward pipe go around and up to the top of the pool and empty either to the side or downwards

- [ ] Water going in pipe is not pooling up once the pipe output is full. Also, cell right at exit of pipe still looks not full like regular standing water.  A pipe should be able to completely fill the ssqwuare after it's output block

- first output sqaure after a pipe exit flashes empty and then fills all at once. Should fill incrementally just like any layer, with ghost behidn it, etc, up to the pipe entrace, and then just sit as solid fill

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