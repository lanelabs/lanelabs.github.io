# IN progress

## Water system

Hard wall on worlds edge, to prevent dumping water off world
Allow water to pool over free blocks, supporting that as a flag for items, whether water can flow through them and pool through them.

When water or gas leaves a pipe and immedately paths to a side, we still want to show the same curved trapezoid tile that shows up when a falling water or gas pillar hits a ground and curves, with the only difference being the visual should end at the same point that the pipe exit into pool does (top of the pipe for water flowing down, bottom of the pipe center square for gas flowing up)

# Gas

When I create a breach above a gas pool, it should start an air flow of gas from the breach and seek upward. Same with side breaches, etc. These should follow the algorithm to path seek for fluids. But there's also the system that if it detects that the place it flows into is filling a layer that connects to the start pool, it immediately resizes. It looks like we're incorrectly doing that because when I make a hole in the top of a gas cave it immedateily reshapes all up through the hole and into a pool up above, even though it wasn't an adjacent tile. If it was just making a 1x1 cavity above the gas then yes it should fill immediately. The immediate fill should ONLY happen if the filling layer is detected to be touching our starting pool. So If I dig a hole in the roof of a gas cavern and it connects it to a 1 wide 2 tall cavity above the gas, it whould flow at it's normal air flow rate as it fills up, but then when ti gets to the layer connecting the two pools it detects "hey this layer connect start and end pool" and it just then runs the pool recompute logic. Does that make sense? Ask me questions to make sure you understand.

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