# The Last Bus Home - Flight Simulator

Welcome to **The Last Bus Home**, a 3D flight simulator game built with JavaScript and WebGL!

## Table of Contents
- [About](#about)
- [Features](#features)
- [How to Play](#how-to-play)
- [Controls](#controls)
- [How to Run the Game](#how-to-run-the-game)
- [Project Structure](#project-structure)
- [Credits](#credits)

---

## About
This project is a browser-based flight simulator where you control a flying bus through various levels, avoiding obstacles, managing fuel, and aiming to reach your destination.

## Features
- 3D graphics and models (GLB format)
- Multiple levels with increasing difficulty
- Realistic physics and controls
- Fuel management and refueling
- Sound effects and background music
- Game states: Main Menu, Level Select, Playing, Pause, Win, Lose, Game Over

## How to Play
1. **Open the game in your browser** (see below for instructions).
2. Click **PLAY** to start.
3. Select a level.
4. Use the controls to fly the bus, avoid obstacles, and reach the end of the level.
5. Manage your speed and fuel. Refuel when needed.
6. Complete all levels to win!

## Controls
- **Arrow Keys / WASD**: Steer the bus (left, right, up, down)
- **Spacebar**: Pause/Resume the game
- **Mouse**: Interact with UI buttons

## How to Run the Game
### Option 1: Open Directly (Recommended for Most Users)
1. Locate the `index.html` file in the project folder.
2. Double-click `index.html` to open it in your default web browser.

> **Note:** For full audio and 3D model support, use a modern browser (Chrome, Edge, Firefox). Some browsers may restrict local file access to audio/models. If you experience issues, use Option 2 below.

### Option 2: Run a Local Server (For Best Compatibility)
Some browsers block loading local files (like audio or 3D models) due to security restrictions. To avoid this, run a simple local server:

#### Using Node.js (if installed):
1. Open a terminal in the project folder.
2. Run:
	 ```
	 npx http-server
	 ```
3. Open the provided URL (usually `http://localhost:8080`) in your browser.

#### Using Python (if installed):
1. Open a terminal in the project folder.
2. Run:
	 - For Python 3:
		 ```
		 python -m http.server
		 ```
	 - For Python 2:
		 ```
		 python -m SimpleHTTPServer
		 ```
3. Open `http://localhost:8000` in your browser.

## Project Structure
```
index.html
package.json
public/
	assets/
		audio/         # Game sound effects and music
		models/        # 3D models (GLB)
		textures/      # Images and textures
src/
	main.js          # Main entry point
	game.js          # Game logic
	...              # Other scripts and modules
```

## Credits
- 3D Models: 
- Sound Effects: 
- Developed by: Pretty Mangwadi, Lesiba Kgokolo, Jan Moloto, Ravele Lebopa
---
Enjoy the game!