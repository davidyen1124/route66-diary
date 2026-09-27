// Hand-placed hi-res sprites. Characters: ' ' transparent, '.' black, '#' white,
// 'g' green, 'v' violet, 'o' orange, 'b' blue (see HiRes.sprite).
import { SMALL } from "./fontData.js";

// The two rental cars, both facing west (left): Part I's white Kia Sportage (an SUV,
// taller with three side windows) and Part II's cream Hyundai Elantra sedan.
export const SEDAN_BODY = [
  "                  ######################                ",
  "                ###bbbbbbbbbb##bbbbbbbbbb###             ",
  "              ###bbbbbbbbbbbb##bbbbbbbbbbbb###           ",
  "            ###bbbbbbbbbbbbbb##bbbbbbbbbbbbbb###         ",
  "   ####################################################  ",
  " ######################################################o ",
  "######################################################.oo",
  "##................................................######  ",
  "######################################################   ",
  " ###################################################     ",
];

export const SUV_BODY = [
  "         ##############################   ",
  "       ###bbbbbbbbbb##bbbbbbbbb##bbbbb##  ",
  "      ##bbbbbbbbbbbb##bbbbbbbbb##bbbbbb## ",
  "     ##bbbbbbbbbbbbb##bbbbbbbbb##bbbbbb## ",
  "    ##bbbbbbbbbbbbbb##bbbbbbbbb##bbbbbb## ",
  "  ######################################## ",
  " #########################################o",
  "##########################################o",
  "########################################## ",
  "##.....................................### ",
  "##########################################",
  " ######################################## ",
];

const WHEEL_A = [
  "...####...",
  "..######..",
  ".##....##.",
  ".##.##.##.",
  ".##.##.##.",
  ".##....##.",
  "..######..",
  "...####...",
];
const WHEEL_B = [
  "...####...",
  "..######..",
  ".###..###.",
  ".##....##.",
  ".##....##.",
  ".###..###.",
  "..######..",
  "...####...",
];

export const CAR_HEIGHT = { sedan: 15, suv: 17 };

// Draw the car with its wheels resting on row `ground - 1`.
export function drawCar(fb, x, ground, frame = 0, kind = "sedan") {
  const body = kind === "suv" ? SUV_BODY : SEDAN_BODY;
  const y = ground - CAR_HEIGHT[kind];
  fb.sprite(body, x, y);
  const wheel = frame % 2 ? WHEEL_B : WHEEL_A;
  const wy = ground - 8;
  const [front, rear] = kind === "suv" ? [4, 29] : [6, 40];
  fb.sprite(wheel, x + front, wy);
  fb.sprite(wheel, x + rear, wy);
}

export const CACTUS = [
  "     gggg     ",
  "    gggggg    ",
  "    gggggg gg ",
  " gg gggggg gg ",
  " gg gggggg gg ",
  " gg gggggggg  ",
  " gggggggggg   ",
  "  ggggggg     ",
  "    gggggg    ",
  "    gggggg    ",
  "    gggggg    ",
  "    gggggg    ",
  "    gggggg    ",
  "    gggggg    ",
];

export const TREE = [
  "    gggggggg    ",
  "  gggggggggggg  ",
  " gggg##gggggggg ",
  "gggggggggg##gggg",
  "gggggggggggggggg",
  " gggggggggggggg ",
  "   gggggggggg   ",
  "      oooo      ",
  "      oooo      ",
  "      oooo      ",
  "     oooooo     ",
];

export const PINE = [
  "      ##      ",
  "     gggg     ",
  "    gggggg    ",
  "   ##gggggg   ",
  "    gggggg    ",
  "   gggggggg   ",
  "  gggggggg##  ",
  "   gggggggg   ",
  "  gggggggggg  ",
  " ##gggggggggg ",
  "gggggggggggggg",
  "     oooo     ",
  "     oooo     ",
];

export const MOTEL = [
  "                  ##  ",
  "                  ##oo",
  "     oooooooooo   ##oo",
  "   oooooooooooooo ##  ",
  " oooooooooooooooooo#  ",
  "  ################ ## ",
  "  ##..##..##..##.# ## ",
  "  ##..##..##..##.# ## ",
  "  ################ ## ",
  "  ####....######## ## ",
  "  ####....######## ## ",
  "  ####....######## ## ",
];

export const PLANE = [
  "                        ##    ",
  "                       ###    ",
  "  ####################.####   ",
  " ##.##.##.##.##.##.#########  ",
  "##############################",
  " ############################ ",
  "      ########                ",
  "        ####                  ",
];

export const CLOUD = [
  "        bbbbbbb           ",
  "     bbbbb###bbbbb  bbb   ",
  "   bbbb#########bbbbbbbbb ",
  " bbbbbbbbbbbbbbbbbbbbbbbbb",
  "   bbbbbbbbbbbbbbbbbbbbb  ",
];

// Route 66 shield on a post; the digits are cut out of the white shield.
export function drawShield(fb, x, y) {
  const shape = [
    ".######..######.",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    ".##############.",
    "..############..",
    "...##########...",
    ".....######.....",
  ];
  fb.sprite(shape.map((r) => r.replace(/\./g, " ")), x, y);
  const six = SMALL["6"];
  fb.blitBits(six.slice(1, 8), six[0], x + 2, y + 3, { invert: true });
  fb.blitBits(six.slice(1, 8), six[0], x + 9, y + 3, { invert: true });
  fb.fill(x + 7, y + 14, 2, 12, "white");
}
export const SHIELD_HEIGHT = 26;

export function drawSprite(fb, name, x, y) {
  const table = { cactus: CACTUS, tree: TREE, pine: PINE, motel: MOTEL, plane: PLANE };
  if (name === "shield") drawShield(fb, x, y);
  else if (table[name]) fb.sprite(table[name], x, y);
}

export function spriteSize(name) {
  if (name === "shield") return { w: 16, h: SHIELD_HEIGHT };
  const table = { cactus: CACTUS, tree: TREE, pine: PINE, motel: MOTEL, plane: PLANE };
  const s = table[name];
  return s ? { w: s[0].length, h: s.length } : { w: 0, h: 0 };
}
