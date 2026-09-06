/** Central catalog of vendored CC0 GLB assets (Kenney), meshopt-compressed. */
export const MODELS = {
  // Factory / atelier
  cogA: "/models/factory/cog-a.glb",
  cogB: "/models/factory/cog-b.glb",
  cogC: "/models/factory/cog-c.glb",
  cogD: "/models/factory/cog-d.glb",
  cogE: "/models/factory/cog-e.glb",
  screenWide: "/models/factory/screen-wide.glb",
  screenFlat: "/models/factory/screen-flat.glb",
  screenHanging: "/models/factory/screen-hanging-wide.glb",
  screenPanel: "/models/factory/screen-panel-flat.glb",
  screenSmall: "/models/factory/screen-small.glb",
  machine: "/models/factory/machine.glb",
  machineBed: "/models/factory/machine-bed.glb",
  machineFortified: "/models/factory/machine-fortified.glb",
  machineWindow: "/models/factory/machine-window.glb",
  robotArmA: "/models/factory/robot-arm-a.glb",
  robotArmB: "/models/factory/robot-arm-b.glb",
  doorway: "/models/factory/structure-doorway.glb",
  wall: "/models/factory/structure-wall.glb",
  structureTall: "/models/factory/structure-tall.glb",
  structureMedium: "/models/factory/structure-medium.glb",
  doorOpen: "/models/factory/door-wide-open.glb",
  boxSmall: "/models/factory/box-small.glb",
  boxLarge: "/models/factory/box-large.glb",
  crane: "/models/factory/crane.glb",
  piston: "/models/factory/piston-round.glb",
  scanner: "/models/factory/scanner-high.glb",
  catwalk: "/models/factory/catwalk-straight.glb",
  hopper: "/models/factory/hopper-high-round.glb",
  warning: "/models/factory/warning-traffic.glb",
  topLarge: "/models/factory/top-large.glb",

  // Vehicles (abstract sculptures — no brand logos)
  sedan: "/models/car/sedan-sports.glb",
  hatchback: "/models/car/hatchback-sports.glb",
  raceFuture: "/models/car/race-future.glb",
  kart: "/models/car/kart-oodi.glb",
  wheelRacing: "/models/car/wheel-racing.glb",
  wheelDark: "/models/car/wheel-dark.glb",
  cone: "/models/car/cone.glb",
  suv: "/models/car/suv-luxury.glb",
  drivetrain: "/models/car/debris-drivetrain.glb",

  // Desk / cockpit
  desk: "/models/furniture/desk.glb",
  deskCorner: "/models/furniture/deskCorner.glb",
  laptop: "/models/furniture/laptop.glb",
  monitor: "/models/furniture/computerScreen.glb",
  keyboard: "/models/furniture/computerKeyboard.glb",
  mouse: "/models/furniture/computerMouse.glb",
  chairDesk: "/models/furniture/chairDesk.glb",
  speaker: "/models/furniture/speaker.glb",
  speakerSmall: "/models/furniture/speakerSmall.glb",
  tv: "/models/furniture/televisionModern.glb",
  lampFloor: "/models/furniture/lampRoundFloor.glb",
  lampCeiling: "/models/furniture/lampSquareCeiling.glb",
  bench: "/models/furniture/bench.glb",
  cardboard: "/models/furniture/cardboardBoxOpen.glb",
  books: "/models/furniture/books.glb",
  sideTable: "/models/furniture/sideTable.glb",

  // Industrial set dressing
  container: "/models/industrial/shipping-container-a.glb",
  tank: "/models/industrial/detail-tank.glb",
  chimney: "/models/industrial/chimney-small.glb",

  // Racing / garage lights
  lightPost: "/models/racing/lightPostModern.glb",
  lightPostLarge: "/models/racing/lightPostLarge.glb",
  pitsOffice: "/models/racing/pitsOffice.glb",
  barrier: "/models/racing/barrierWall.glb",
  radar: "/models/racing/radarEquipment.glb",
  pylon: "/models/racing/pylon.glb",
} as const;

export type ModelKey = keyof typeof MODELS;

/** Priority preload set for first viewport / hub. */
export const CORE_MODELS: ModelKey[] = [
  "doorway",
  "doorOpen",
  "wall",
  "structureTall",
  "desk",
  "monitor",
  "laptop",
  "keyboard",
  "chairDesk",
  "speaker",
  "cogA",
  "cogB",
  "screenWide",
  "machine",
  "lightPost",
];

/** Secondary zones — loaded after enter / idle. */
export const ZONE_MODELS: Record<string, ModelKey[]> = {
  diagnostic: ["scanner", "machineFortified", "robotArmA", "screenPanel", "boxLarge", "pitsOffice"],
  skills: ["screenHanging", "screenFlat", "screenSmall", "cogC", "cogD", "cogE", "robotArmB"],
  projects: ["bench", "boxSmall", "cardboard", "books", "piston", "topLarge", "machineBed"],
  passions: ["sedan", "kart", "wheelRacing", "hatchback", "tv", "cone", "drivetrain", "raceFuture"],
  cv: ["sideTable", "lampFloor", "monitor", "books"],
  contact: ["crane", "container", "radar", "pylon", "warning", "hopper", "barrier"],
};

export const HDRI_PATH = "/hdri/workshop_1k.hdr";
