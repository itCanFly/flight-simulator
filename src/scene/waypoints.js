import * as THREE from 'three';

// Level 1: Beginner-friendly route with gentle ascent and wide turns (15 waypoints)
export const waypointsLevel1 = [
    new THREE.Vector3(1800, 1, -400),
    new THREE.Vector3(1800, 60, 100),
    new THREE.Vector3(1800, 120, 600),
    new THREE.Vector3(1800, 180, 1100),
    new THREE.Vector3(1700, 200, 1400),
    new THREE.Vector3(1400, 210, 1600),
    new THREE.Vector3(1000, 220, 1700),
    new THREE.Vector3(500, 220, 1750),
    new THREE.Vector3(0, 220, 1750),
    new THREE.Vector3(-400, 220, 1700),
    new THREE.Vector3(-700, 225, 1550),
    new THREE.Vector3(-800, 230, 1300),
    new THREE.Vector3(-850, 235, 1000),
    new THREE.Vector3(-900, 240, 600),
    new THREE.Vector3(-950, 245, 200),
];

// Level 2: Intermediate route with tighter turns and altitude changes (25 waypoints)
export const waypointsLevel2 = [
    new THREE.Vector3(1800, 10, -900),
    new THREE.Vector3(1850, 50, -800),
    new THREE.Vector3(1900, 80, -650),
    new THREE.Vector3(1950, 100, -500),
    new THREE.Vector3(2000, 130, -350),
    new THREE.Vector3(2050, 150, -200),
    new THREE.Vector3(2100, 170, -50),
    new THREE.Vector3(2100, 180, 150),
    new THREE.Vector3(2050, 190, 350),
    new THREE.Vector3(1950, 200, 550),
    new THREE.Vector3(1800, 210, 750),
    new THREE.Vector3(1600, 220, 900),
    new THREE.Vector3(1350, 225, 1050),
    new THREE.Vector3(1050, 230, 1150),
    new THREE.Vector3(700, 230, 1200),
    new THREE.Vector3(350, 235, 1250),
    new THREE.Vector3(0, 235, 1250),
    new THREE.Vector3(-350, 240, 1200),
    new THREE.Vector3(-650, 245, 1100),
    new THREE.Vector3(-900, 250, 950),
    new THREE.Vector3(-1100, 255, 750),
    new THREE.Vector3(-1250, 260, 500),
    new THREE.Vector3(-1350, 265, 200),
    new THREE.Vector3(-1400, 270, -100),
    new THREE.Vector3(-1450, 275, -400),
];

// Level 3: Advanced route with challenging altitude changes, rain, and complex path (40 waypoints)
export const waypointsLevel3 = [
    new THREE.Vector3(1800, 10, -900),
    new THREE.Vector3(1850, 40, -850),
    new THREE.Vector3(1900, 65, -780),
    new THREE.Vector3(1950, 85, -700),
    new THREE.Vector3(2000, 100, -610),
    new THREE.Vector3(2050, 120, -520),
    new THREE.Vector3(2100, 140, -420),
    new THREE.Vector3(2130, 160, -320),
    new THREE.Vector3(2150, 175, -210),
    new THREE.Vector3(2160, 190, -100),
    new THREE.Vector3(2160, 200, 20),
    new THREE.Vector3(2140, 210, 140),
    new THREE.Vector3(2100, 220, 260),
    new THREE.Vector3(2040, 230, 380),
    new THREE.Vector3(1960, 240, 500),
    new THREE.Vector3(1860, 245, 620),
    new THREE.Vector3(1740, 250, 730),
    new THREE.Vector3(1600, 255, 840),
    new THREE.Vector3(1440, 260, 940),
    new THREE.Vector3(1260, 265, 1030),
    new THREE.Vector3(1060, 270, 1110),
    new THREE.Vector3(840, 270, 1170),
    new THREE.Vector3(600, 275, 1220),
    new THREE.Vector3(350, 275, 1250),
    new THREE.Vector3(80, 280, 1260),
    new THREE.Vector3(-200, 280, 1250),
    new THREE.Vector3(-470, 285, 1220),
    new THREE.Vector3(-720, 290, 1160),
    new THREE.Vector3(-950, 295, 1080),
    new THREE.Vector3(-1150, 300, 980),
    new THREE.Vector3(-1320, 305, 860),
    new THREE.Vector3(-1460, 310, 720),
    new THREE.Vector3(-1570, 315, 560),
    new THREE.Vector3(-1650, 320, 380),
    new THREE.Vector3(-1700, 325, 180),
    new THREE.Vector3(-1720, 330, -40),
    new THREE.Vector3(-1710, 335, -270),
    new THREE.Vector3(-1670, 340, -500),
    new THREE.Vector3(-1600, 345, -730),
    new THREE.Vector3(-1500, 350, -950),
];

export function getWaypointsForLevel(level) {
    switch (level) {
        case 1: return waypointsLevel1;
        case 2: return waypointsLevel2;
        case 3: return waypointsLevel3;
        default: return waypointsLevel1;
    }
}
