// Prompts for the Apple II–style artwork, generated with Codex's imagegen skill
// (built-in image_gen tool). Run `node scripts/apple2-art/jobs.mjs` to write batch
// files, then process the results with `node scripts/apple2-art/process.mjs`.

export const STYLE = [
  "Style/medium: authentic 1985 Apple II hi-res computer graphics, like the landmark pictures in MECC's The Oregon Trail on the Apple II.",
  "Chunky low-resolution pixel art at a true ~280x192 Apple II resolution: every art pixel is a large, clearly visible square block, and the whole picture is only about 280 art pixels wide.",
  "Strictly limited to six colors: black #000000, white #FFFFFF, green #38CB00, violet #C734FF, orange #F25E00, blue #0DA1FF.",
  "Shading and texture only with coarse dither patterns (checkerboards, stripes) of those six colors; large flat color areas; bold readable silhouettes; black for outlines and shadows.",
].join("\n");

export const CONSTRAINTS =
  "Constraints: no other colors, no gradients, no anti-aliasing, no brand logos, no readable text or lettering unless named in the request, no UI, no border, no watermark. People appear only as small generic figures, no recognizable faces.";

// The rental cars, from the Hertz receipts.
export const CARS = {
  1: "a white 2026 Kia Sportage compact SUV (modern crossover SUV shape, not a sedan)",
  2: "a cream/off-white 2026 Hyundai Elantra compact sedan (modern four-door sedan)",
};

const BAND = "Composition: wide landscape; keep every important subject inside the central horizontal band between 20% and 80% of the image height, because the top and bottom 20% will be cropped away.";
const FRAME = "Composition: wide landscape; keep every important subject inside the middle 85% of the image height.";

// Day pictures: redraw each original illustration (used as a composition reference)
// in the Apple II style, with the real rental car.
export const LANDMARKS = [
  { id: "landmark-part1-hero", ref: "public/assets/part1/route66-part1-hero.png", part: 1, car: true, scene: "a coastal highway leaving Santa Monica (pier with a ferris wheel at the far left, Pacific beach) curving inland into orange desert with red mesas at sunset; a Route 66 shield sign on a post at the right" },
  { id: "landmark-part2-hero", ref: "public/assets/part2/route66-part2-hero.png", part: 2, car: true, scene: "a straight two-lane highway across green Illinois prairie and cornfields under a bright blue sky with puffy white clouds; a green WEST / Route 66 shield sign on a post at the right" },
  { id: "landmark-p1d1", ref: "public/assets/part1/day1-sjc-lax.webp", part: 1, car: false, scene: "inside an airport terminal at dusk in the rain: big windows looking out at a parked white passenger jet, a jet bridge, a waterfront marina with palm trees and a small hotel beyond; rows of gate seats and rolling suitcases in the foreground" },
  { id: "landmark-p1d2", ref: "public/assets/part1/day2-santa-monica-barstow.webp", part: 1, car: true, scene: "Santa Monica pier with its ferris wheel at sunset on the left, a stone trail marker, a winding road leading inland past a mission-style building toward desert mountains and telephone poles" },
  { id: "landmark-p1d3", ref: "public/assets/part1/day3-bottle-trees-needles.webp", part: 1, car: true, scene: "Mojave high desert at sunset: bottle trees (metal poles with branches of colored glass bottles) on the left, ghost-town wooden buildings, red buttes, a tall neon motel sign on a pole at the right, a Route 66 shield sign" },
  { id: "landmark-p1d4", ref: "public/assets/part1/day4-oatman-kingman.webp", part: 1, car: true, scene: "Oatman, Arizona in the rain at dusk: old west wooden storefronts with porches on both sides of a wet main street, a group of wild burros standing in the road in front of the car with its headlights on, mountains behind" },
  { id: "landmark-p1d5", ref: "public/assets/part1/day5-kingman-williams.webp", part: 1, car: true, scene: "an old roadside general store with vintage gas pumps on the left, a snowy small mountain town street stretching toward snow-capped peaks, pine trees, a rusty old truck by the fence" },
  { id: "landmark-p1d6", ref: "public/assets/part1/day6-snowy-flagstaff.webp", part: 1, car: true, scene: "heavy snowfall at night: the car driving on a snowy curving road into Flagstaff, snow-covered pine trees, a lit historic mansion on the hill and a warm brick downtown with a turret below, a snowy guardrail" },
  { id: "landmark-p1d7", ref: "public/assets/part1/day7-winslow-la-posada.webp", part: 1, car: true, scene: "Winslow, Arizona on a clear day: a brick corner building with a lamppost and a bronze statue of a man with a guitar standing on the corner, the Spanish-style La Posada hotel with arches and a garden behind, a freight train in the distance" },
  { id: "landmark-p1d8", ref: "public/assets/part1/day8-winslow-santa-fe.webp", part: 1, car: true, scene: "light snow on the high desert: a row of white concrete teepee motel rooms with vintage cars on the left, a small gas station and ice cream stand on the right, a wet highway leading to snowy mountains and an adobe town" },
  { id: "landmark-p1d9", ref: "public/assets/part1/day9-santa-fe-wandering.webp", part: 1, car: true, scene: "a sunny winter street in downtown Santa Fe: brown adobe shops with turquoise doors on both sides, a stone gothic chapel with a rose window and an adobe mission church ahead, bare trees, patches of snow, mountains behind" },
  { id: "landmark-p1d10", ref: "public/assets/part1/day10-santa-fe-albuquerque.webp", part: 1, car: true, scene: "an adobe folk-art courtyard with carved wooden figures, pottery, and a small cafe table with coffee on the left; the car on a road winding across the desert toward a distant airport with a plane taking off under a cloudy sky" },
  { id: "landmark-p2d1", ref: "public/assets/part2/day1-red-eye.png", part: 2, car: false, scene: "a late-night airport gate: through tall windows a white passenger jet waits at a jet bridge under yellow apron lights; silhouettes of a few travelers in rows of gate seats, carry-on suitcases and a backpack in the foreground" },
  { id: "landmark-p2d2", ref: "public/assets/part2/day2-joliet-pontiac.png", part: 2, car: true, scene: "the Gemini Giant: a tall green fiberglass astronaut statue holding a silver rocket on a pedestal beside a straight Illinois highway, prairie fields, a distant town with an old prison, morning sun" },
  { id: "landmark-p2d3", ref: "public/assets/part2/day3-pontiac-springfield.png", part: 2, car: true, scene: "Pontiac, Illinois: a big painted mural of a vintage car on a brick wall at the left, a roadside giant lumberjack statue holding a giant hot dog, a small suspension footbridge over a river, and the Illinois capitol dome with brick houses on the right at golden hour. The reference image is cut off at the bottom; complete the scene naturally with the road and the car in the foreground." },
  { id: "landmark-p2d4", ref: "public/assets/part2/day4-springfield-st-louis.webp", part: 2, car: true, scene: "the Illinois capitol dome among trees on the left, a road leading toward the St. Louis Gateway Arch and city skyline on the right horizon, late afternoon sun", avoid: "dinosaurs, skeletons, fossils, or any statue" },
  { id: "landmark-p2d5", ref: "public/assets/part2/day5-st-louis-route66.webp", part: 2, car: true, scene: "St. Louis at sunset: the steel Chain of Rocks Bridge with its bend over the Mississippi on the left, the tall silver Gateway Arch and downtown skyline in the middle, the whimsical City Museum building with an airplane and slides, a giant catsup-bottle water tower on stilts at the right, the grand stone Union Station train shed below, a small white frozen-custard stand by the road" },
  { id: "landmark-p2d6", ref: "public/assets/part2/day6-st-louis-springfield-mo-corrected.webp", part: 2, car: true, scene: "Missouri Ozarks hills on a hot summer day: a giant red rocking chair on the hilltop at the left, a long brick wall of painted history murals, a small motor court with garage doors, a vintage motel with a tall arrow-shaped neon sign in the middle, a huge travel center on the hill at the right" },
  { id: "landmark-p2d7", ref: "public/assets/part2/day7-precious-moments-red-oak-corrected.webp", part: 2, car: true, scene: "southwest Missouri at golden hour: a rustic farm gate with a giant chicken statue and a giant egg at the left, a small white chapel with a painted angel, a row of old brick and stone storefronts, a green Victorian house, a vintage glass-cylinder gas pump, and an old red streetcar on the right, a dirt road" },
  { id: "landmark-p2d8", ref: "public/assets/part2/day8-oklahoma-route66.webp", part: 2, car: true, scene: "Oklahoma at sunset: a tall painted concrete totem pole topped by an eagle at the left, a smiling blue whale in a pond, a red round barn with a domed roof, a giant slender soda-bottle sculpture, and the tall stepped art-deco First National tower in Oklahoma City at the right" },
  { id: "landmark-p2d9", ref: "public/assets/part2/day9-clinton-mclean-big-texan.webp", part: 2, car: true, scene: "the Texas Panhandle at sunset: a brick Route 66 museum with a windmill at the left, a small vintage gas station, a long straight road across flat golden plains to the horizon, a yellow Old West steakhouse at the right with a giant green dinosaur in a cowboy hat standing on it" },
  { id: "landmark-p2d10", ref: "public/assets/part2/day10-pie-painted-lines-neon-camels.webp", part: 2, car: true, scene: "sunset on the road into Tucumcari: a castle-like brick building with battlements at the left, a small cafe, a Route 66 shield painted on the road, a desert road winding past mesas, a long 'TUCUMCARI' wall mural, a tall neon motel sign topped by a camel and rider, a glowing teepee-shaped curio shop at the right" },
  { id: "landmark-p2d11", ref: "public/assets/part2/day11-spaceships-neon-old-town.webp", part: 2, car: true, scene: "Albuquerque in late afternoon: a neon cafe sign with a star at the left, a white flying-saucer-shaped house on legs, the Sandia mountains behind, a white adobe church with two bell towers ahead, adobe walls of Old Town at the right" },
];

// One picture per paragraph that describes a place or moment. Paragraphs about pure
// driving use the animated travel scene instead, and route overviews use the map.
export const SCENES = {
  "p1d1-1": { car: false, scene: "a white passenger jet taking off from San Jose airport at dusk under an overcast sky, city lights and hills beyond" },
  "p1d1-2": { car: false, scene: "an airport security checkpoint: a queue of small travelers, plastic bins on a conveyor, a departures board, and a snack kiosk with a single very expensive bottle of water displayed like a treasure" },
  "p1d1-3": { car: false, scene: "a small waterfront inn at Marina del Rey on an overcast evening: palm trees, sailboats and docks, lit windows, a plane descending toward LAX in the distance" },
  "p1d1-4": { car: false, scene: "a fast-food dinner on a tray in a hotel room: burgers in wrappers, a big carton of fries, a soda cup, a window with a marina at night (no logos)" },

  "p1d2-2": { car: true, scene: "the Santa Monica pier with its ferris wheel and roller coaster, and a small 'END OF THE TRAIL' Route 66 sign on a post by the railing, two small travelers taking a photo" },
  "p1d2-3": { car: true, scene: "a sunny Pasadena street with a smoothie cup in the foreground, then a vintage 1950s walk-up burger stand museum with retro neon and a tall roadside sign (no logos)" },
  "p1d2-4": { car: true, scene: "a small Route 66 museum in an old desert-town storefront in Victorville with vintage signs out front, and a basket of chicken fingers with dipping sauce and fries in the foreground" },

  "p1d3-2": { car: true, scene: "the Barstow Harvey House: a long Spanish-style railroad depot with arches and towers, train tracks in front, desert hills behind" },
  "p1d3-3": { car: true, scene: "Elmer's Bottle Tree Ranch in Oro Grande: a forest of metal poles with branches holding colorful glass bottles, odd roadside objects, desert and power lines" },
  "p1d3-4": { car: true, scene: "the tall Roy's Motel & Cafe neon sign (a boomerang-shaped sign on a pole) on an empty desert highway at Amboy, a small cafe building, a volcanic cinder cone behind" },
  "p1d3-5": { car: true, scene: "a lonely desert gas station at dusk near Needles with a single pump and a high price sign, the car filling up, the Colorado River valley and jagged mountains behind" },
  "p1d3-6": { car: false, scene: "a pizza on a table in a small-town pizza parlor at night, a window showing the desert town of Needles with palm trees and a river" },

  "p1d4-1": { car: true, scene: "a 'WELCOME TO CALIFORNIA' state line sign beside the highway at the Colorado River bridge in light rain, the car pulled over on the shoulder, mountains behind" },
  "p1d4-2": { car: false, scene: "old west Oatman, Arizona: weathered wooden storefronts with porches and wooden boardwalk sidewalks along a steep main street, rocky mountains behind, light rain" },
  "p1d4-3": { car: true, scene: "wild burros standing in the middle of Oatman's main street blocking traffic, the car stopped and waiting, wooden storefronts on both sides, rain" },
  "p1d4-4": { car: true, scene: "a 1950s-style Route 66 diner at night in Kingman with bright neon, a big rounded sign and pink-and-turquoise trim, the car parked in front in the rain, a forgotten takeout salad box on a table visible through the window" },

  "p1d5-1": { car: false, scene: "a hotel breakfast table by a snowy window: a golden waffle, a cup of hot coffee, scrambled eggs, a snowy parking lot outside in Kingman" },
  "p1d5-2": { car: true, scene: "the Kingman Powerhouse: a big old concrete power plant building that houses a Route 66 museum, a steam locomotive on display nearby, and a small historic stone house, desert mountains behind" },
  "p1d5-3": { car: true, scene: "the Hackberry General Store on old Route 66 in light snow: a rustic wooden store covered in vintage signs, an old gas pump, a classic red car out front, desert hills" },
  "p1d5-4": { car: true, scene: "the ruins of the old Truxton Canyon Training School in Valentine, Arizona: abandoned stone and brick buildings among trees in light snow beside the highway" },

  "p1d6-1": { car: true, scene: "Interstate 40 in steady snow under gray skies: a cautious line of semi trucks and SUVs, snow-dusted pine trees, an overpass ahead" },
  "p1d6-2": { car: false, scene: "the Riordan Mansion in Flagstaff in the snow: a big rustic log-and-volcanic-stone house among tall pines, small figures bundled up in coats walking in the snow" },
  "p1d6-3": { car: false, scene: "two pizza boxes open on a table next to a frosty window, snow falling outside on pine trees in Flagstaff" },
  "p1d6-4": { car: false, scene: "a warm cozy lodge restaurant interior at night with a stone fireplace, warm lights, and snow falling on the dark window" },

  "p1d7-2": { car: false, scene: "Standin' on the Corner Park in Winslow, Arizona: a bronze statue of a man with a guitar standing on a street corner under a lamppost, a painted two-story mural wall with a reflected flatbed truck, clear blue sky" },
  "p1d7-3": { car: false, scene: "La Posada Hotel in Winslow: a grand Spanish-hacienda style hotel with arches, tiled roofs, a garden with benches and trees, and a long historic hallway glimpsed through an archway" },

  "p1d8-2": { car: true, scene: "the Wigwam Motel in Holbrook: a semicircle of tall white concrete teepee rooms with red trim, vintage cars parked beside them, light snow on the desert" },
  "p1d8-3": { car: true, scene: "a bright modern gas station glowing at dusk on a lonely highway near Gallup, the car at a pump, red rock mesas and light snow" },
  "p1d8-4": { car: false, scene: "a hand holding a cup of thick ice cream upside down over a counter at a roadside ice cream stand inside a gas station, the ice cream not falling out" },
  "p1d8-5": { car: true, scene: "Hotel Santa Fe: a warm pueblo-style adobe hotel at dusk in light snow, glowing windows, wooden vigas, the car parked in front" },

  "p1d9-1": { car: false, scene: "the Santa Fe plaza on a sunny winter day: an adobe palace with a long portal, a gazebo, bare trees, small walkers with snacks" },
  "p1d9-2": { car: false, scene: "a downtown Santa Fe street of adobe shops with turquoise doors and window displays, small people-watching figures, blue sky" },
  "p1d9-3": { car: false, scene: "the miraculous spiral staircase inside Loretto Chapel: a graceful wooden helix staircase with two full turns and no central support, stained-glass windows, a gothic chapel interior" },
  "p1d9-4": { car: false, scene: "a New Mexican lunch on a table: red chile enchiladas and a bowl of green chile stew with a tortilla, in a historic adobe restaurant with a low wooden ceiling" },
  "p1d9-5": { car: false, scene: "San Miguel Chapel, a simple old adobe mission church, and Canyon Road beyond it with adobe art galleries, sculptures in gardens, and bare trees" },
  "p1d9-6": { car: false, scene: "happy hour on an adobe hotel patio at sunset in Santa Fe: two drinks on a small table, glowing kiva fireplace, mountains turning pink" },

  "p1d10-1": { car: false, scene: "a hotel breakfast spread: pastries, fruit, eggs, and coffee on a buffet in a warm adobe dining room with morning light" },
  "p1d10-2": { car: false, scene: "a cup of good coffee and a clean breakfast plate by a sunny adobe window, a satisfied morning mood" },
  "p1d10-3": { car: false, scene: "the Museum of International Folk Art: a gallery room filled with colorful miniature folk-art villages, dolls, masks, and toys in glass cases" },
  "p1d10-4": { car: true, scene: "a cool small coffee shop on Guadalupe Street in Santa Fe: an adobe building with a patio and a big coffee cup on the table, the car parked outside ready to leave" },
  "p1d10-5": { car: true, scene: "the Albuquerque International Sunport: a pueblo-style airport terminal with a jet taking off overhead, the car returned in a rental lot, Sandia mountains behind" },

  "p2d1-1": { car: false, scene: "night at an airport: a covered pioneer wagon parked humorously next to a modern passenger jet at the gate, runway lights, the San Francisco skyline in the distance" },
  "p2d1-2": { car: false, scene: "an airport gate area at night: travelers staring up at a departure screen that has not changed, rows of seats, carry-on bags, a big window with a jet outside" },
  "p2d1-3": { car: false, scene: "inside an airplane cabin at night: rows of economy seats, dim reading lights, a tired traveler in a window seat, the moonlit wing outside" },
  "p2d1-4": { car: false, scene: "an airport boarding gate: a gate agent handing a lucky traveler an upgrade while a long line of other travelers marches down the jet bridge toward the back of the plane" },

  "p2d2-1": { car: true, scene: "dawn at O'Hare airport: a rental car lot with rows of cars under lights, the Elantra being picked up, a plane landing overhead, the Chicago skyline far away" },
  "p2d2-2": { car: false, scene: "Lou Mitchell's, a classic 1920s Chicago diner: long counter with stools, booths, coffee cups, a waitress with a coffee pot, early morning light" },
  "p2d2-3": { car: true, scene: "a brown 'BEGIN Route 66' sign on a downtown Chicago street, then a small Route 66 welcome center building in Joliet with a vintage car out front, and the castle-like limestone walls and towers of the old Joliet prison" },
  "p2d2-4": { car: true, scene: "the Gemini Giant in Wilmington: a tall green fiberglass astronaut statue in a silver helmet holding a rocket, beside an American flag and a small drive-in, prairie sky" },
  "p2d2-5": { car: true, scene: "the restored Odell Standard Oil gas station: a small white 1930s cottage-style station with a red-and-white roof and vintage pumps, then a small-town Illinois street with murals at dusk" },

  "p2d3-1": { car: true, scene: "the car at an air pump at a small-town gas station at dawn, one tire a little flat, an air hose connected, a tire pressure gauge" },
  "p2d3-2": { car: false, scene: "downtown Pontiac, Illinois: brick buildings covered in big painted murals of vintage cars and Route 66 scenes, the Route 66 Hall of Fame museum storefront" },
  "p2d3-3": { car: false, scene: "a narrow suspension footbridge over the Vermilion River in Pontiac with small walkers on its swaying wooden deck, trees along the riverbanks" },
  "p2d3-4": { car: true, scene: "the Atlanta, Illinois Paul Bunyan statue: a giant fiberglass man holding a giant hot dog, standing on a small-town street with a clock tower, sunny" },
  "p2d3-5": { car: false, scene: "a hotel lobby in the evening with an empty buffet table and a clock showing just past 5:30, lights of Springfield outside the window" },

  "p2d4-1": { car: false, scene: "the Lincoln Home in Springfield: a two-story tan Greek Revival wooden house with green shutters and a picket fence on a brick street, sunny morning" },
  "p2d4-3": { car: false, scene: "a big museum exhibition of Route 66 memorabilia: a small vintage car, colored glass dishes, old coffee makers, phonographs, road signs, and a tall gas pump in a crowded gallery" },
  "p2d4-4": { car: true, scene: "the Cozy Dog Drive-In in Springfield: a small 1950s drive-in with corn dogs on sticks, and a giant tire-man statue holding an American flag nearby" },
  "p2d4-5": { car: true, scene: "late afternoon on the highway heading south into St. Louis: the Gateway Arch rising ahead over the Mississippi River and the downtown skyline" },

  "p2d5-1": { car: false, scene: "the tall stainless-steel Gateway Arch in St. Louis seen from its green grounds, and in the foreground a tiny retro egg-shaped tram capsule with five seats and a small curved door, a small traveler folded inside" },
  "p2d5-2": { car: false, scene: "City Museum in St. Louis: an old brick shoe-factory building swallowed by a climbable jungle of welded steel tunnels and spiral slinky coils, an old airplane fuselage and a school bus hanging off the roof edge, a roof-top Ferris wheel, tiny climbers" },
  "p2d5-3": { car: false, scene: "two big deli sandwiches and a hot dog on a lunch table by a window, outside an empty downtown St. Louis street between tall office towers with not a single person walking" },
  "p2d5-4": { car: false, scene: "the old Chain of Rocks Bridge: a long steel truss bridge that bends sharply in the middle over the wide Mississippi River, two small castle-like water-intake towers standing in the river, and a vintage '66 AUTO COURT' vacancy sign on a pole by the bridge approach" },
  "p2d5-5": { car: true, scene: "a giant catsup-bottle-shaped water tower on tall steel legs beside a brick building, and a small white frozen-custard stand with a peaked roof and walk-up windows, a cup of very thick custard held upside down" },
  "p2d5-6": { car: false, scene: "St. Louis Union Station at night: a grand stone train station with a clock tower beside an enormous lit train shed with a half-open roof, a Ferris wheel and carnival game booths under the shed, warm lights" },

  "p2d6-1": { car: true, scene: "a hot, humid Missouri Ozarks highway with green rolling hills and hazy sky, a blazing sun, and a giant cartoon caveman painted on a roadside billboard" },
  "p2d6-2": { car: true, scene: "downtown Cuba, Missouri: old brick buildings along a small-town street covered with big painted history murals (a vintage car, soldiers, an old train, people of the past)" },
  "p2d6-3": { car: true, scene: "a giant red wooden rocking chair taller than a building beside a small roadside outpost store, tiny travelers standing beneath it, blue summer sky" },
  "p2d6-4": { car: true, scene: "a classic Route 66 motor-court motel among the green wooded hills of the Missouri Ozarks, with a tall red neon sign on a pole, and in front a wooden signpost bristling with arrow signs pointing in every direction; leafy trees and green lawns, no desert, no cactus, no mesas" },
  "p2d6-5": { car: true, scene: "an enormous modern travel center with rows and rows of gas pumps at dusk, and in the foreground a big three-meat sandwich, a bag of candied cashews, a bag of puffed corn snacks, and a shelf of Halloween decorations" },
  "p2d6-6": { car: true, scene: "a 1938 motor court at evening: small stone cottages with red roofs arranged around a parking courtyard, a vintage neon sign on a pole, the car parked right at a cottage door" },

  "p2d7-1": { car: false, scene: "a small white country chapel with a steeple among trees, and inside it a huge wall-and-ceiling mural of a cheerful cloudy heaven crowded with very chubby cartoon angels with big teardrop eyes, a few small visitors looking up" },
  "p2d7-2": { car: false, scene: "Red Oak II, a rebuilt little ghost-town village: old wooden and brick storefronts, a green Victorian farmhouse, a red Birney streetcar on a short track, a small crop-duster airplane on a pole, and a tall vintage gasoline pump with a glass measuring cylinder on top" },
  "p2d7-3": { car: false, scene: "a hotel lobby buffet in the evening covered in beige food (chicken tenders, fries, mac and cheese, potatoes), a fresh stack of photo prints beside the plates, and a notepad with a hand-drawn bell curve" },

  "p2d8-1": { car: false, scene: "Ed Galloway's Totem Pole Park in Oklahoma: an enormous tall concrete totem pole painted with bright faces, birds, and creatures, and a small eleven-sided stone fiddle house beside it among trees" },
  "p2d8-2": { car: true, scene: "the Blue Whale of Catoosa: a big smiling blue whale sculpture stretched across a quiet green pond, with old wooden diving platforms and a slide, trees around the water" },
  "p2d8-3": { car: true, scene: "the Arcadia Round Barn: a tall red circular wooden barn with a domed shingled roof and a small cupola beside the highway, and a cutaway glimpse of its curved wooden loft inside" },
  "p2d8-4": { car: true, scene: "a giant sixty-six-foot soda-bottle sculpture made of steel rings beside a modern glass-walled roadside store at dusk, and inside shelves packed with hundreds of colorful soda bottles" },
  "p2d8-5": { car: false, scene: "inside a restored grand 1930s bank lobby in Oklahoma City: tall art-deco columns, big painted murals on the walls, and a gigantic round steel bank-vault door standing open" },

  "p2d9-1": { car: false, scene: "inside a Route 66 museum: a crowded gallery of roadside history with an oil smudge-pot orchard heater, a vintage gas pump with a glass cylinder on top, a glowing jukebox with bubble tubes, a little diner counter, and an old hitchhiker sign" },
  "p2d9-2": { car: true, scene: "a tiny Tudor-cottage-style 1920s gas station with a steep gable roof, a chimney, and two vintage gas pumps, standing alone beside the old road in a small Texas town" },
  "p2d9-3": { car: true, scene: "the flat, open Texas Panhandle High Plains under an enormous bright sky: a windmill, grazing cattle, wind bending the grass, and tall pickup trucks with brush guards on the straight road" },
  "p2d9-4": { car: true, scene: "The Big Texan Steak Ranch in Amarillo: a bright yellow Old West false-front building with a big cowboy sign, a giant green dinosaur statue wearing a cowboy hat outside, and a huge steak on a plate in the foreground" },

  "p2d10-1": { car: false, scene: "a castle-like old brick building on an Amarillo street, with battlements along the roofline and a big arched entrance, sunny morning" },
  "p2d10-2": { car: true, scene: "a small roadside cafe in Adrian, Texas, a slice of homemade pie on a plate in the foreground, and a big painted Route 66 shield with the word 'MIDPOINT' on the road beside a small sign post" },
  "p2d10-3": { car: true, scene: "a long wall mural reading 'TUCUMCARI' painted with a train, a schoolhouse, a cowboy, wildlife, oil derricks, wind turbines, and an old car, desert mesa behind" },
  "p2d10-4": { car: true, scene: "a roadside Mexican restaurant building with a huge sombrero on its roof and an old-fashioned 'MEXICAN FOOD' sign, bright desert sun" },
  "p2d10-5": { car: true, scene: "an angular 1959 mid-century motel at dusk with a tall neon sign of a camel and its rider, the neon buzzing with bright glow" },
  "p2d10-6": { car: true, scene: "a small old motor court at night with a glowing neon sign of a swallow bird, a row of little garages beside each room, and the old highway running directly past the rooms" },
  "p2d10-7": { car: true, scene: "a glowing roadside curio shop at night whose entrance is a giant teepee shape with geometric patterns, the shop window full of souvenirs" },
  "p2d10-8": { car: true, scene: "a roadside Chinese restaurant at dusk with a big sign reading 'GOLDEN DRAGON' and a curling dragon on the sign, desert sky" },
  "p2d10-9": { car: true, scene: "a roadside restaurant sign at sunset with a large cow statue standing on top of the sign and the words 'SINCE 1956'" },
  "p2d10-10": { car: true, scene: "a weathered old motel sign at evening with palm-tree graphics and crooked marquee letters reading '$29.9' and 'WIFI', a faded motor court behind it under a big desert sky" },

  "p2d11-1": { car: true, scene: "a white flying-saucer-shaped Futuro house raised on legs beside an ordinary suburban Albuquerque street, with a clear blue-tinted glass column beneath the pod, desert trees" },
  "p2d11-2": { car: true, scene: "Central Avenue in Albuquerque's Nob Hill: mid-century storefronts with bright neon signs along the old Route 66, a Route 66 shield, sunny sky, the Sandia mountains behind" },
  "p2d11-3": { car: false, scene: "a light lunch on a cafe table: a turkey sandwich, shrimp tacos, and a cold drink, and through the window a bright neon cafe sign with a star on Central Avenue" },
  "p2d11-4": { car: false, scene: "Old Town Plaza in Albuquerque: a white gazebo bandstand under big shade trees, adobe buildings with wooden portals around the square, a few strolling visitors" },
  "p2d11-5": { car: false, scene: "San Felipe de Neri Church: a white adobe church with two tall bell towers beside Old Town Plaza, calm evening light and a few trees" },
};

export function landmarkPrompt(job) {
  return [
    "Use case: style-transfer",
    "Asset type: landmark picture for a retro Apple II travel-diary screen",
    "Input images: Image 1 is a reference for composition and landmarks only, not for rendering style, colors, or detail density.",
    `Primary request: redraw this scene as an authentic 1985 Apple II hi-res landmark picture: ${job.scene}.`,
    job.car ? `Subject: the road-trip car must be ${CARS[job.part]}.` : "Subject: no car in this scene.",
    STYLE,
    FRAME,
    CONSTRAINTS,
    job.avoid ? `Avoid: ${job.avoid}.` : "",
  ].filter(Boolean).join("\n");
}

export function scenePrompt(id) {
  const { scene, car } = SCENES[id];
  const part = Number(id[1]);
  return [
    "Use case: illustration-story",
    "Asset type: picture for a retro Apple II travel-diary screen",
    `Primary request: ${scene}.`,
    car ? `If a road-trip car appears it must be ${CARS[part]}.` : "No road-trip car in this scene.",
    STYLE,
    BAND,
    CONSTRAINTS,
  ].join("\n");
}
