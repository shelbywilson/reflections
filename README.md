# Reflections on Reflections
This was a really fun and challenging problem to work on! Below are some reflections on the process.

## Time spent
~30 minutes researching/understanding the problem both through physically looking at mirrors, reading ([Reflection (physics)](https://en.wikipedia.org/wiki/Reflection_(physics)), [Ray (optics)](https://en.wikipedia.org/wiki/Ray_(optics))), and prompting AI (more below).

<img src="https://github.com/user-attachments/assets/c8d3b462-33d6-4f69-bf23-55c6499048ca" alt="Image of parallel mirrors reflecting a yellow toolbox that is in frame" height="500">
<br/>
<em>Image of parallel mirrors reflecting a yellow toolbox that is in frame</em>

~20 minutes getting the project set up with Vite/React/Typescript, and ~5 hours coding the actual interactive piece. I spent the biggest chunk of time working on getting the rays to bounce between the two mirrors at accurate angles. 

45 minutes on write up and deployment.

## Other topics in optics
This could be extended to explore cameras/photography, lenses, and refraction.

## Other topics in STEM
This could also be extended to explore ray-tracing in computer graphics, in which simulated rays of light are traced from a camera to object to light source (the inverse of optical rays).

This could also be a good basis for an interactive about vector math or geometry, exposing more of the underlying computation to the user.

## Additional features
There are plenty of things I didn't get to during this exercise that I would have loved to add! Including:
- displaying direction of rays from object/virtual object to observer
- animating light from object to mirror(s) to observer
  - optionally: hover on virtual object to see path of light rays
- more toolbar controls
  - control max number of reflections
  - toggle angle of incidence labels
  - adjustable max number of reflections (currently hardcoded)
- add support for virtual rooms, and displaying virtual rooms/objects beyond perpendicular mirrors  
- add POV of observer 
  - and configurable field of view
- better hover states and interaction cues
- refined visual style :) 

## Use of AI
I used AI (Claude in this case) both to write functions and to learn about the problem itself. I leaned on it for vector math especially, and found it to be most helpful when giving it a constrained prompt (e.g. "write a function to find intersection of two line segments"). 
