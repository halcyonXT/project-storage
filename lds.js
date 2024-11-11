/**
 *                                        Flintlock  dueling
 *                                         A mod by Nanoray
 * 
 *                                  Contact on Discord - h.alcyon
 */

const _ALLOW_LEGACY_TURN = true;

const SDL_CONFIG = {
    TRACKER_TICK_RATE: 2, // how long tick should wait before re-checking stats of ships for hitrate tracking
    shouldTrackStats: true, // hit/miss rate etc.

    runBeforeInit: [],
    hideBeforeInit: ["requestChange", "readyCount", "duelerReady", "asLegacy", "flIntermission", "okButton", "borderOuter"],
    hideBeforeDuelerSwitch: ["requestChange", "readyCount", "duelerReady", "asLegacy", "flIntermission", "okButton", "borderOuter"]
}

let staticMemory = {
    // * If your mod is still laggy, use setTickThrottle and set this to a higher number
    // * Alternatively, stop the mod and set a higher number here
    // * Explanation: 
    // - How much time is added to tick loop job delay per player. E.g., if this variable is 2 and there are 3 players, the delay will be 6 ticks (2 * 3)
    // - MUST be an integer, never set it to a decimal number
    TICK_THROTTLE_PER_PLAYER: 1, 

    // ! IF YOU WANT TO COMPLETELY DISABLE TICK THROTTLE, SET THIS TO TRUE
    DISABLE_TICK_THROTTLE: true,

    MAX_PLAYER_COUNT: 10, // * Do not change for SDL version - Maximum number of player allowed on dueling host

    alwaysPickUpGems: true, // * Changeable - example: If you have 720 gems as a-speedster it will go down to 719

    // * Since low ELO players gain more from winning against high elo players, and vice versa -
    // * This variable determines the maximum ELO one can gain/lose from a single battle 
    MAX_WIN_LOSS_THRESHOLD: 75,

    // * K factor based in which ELO is calculated. Recommended not to change
    ELO_K_FACTOR: 64,

    
    // ! Experimental mode
    // * Mode description:
    // *             - Other player stats will be invisible (how much shield/gems they have remaining) during duel
    // *             - Dropped gems will be invisible
    // *             - Lasers fired will be invisible
    _ultraDarkMode: false, 

    // * If you want players to ONLY be able to select a certain ship, set this to that ships code
    // * e.g. if you want players to only use a-speedster, set it to 605
    requireShip: null, 

    // * Defined in number of ticks
    // * Throttles the amount of times an individual player can call `ui_component_clicked` (therefore less lag)
    // ! To disable rate limiting, replace this number with 0
    _CLICK_RATE_LIMIT: 25,

    afkChecker: {
        // * True = will check for AFK people
        active: false,

        // * Change the first number to reflect how many seconds until a player is pronounced AFK
        delay: 20 * 60 
    },

    bruteforceBan_minimumSimilarity: 75, // * FOR EXPERIENCED USERS ONLY - How similar a name needs to be to be affected by bruteforceBan, in percents (e.g. 75 === 75%)

    _GLOBAL_ERROR_HANDLER: true, // * If you want every error to appear in the terminal, set this to true



    // ! BELOW ARE PROPERTIES THAT YOU SHOULD NOT CHANGE
    retractableComponentIDs: ["mainControlsBackground"],
    layout: ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')],
    layoutString: 'qwertyuiopasdfghjklzxcvbnm',

    GEM_CAPS: {
        1: 20,
        2: 80,
        3: 180,
        4: 320,
        5: 500,
        6: 720,
        7: 980
    },

    font: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
    //font: "Λ𝖡𝖢𝖣Ξ𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
    fontTable: {},
}

;(() => {
    let comp = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", ctr = 0;
    // has to be done this way because some special fonts count each character as 2 characters
    for (let i of staticMemory.font) {
        staticMemory.fontTable[comp[ctr]] = i;
        ctr++;
    }
})();

const generateRandomHex = (limit = 30000000) => (~~(Math.random() * limit)).toString(16);

let _fontSubstitutionMemo = new Map();
let fontSubsitution = function(string) {
    if (!string || string.length === 0 || typeof string !== "string") return;
    let outp = "";

    let item = _fontSubstitutionMemo.get(string);
    if (item) {
        return item;
    }
    
    for (let j of string) {
        let elem = staticMemory.fontTable[j];

        if (elem) {
            outp += elem;
        } else outp += j;
    }

    _fontSubstitutionMemo.set(string, outp);
    return outp;
}

staticMemory.TICK_THROTTLE_PER_PLAYER = Math.round(staticMemory.TICK_THROTTLE_PER_PLAYER);


// ! SHOULD NOT BE CHANGED
let sessionMemory = {
    duelers: [],
    allDuels: [],
    duelerStatus: {
        ship: staticMemory.requireShip ?? 605,
        speedsterType: "new"
    },

    rememberedIDs: [],
    admins: [],
    banned: [],
    bruteforceBanned: [],
    forceIdle: []
}

const SHIPS = {
    "vanilla": {
        101: { name: "Fly", code: `` },
        191: {
            name: "Spectating",
            code: '{"name":"Spectator","level":1.9,"model":1,"size":0.025,"zoom":0.075,"specs":{"shield":{"capacity":[1e-30,1e-30],"reload":[1000,1000]},"generator":{"capacity":[1e-30,1e-30],"reload":[1,1]},"ship":{"mass":1,"speed":[200,200],"rotation":[1000,1000],"acceleration":[1000,1000]}},"bodies":{"face":{"section_segments":100,"angle":0,"offset":{"x":0,"y":0,"z":0},"position":{"x":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"y":[-2,-2,2,2],"z":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"width":[0,1,1,0],"height":[0,1,1,0],"vertical":true,"texture":[6]}},"typespec":{"name":"Spectator","level":1,"model":1,"code":101,"specs":{"shield":{"capacity":[1e-30,1e-30],"reload":[1000,1000]},"generator":{"capacity":[1e-30,1e-30],"reload":[1,1]},"ship":{"mass":1,"speed":[200,200],"rotation":[1000,1000],"acceleration":[1000,1000]}},"shape":[0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001],"lasers":[],"radius":0.001}}'
        },
        201: { name: "Delta-Fighter", code: `` },
        202: { name: "Trident", code: `` },
        301: { name: "Pulse-Fighter", code: `` },
        302: { name: "Side-Fighter", code: `` },
        303: { name: "Shadow X-1", code: `` },
        304: { name: "Y-Defender", code: `` },
        401: { name: "Vanguard", code: `` },
        402: { name: "Mercury", code: `` },
        403: { name: "X-Warior", code: `` },
        404: { name: "Side-interceptor", code: `` },
        405: { name: "Pioneer", code: `` },
        406: { name: "Crusader", code: `` },
        501: { name: "U-Sniper", code: `` },
        502: { name: "FuryStar", code: `` },
        503: { name: "T-Warrior", code: `` },
        504: { name: "Aetos", code: `` },
        505: { name: "Shadow X-2", code: `` },
        506: { name: "Howler", code: `` },
        507: { name: "Bat-Defender", code: `` },
        601: { name: "Advanced-Fighter", code: `` },
        602: { name: "Scorpion", code: `` },
        603: { name: "Marauder", code: `` },
        604: { name: "Condor", code: `` },
        605: { name: "A-Speedster", code: `` },
        606: {name: "Rock-Tower", code: ``},
        607: {
            name: "O-Defender",
            code: '{"name":"O-Defender","level":6,"model":7,"size":2.2,"specs":{"shield":{"capacity":[400,550],"reload":[10,13]},"generator":{"capacity":[70,100],"reload":[25,40]},"ship":{"mass":500,"speed":[70,80],"rotation":[30,40],"acceleration":[60,80]}},"bodies":{"main":{"section_segments":8,"offset":{"x":0,"y":0,"z":0},"position":{"x":[0,0,0,0,0],"y":[-90,-88,0,90,91],"z":[0,0,0,0,0]},"width":[5,6,25,10,20],"height":[2,10,40,20,20],"texture":[63,1,10],"propeller":true,"laser":{"damage":[35,60],"rate":2,"type":2,"speed":[130,180],"number":1,"angle":0,"error":0}},"side":{"section_segments":10,"offset":{"x":50,"y":0,"z":0},"position":{"x":[-40,-5,15,25,20,0,-50],"y":[-100,-70,-40,-10,20,50,90],"z":[0,0,0,0,0,0,0]},"width":[5,20,20,20,20,20,5],"height":[15,25,30,30,30,25,0],"texture":[0,1,2,3,4,63]},"cockpit":{"section_segments":8,"offset":{"x":0,"y":-60,"z":18},"position":{"x":[0,0,0,0,0,0,0],"y":[-10,0,20,30,40],"z":[0,0,0,0,0]},"width":[0,5,10,10,0],"height":[0,5,10,12,0],"texture":[9]},"top_propulsor":{"section_segments":15,"offset":{"x":0,"y":0,"z":10},"position":{"x":[0,0,0,0],"y":[80,95,100,90],"z":[0,0,0,0]},"width":[5,20,10,0],"height":[5,15,5,0],"propeller":true,"texture":[1,63,12]},"bottom_propulsor":{"section_segments":15,"offset":{"x":0,"y":0,"z":-10},"position":{"x":[0,0,0,0],"y":[80,95,100,90],"z":[0,0,0,0]},"width":[5,20,10,0],"height":[5,15,5,0],"propeller":true,"texture":[1,63,12]}},"wings":{"join":{"offset":{"x":0,"y":20,"z":0},"length":[80,0],"width":[130,50],"angle":[-1],"position":[0,-30],"texture":[8],"bump":{"position":-20,"size":15}}},"typespec":{"name":"O-Defender","level":6,"model":8,"code":608,"specs":{"shield":{"capacity":[400,550],"reload":[10,13]},"generator":{"capacity":[70,100],"reload":[25,40]},"ship":{"mass":500,"speed":[70,80],"rotation":[30,40],"acceleration":[60,80]}},"shape":[4.409,4.448,4.372,4.204,4.119,4.136,4.174,4.107,4.066,4.094,4.073,4.141,4.16,4.062,4.015,3.966,3.83,3.76,3.742,3.591,3.502,3.494,3.575,4.291,4.422,4.409,4.422,4.291,3.575,3.494,3.502,3.591,3.742,3.76,3.83,3.966,4.015,4.062,4.16,4.141,4.073,4.094,4.066,4.107,4.174,4.136,4.119,4.204,4.372,4.448],"lasers":[{"x":0,"y":-3.96,"z":0,"angle":0,"damage":[35,60],"rate":2,"type":2,"speed":[130,180],"number":1,"spread":0,"error":0,"recoil":0}],"radius":4.448}}'
        },
        609: { name: "Speedster Legacy", code: '{"name":"Speedster Legacy","level":6,"model":9,"size":1.5,"specs":{"shield":{"capacity":[200,300],"reload":[6,8]},"generator":{"capacity":[80,140],"reload":[30,45]},"ship":{"mass":175,"speed":[90,115],"rotation":[60,80],"acceleration":[90,140]}},"bodies":{"main":{"section_segments":8,"offset":{"x":0,"y":0,"z":0},"position":{"x":[0,0,0,0,0,0],"y":[-100,-95,0,0,70,65],"z":[0,0,0,0,0,0]},"width":[0,10,40,20,20,0],"height":[0,5,30,30,15,0],"texture":[6,11,5,63,12],"propeller":true,"laser":{"damage":[38,84],"rate":1,"type":2,"speed":[175,230],"recoil":50,"number":1,"error":0}},"cockpit":{"section_segments":8,"offset":{"x":0,"y":-60,"z":15},"position":{"x":[0,0,0,0,0,0,0],"y":[-20,0,20,40,50],"z":[-7,-5,0,0,0]},"width":[0,15,15,10,0],"height":[0,10,15,12,0],"texture":[4]},"side_propulsors":{"section_segments":10,"offset":{"x":50,"y":25,"z":0},"position":{"x":[0,0,0,0,0,0,0,0,0,0],"y":[-20,-15,0,10,20,25,30,40,80,70],"z":[0,0,0,0,0,0,0,0,0,0]},"width":[0,15,20,20,20,15,15,20,10,0],"height":[0,15,20,20,20,15,15,20,10,0],"propeller":true,"texture":[4,4,2,2,5,63,5,4,12]},"cannons":{"section_segments":12,"offset":{"x":30,"y":40,"z":45},"position":{"x":[0,0,0,0,0,0,0],"y":[-50,-45,-20,0,20,30,40],"z":[0,0,0,0,0,0,0]},"width":[0,5,7,10,3,5,0],"height":[0,5,7,8,3,5,0],"angle":-10,"laser":{"damage":[8,12],"rate":2,"type":1,"speed":[100,130],"number":1,"angle":-10,"error":0},"propeller":false,"texture":[6,4,10,4,63,4]}},"wings":{"join":{"offset":{"x":0,"y":0,"z":10},"length":[40,0],"width":[10,20],"angle":[-1],"position":[0,30],"texture":[63],"bump":{"position":0,"size":25}},"winglets":{"offset":{"x":0,"y":-40,"z":10},"doubleside":true,"length":[45,10],"width":[5,20,30],"angle":[50,-10],"position":[90,80,50],"texture":[4],"bump":{"position":10,"size":30}}},"typespec":{"name":"A-Speedster","level":6,"model":5,"code":605,"specs":{"shield":{"capacity":[200,300],"reload":[6,8]},"generator":{"capacity":[80,140],"reload":[30,45]},"ship":{"mass":175,"speed":[90,115],"rotation":[60,80],"acceleration":[90,140]}},"shape":[3,2.914,2.408,1.952,1.675,1.49,1.349,1.263,1.198,1.163,1.146,1.254,1.286,1.689,2.06,2.227,2.362,2.472,2.832,3.082,3.436,3.621,3.481,2.48,2.138,2.104,2.138,2.48,3.481,3.621,3.436,3.082,2.832,2.472,2.362,2.227,2.06,1.689,1.286,1.254,1.146,1.163,1.198,1.263,1.349,1.49,1.675,1.952,2.408,2.914],"lasers":[{"x":0,"y":-3,"z":0,"angle":0,"damage":[38,84],"rate":1,"type":2,"speed":[175,230],"number":1,"spread":0,"error":0,"recoil":50},{"x":1.16,"y":-0.277,"z":1.35,"angle":-10,"damage":[8,12],"rate":2,"type":1,"speed":[100,130],"number":1,"spread":-10,"error":0,"recoil":0},{"x":-1.16,"y":-0.277,"z":1.35,"angle":10,"damage":[8,12],"rate":2,"type":1,"speed":[100,130],"number":1,"spread":-10,"error":0,"recoil":0}],"radius":3.621}}' },
        701: { name: "Odyssey", code: `` },
        702: { name: "Shadow X-3", code: `` },
        703: { name: "Bastion", code: `` },
        704: { name: "Aries", code: `` },
    }
}

const SHIP_SELECTION = {
    "vanilla": {
        "tier7": [
            [701, "Odyssey"],
            [702, "Shadow X3"],
            [703, "Bastion"],
            [704, "Aries"]
        ],
        "tier6": [
            [601, "Advanced Fighter"],
            [602, "Scorpion"],
            [603, "Marauder"],
            [604, "Condor"],
            [605, "A-Speedster"],
            [606, "Rock Tower"],
            [607, "O-Defender"],
            [608, "Barracuda"]
        ],
        "tier5": [
            [501, "U-Sniper"],
            [502, "Fury-Star"],
            [503, "T-Warrior"],
            [504, "Aetos"],
            [505, "Shadow X2"],
            [506, "Howler"],
            [507, "Toscain"],
        ],
        "tier4": [
            [401, "Vanguard"],
            [402, "Mercury"],
            [403, "X-Warrior"],
            [404, "Interceptor"],
            [405, "Pioneer"],
            [406, "Crusader"],
        ],
        "tier3": [
            [301, "Pulse Fighter"],
            [302, "Side Fighter"],
            [303, "Shadow X1"],
            [304, "Y-Defender"],
        ],
        "tier2": [
            [201, "Delta Fighter"],
            [202, "Trident"],
        ],
        "tier1": [
            [101, "Fly"]
        ]
    }
}

const VOCABULARY = [
    // 1
    {text: "You", icon: "\u004e", key: "O"},
    {text: "Me", icon: "\u004f", key: "E"},
    {text: "Wait", icon: "\u0048", key: "T"},
    {text: "Yes", icon: "\u004c", key: "Y"},
    // 2
    {text: "No", icon: "\u004d", key: "N"},
    {text: "Hello", icon: "\u0045", key: "H"},
    {text: "Sorry", icon: "\u00a1", key: "S"},
    {text: "My ship", icon: "\u0061", key: "M"},
    // 3
    {text: "Attack", icon: "\u0049", key: "A"},
    {text: "Follow Me", icon: "\u0050", key: "F"},
    {text: "Good Game", icon: "\u00a3", key: "G"},
    {text: "Leave", icon: "\u00b3", key: "L"},
    // 4
    {text: "Stats", icon: "\u0078", key: "K"},
    {text: "Hmm", icon: "\u004b", key: "Q"},
    {text: "Lucky", icon: "\u2618", key: "U"},
    {text: "Ping", icon: "\u231b", key: "P"},
    // 5
    {text: "Discord", icon: "\u007b", key: "D"},
    {text: "Idiot", icon: "\u0079", key: "I"},
    {text: "Lag", icon: "\u0069", key: "J"},
    {text: "Spectate", icon: "\u0059", key: "W"}
    // Infinity
]

const VERSION = "1.1"

this.options = {
    ships: Object.values(SHIPS["vanilla"]).flatMap(a => a.code),
    map_name: "",
    max_players: staticMemory.MAX_PLAYER_COUNT,
    starting_ship: 801,
    map_size: 100,
    speed_mod: 1.2,
    max_level: 1,
    weapons_store: false,
    vocabulary: VOCABULARY,
    soundtrack: "warp_drive.mp3",
    custom_map: "",
    map_name: "Flintlock Dueling SDL",
};

if (typeof window.onerror !== "function" && staticMemory._GLOBAL_ERROR_HANDLER) {
    window.onerror = function(message, source, lineno, colno, error) {
        statusMessage("warn", "GLOBAL ERROR HANDLER:")
        statusMessage("warn", error);
        statusMessage("warn", message);
        statusMessage("warn", `col: ${colno}, line: ${lineno}`);
    };
}


let SWEAR_WORD_LIST = [];

// ! S1
const statusMessage = (status, message) => {
    return;
    try {
        let str = ""
        switch (status) {
            case "err":
            case "error":
                str = str + "[[b;#FF0000;]｢ERROR｣ "
                break
            case "suc":
            case "success":
                str = str + "[[b;#00FF00;]｢SUCCESS｣ "
                break
            case "warn":
                str = str + "[[b;#FFFF00;]｢WARN｣ "
                break
            default:
                str = str + "[[b;#007bff;]｢INFO｣ "
                break
        }
        game.modding.terminal.echo(" ");
        game.modding.terminal.echo(str + "[[;#FFFFFF;]" + message);
        game.modding.terminal.echo(" ");
    } catch (ex) {
        console.warn(ex)
    }
}

const hideAllUI = (ship, hide = true) => {
    const hideableElements = ["spectate", "regen", "teleport", "showShipTree", "asLegacy", "duelerReady"];
    if (hide) {
        ship.isUIExpanded = false;
        ship.globalChatExpanded = false;
        for (let id of [...hideableElements, ...staticMemory.retractableComponentIDs]) {
            ship.setUIComponent({ id, ...NULL_COMPONENT })
        }
    } else {
        renderSpectateRegen(ship);
    }
}

// ! ONLY RUNS ONCE
const renderSpectateRegen = (ship) => {
    if (ship.type == "605" || ship.type == "609") {
        selectedSpeedsterProcedure(ship, true);
    }

    // ship.setUIComponent({
    //     id: "hide_all_ui",
    //     position: [25, 1, 10, 3],
    //     clickable: false,
    //     shortcut: "6",
    //     visible: true,
    //     components: [
    //         {type: "text", position: [0, 0, 100, 100], align: "left", value: "[6] - Hide all UI", color: "hsla(0, 0%, 100%, 1.00)"},
    //     ]
    // })

    //ship.setUIComponent(showShipTreeComponent());
}

// const showShipTreeComponent = (replace = {}) => {
//     return {
//         id: "showShipTree",
//         position: [76, 1, 3.5, 5.5],
//         clickable: true,
//         shortcut: "4",
//         visible: true,
//         components: [
//             {type: "box", position: [0, 38, 100, 60], fill: "hsla(345, 95%, 71%, 0.25)"},
//             {type: "text", position: [0, 38, 100, 60], align: "center", value: "4", color: "hsla(345, 95%, 71%, 1.00)"},
//             {type: "box", position: [0, 0, 100, 33.5], fill: "hsla(345, 95%, 71%, 1.00)"},
//             {type: "text", position: [0, 1, 100, 31.5], align: "center", value: "𝗦𝗛𝗜𝗣𝗦", color: "hsla(0, 0%, 0%, 1.00)"},
//         ],
//         ...replace
//     }
// }

const turnToSpectator = (ship) => {
    ship.spectating = {
        value: true,
        lastShip: String(ship.type) === "191" ? ship.spectating.lastShip : String(ship.type)
    }
    ship.set({type: 191, collider: false, crystals: 0});
}


const deselectedSpeedsterProcedure = (ship) => {
    ship.setUIComponent({
        id: "asLegacy",
        ...NULL_COMPONENT
    })
}

const selectedSpeedsterProcedure = (ship, skipSet = false) => {
    //ship.custom.speedsterType = "new";

    let astRef = ship.custom.speedsterType;
    let font = astRef === "new" ? "𝗡𝗘𝗪" : "𝗟𝗘𝗚𝗔𝗖𝗬";
    let stype = astRef === "new" ? "605" : "609";

    ship.setUIComponent({
        id: "asLegacy",
        position: [76, 1, 3.5, 5.5],
        clickable: true,
        shortcut: "5",
        visible: true,
        components: [
            {type: "box", position: [0, 38, 100, 60], fill: "hsla(333, 100%, 50%, 0.25)"},
            {type: "text", position: [0, 38, 100, 60], align: "center", value: "5", color: "hsla(333, 100%, 50%, 1)"},
            {type: "box", position: [0, 0, 100, 33.5], fill: "hsla(333, 100%, 50%, 1)"},
            {type: "text", position: [0, 1, 100, 31.5], align: "center", value: font, color: "hsla(0, 0%, 0%, 1.00)"},
        ]
    })
    
    if (!skipSet) {
        ship.set({type: Number(stype), stats: 66666666, crystals: 720, shield: 99999});
    }
}

const clickLegacyButton = (ship, forceType = null) => {
    if (ship.spectating.value) return;


    ship.custom.speedsterType = ship.custom.speedsterType === "new" ? "legacy" : "new";

    let astRef = ship.custom.speedsterType;

    if (forceType) {
        if (forceType === "new" || forceType === "legacy") {
            astRef = forceType;
        } else statusMessage("info", "Wrong `forceType` in cLB. Got (" + forceType + "). Using ship type.")
    }

    let font = astRef === "new" ? "𝗡𝗘𝗪" : "𝗟𝗘𝗚𝗔𝗖𝗬";
    let stype = astRef === "new" ? "605" : "609";


    ship.setUIComponent({
        id: "asLegacy",
        position: [76, 1, 3.5, 5.5],
        clickable: true,
        shortcut: "5",
        visible: true,
        components: [
            {type: "box", position: [0, 38, 100, 60], fill: "hsla(333, 100%, 50%, 0.25)"},
            {type: "text", position: [0, 38, 100, 60], align: "center", value: "5", color: "hsla(333, 100%, 50%, 1)"},
            {type: "box", position: [0, 0, 100, 33.5], fill: "hsla(333, 100%, 50%, 1)"},
            {type: "text", position: [0, 1, 100, 31.5], align: "center", value: font, color: "hsla(0, 0%, 0%, 1.00)"},
        ]
    });

    ship.set({type: Number(stype), stats: 66666666, crystals: 720, shield: 99999});
}


const ECHO_SPAN = 105;
let echoed = false;

const NULL_COMPONENT = {
    position: [0,0,0,0],
    visible: false,
    shortcut: null,
    components: []
};

const shipByID = (id) => game.ships.find(obj => obj.id == id);

const newLine = () => game.modding.terminal.echo(" ");
const debugEcho = (msg) => 1;
const centeredEcho = (msg, color = "") => 1;
const anchoredEcho = (msgLeft, msgRight, color = "", anchor) => 1;
const commandEcho = (command, description, example, color) => 1;

;(function setCenterObject() {
    game.setObject({
        id: "centerImage",
        type: {
            id: "centerImage",
            obj: "https://starblast.data.neuronality.com/mods/objects/plane.obj",
            emissive: "https://raw.githubusercontent.com/halcyonXT/project-storage/main/expandpng.png"
        },
        position: { x: -1, y: 0, z: -15 },
        scale: { x: 95, y: 52, z: 0 },
        rotation: { x: Math.PI, y: 0, z: 0 }
    });
})();

;(function setBlackBackground() {
    if (staticMemory._ultraDarkMode) {
        game.setObject({
            id: "blackBackground",
            type: {
                id: "blackBackground",
                obj: "https://starblast.data.neuronality.com/mods/objects/plane.obj",
                emissive: "https://raw.githubusercontent.com/halcyonXT/project-storage/main/bcgr.png"
            },
            position: { x: -1, y: -10, z: -20 },
            scale: { x: 9999, y: 9999, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        });
    }
})();

logSessionMemory = () => {
    console.log(sessionMemory);
}

setAFKChecker = (value) => {
    let m = !!value;
    if (m) {
        statusMessage(
            "success",
            "AFK checker is now active"
        )
    } else {
        statusMessage(
            "error",
            "AFK checker is no longer active"
        )
    }
    staticMemory.afkChecker.active = m;
}

kick = (id, shouldReport = true) => {
    let ship = shipByID(id);
    if (!ship) {
        return statusMessage("error", "No ship with the specified ID")
    }
    if (shouldReport) {
        statusMessage("success", `${ship.name} has been kicked`);
    }
    kickPlayer(ship);
}

ban = (id) => {
    let ship = shipByID(id);
    if (!ship) {
        return statusMessage("error", "No ship with the specified ID")
    }
    sessionMemory.banned.push(ship.name);
    statusMessage("success", `${ship.name} has been banned`)
    kickPlayer(ship);
}

bannedList = () => {
    centeredEcho("Banned list:", "[[ub;#FF4f4f;]");
    anchoredEcho("Player name ", " Index", "[[b;#5FFFFF;]", "|")
    for (let player in sessionMemory.banned) {
        anchoredEcho(`${sessionMemory.banned[player]} `, ` ${player}`, "[[;#FFFFFF;]", "|")
    }
    for (let player in sessionMemory.bruteforceBanned) {
        anchoredEcho(`${sessionMemory.bruteforceBanned[player]} `, ` 99${player}`, "[[;#FF0000;]", "|")
    }
    echo("[[;#FFFFFF;]Index changes every time you unban someone. If you want to unban multiple people, it's recommended to run this function after every unban")
    newLine();
}

unban = (ind) => {
    let isBrute = false, sind = null;
    if (ind < 0 || ind >= sessionMemory.banned.length) {
        let bfind = Number((String(ind)).slice(2));
        if (!sessionMemory.bruteforceBanned[bfind]) {
            return statusMessage("error", "Invalid index provided. Do bannedList() to find out indexes.")
        }
        isBrute = true;
        sind = bfind;
    }
    if (isBrute) {
        statusMessage("success", `${sessionMemory.bruteforceBanned[sind]} is no longer bruteforce banned`);
        sessionMemory.bruteforceBanned = removeIndexFromArray(sessionMemory.bruteforceBanned, sind);
    } else {
        statusMessage("success", `${sessionMemory.banned[ind]} is no longer banned`);
        sessionMemory.banned = removeIndexFromArray(sessionMemory.banned, ind);
    }
}

bruteforceBan = (id) => {
    let ship = shipByID(id);
    if (!ship) {
        return statusMessage("error", "No ship with the specified ID")
    }
    sessionMemory.bruteforceBanned.push(ship.name);
    statusMessage("warn", `${ship.name} has been bruteforce banned. To revert this action, use the unban command`);
    let copy = {...ship};
    kickPlayer(ship);
    for (let sh of game.ships) {
        let lsim = levenshteinSimilarity(copy.name, sh.name);
        if (lsim >= staticMemory.bruteforceBan_minimumSimilarity) {
            statusMessage("warn", `${sh.name} has been kicked: Levenshtein similarity ${lsim} - Maximum ${staticMemory.bruteforceBan_minimumSimilarity}`);
            kickPlayer(sh);
        }
    }
}

resetMinBruteforceSim = (num) => {
    if (!num || typeof num !== "number" || num < 10 || num > 100) {
        return statusMessage("error", "Invalid input. Must be a number from 10 to 100");
    }
    staticMemory.bruteforceBan_minimumSimilarity = num;
    statusMessage("success", "Bruteforce ban will now require " + num + "% similarity to kick");
}

help = () => {
    newLine();
    centeredEcho("Command list:", "[[ub;#FF4f4f;]");
    commandEcho("Command", "Description", "Example usage", "[[b;#5FFFFF;]")
    centeredEcho("General", "[[u;#808080;]");
    commandEcho("help()", "Prints the list of commands", "help()", "[[;#FFFFFF;]")
    commandEcho("chelp(command)", "Extended description for a specific command", "chelp(adminList)", "[[;#FFFFFF;]");
    commandEcho("showIDs()", "Prints a list with the IDs and names of all players", "showIDs()", "[[;#FFFFFF;]")
    commandEcho("showShipIDs()", "Prints a list with the IDs and names of all ships", "showShipIDs()", "[[;#FFFFFF;]");
    commandEcho("bannedList()", "Shows a list of banned player names and INDEXES", "bannedList()", "[[;#FFFFFF;]");
    commandEcho("switchDueler(replace, insert)", "Swap a dueler for another ship", "switchDueler(1, 3)", "[[;#FFFFFF;]");
    commandEcho("copyAllDuels()", "Copies all stats of all duels to the clipboard", "copyAllDuels()", "[[;#FFFFFF;]");
    commandEcho("copyLatestDuel()", "Copies all stats of the latest duel to the clipboard", "copyLatestDuel()", "[[;#FFFFFF;]");
    newLine();
    centeredEcho("Administrative", "[[u;#808080;]");
    commandEcho("adminList()", "Prints the list of admins", "adminList()", "[[;#FFFFFF;]");
    commandEcho("forceSpec(id)", "Forces player with the specified ID to spectate", "forceSpec(4)", "[[;#FFFFFF;]");
    commandEcho("giveAdmin(id)", "Gives player with the specified ID admin privileges", "giveAdmin(4)", "[[;#FFFFFF;]");
    commandEcho("removeAdmin(id)", "Removes admin privileges from player with specified ID", "removeAdmin(4)", "[[;#FFFFFF;]");
    commandEcho("requireShip(shipID)", "Makes the selected ship mandatory for all players", "requireShip(605)", "[[;#FFFFFF;]");
    commandEcho("unrequireShip()", "Removes the required ship", "requireShip()", "[[;#FFFFFF;]");
    commandEcho("ban(id)", "Bans player with the specified ID", "ban(4)", "[[;#FFFFFF;]");
    commandEcho("unban(index)", "Unbans player with the specified INDEX", "unban(0)", "[[;#FFFFFF;]");
    commandEcho("kick(id)", "Kicks player with the specified ID", "kick(4)", "[[;#FFFFFF;]");
    commandEcho("setAFKChecker(bool)", "Set whether afk checker is active or not", "setAFKChecker(false)", "[[;#FFFFFF;]");
    commandEcho("setTickThrottle(ticks)", "Per-player impact on tick job delay", "setTickThrottle(20)", "[[;#FFFFFF;]");
    commandEcho("resetRateLimit(ticks)", "Determine how often a player can click a button", "resetRateLimit(20)", "[[;#FFFFFF;]");
    newLine();
    centeredEcho("Dangerous administrative", "[[gu;#CC0000;]");
    commandEcho("bruteforceBan(id)", "Recommended to do chelp(bruteforceBan) before using", "bruteforceBan(4)", "[[;#FFFFFF;]");
    commandEcho("resetMinBruteforceSim(num)", "Reset minimal similarity for bruteforce kick", "resetMinBruteforceSim(50)", "[[;#FFFFFF;]");
    newLine();
}

resetRateLimit = (ticks) => {
    if (typeof ticks !== "number") {
        return statusMessage("error", "Invalid argument. Must be a number");
    }
    staticMemory._CLICK_RATE_LIMIT = ticks;
    if (ticks === 0) {
        statusMessage(
            "success",
            `Players are no longer rate limited`
        )
    } else {
        statusMessage(
            "success",
            `Players will now only be able to click a button once every ${ticks} ticks, or once every ${(ticks / 60).toFixed(1)} seconds`
        )
    }
}

setTickThrottle = (ticks) => {
    if (typeof ticks !== "number") {
        return statusMessage("error", "Invalid argument. Must be a number");
    }
    let newticks = Math.max(1, Math.round(ticks));
    statusMessage(
        "success",
        "Tick throttle has been set to " + newticks
    )
    staticMemory.TICK_THROTTLE_PER_PLAYER = newticks;
    recalculateTickDelay();
}

chelp = (funct) => {
    if (typeof funct !== "function") {
        return statusMessage("error", "Invalid argument. " + String(funct) + " is not a command.")
    }
    newLine()
    switch (funct.name) {
        case "switchDueler":
            commandEcho("switchDueler(replace, insert)", "Swap a dueler for another ship", "switchDueler(1, 3)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] replace = ID of a ship that should be replaced. Works only if they are an initiated dueler");
            echo("[[;#FFFFFF;] insert = ID of a ship that should be put in place of the `replace` ship");
            newLine();
            echo("[[;#FFFFFF;] To get the IDs of the players, use `showIDs()`");
            break
        case "setAFKChecker":
            commandEcho("setAFKChecker(bool)", "Set whether afk checker is active or not", "setAFKChecker(false)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Takes an argument that is either a truthy or a falsy value.");
            echo("[[;#FFFFFF;] Setting to true might have an impact on performance");
            break
        case "forceSpec":
            commandEcho("forceSpec(id)", "Forces player with the specified ID to spectate", "forceSpec(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Player with the specified id will be turned into a spectator");
            echo("[[;#FFFFFF;] They won't be able to unspectate until you use forceSpec on them again, which will undo the action.");
            echo("[[;#FFFFFF;] To get the list of IDs for the `id` parameter, use showIDs()");
            break
        case "setTickThrottle":
            commandEcho("setTickThrottle(ticks)", "Per-player impact on tick job delay", "setTickThrottle(20)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] In FL dueling light, tick loop jobs have a delay in order to save up on performance");
            echo("[[;#FFFFFF;] That delay is defined as (PLAYER_COUNT * TICK_THROTTLE)");
            echo("[[;#FFFFFF;] Default tick throttle is 1, but using this command you can change it to any number you want to");
            echo("[[;#FFFFFF;] Any number you input will round to the nearest integer");
            break
        case "resetRateLimit":
            commandEcho("resetRateLimit(ticks)", "Determine how often a player can click a button", "resetRateLimit(20)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] The `ticks` argument will determine how long the player has to wait until they click a button again.");
            echo("[[;#FFFFFF;] For example, if set to 60, a player will only be able to click a button once per second");
            echo("[[;#FFFFFF;] This will help if trolls try to lag the mod by spamming expensive operations.");
            echo("[[;#FFFFFF;] Default is 15");
            break
        case "kick":
            commandEcho("kick(id)", "Kicks player with the specified ID", "kick(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Kicks the player with the specified ID.");
            echo("[[;#FFFFFF;] The player will be able to rejoin with the same name afterwards.");
            break
        case "bruteforceBan":
            commandEcho("bruteforceBan(id)", "Recommended to do chelp(bruteforceBan) before using", "bruteforceBan(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Recursively kicks every player and newcomer with a name similar to that of the player with the specified ID");
            echo("[[;#FFFFFF;] Similarity is calculated using the Levenshtein distance similarity algorithm. More on Levenshtein distance:");
            echo("[[ib!;#FFFFFF;] https://en.wikipedia.org/wiki/Levenshtein_distance");
            newLine();
            echo("[[;#FFFFFF;] minimumSimilarity - Minimal similarity of names required to kick a player - Default is 75%");
            echo("[[;#FFFFFF;] To reset minimumSimilarity, use resetMinBruteforceSim(num)");
            newLine();
            echo("[[;#FFFFFF;] Example of bruteforceBan functionality:");
            echo("[[;#FFFFFF;] Assume there are players 'HALO', 'ICEMAN1' and 'ICEMAN2' on a server");
            echo("[[;#FFFFFF;] Running bruteforceBan(2) on 'ICEMAN1' will give the following result:");
            echo("[[;#FFFFFF;]       - 'ICEMAN1' is kicked");
            echo("[[;#FFFFFF;]       - 'ICEMAN2' is kicked because they have a name similarity of 85.7%");
            echo("[[;#FFFFFF;]       - If someone named 'ICEMAN33' joins, the will be kicked because they have a similarity of 75%");
            newLine();
            echo("[[;#FFFFFF;] bruteforceBan can have unwanted effects, take this example:");
            echo("[[;#FFFFFF;] Assume the minimum similarity is 66%");
            echo("[[;#FFFFFF;] There is a player named 'ICEMAN' who likes to troll and multitab, and a good friend of yours named 'CINEMA'");
            echo("[[;#FFFFFF;] Assume the player list is 'HALO', 'ICEMAN1', 'ICEMAN2', 'ICEMAN33' and 'CINEMA'");
            echo("[[;#FFFFFF;] Running bruteforceBan(2) on 'ICEMAN1' will give the following result:");
            echo("[[;#FFFFFF;]       - 'ICEMAN1' is kicked");
            echo("[[;#FFFFFF;]       - 'ICEMAN2' is kicked");
            echo("[[;#FFFFFF;]       - 'ICEMAN33' is kicked");
            echo("[[;#FFFFFF;]       - Your good friend 'CINEMA' is kicked as well because they have a similarity above 66%");
            echo("[[;#FFFFFF;]       - Your good friend 'NICEMAN' joins the server, but is kicked due to having a similarity above 66%");
            newLine();
            echo("[[;#FFFFFF;] Think carefully before running this command");
            break
        case "ban":
            commandEcho("ban(id)", "Bans player with the specified ID", "ban(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Using the ID parameter gotten from showIDs(), bans the player with the specified ID.");
            echo(`[[;#FFFFFF;] For example, if you banned a player with the name of 'HALO', this is how it would go:`);
            echo("[[;#FFFFFF;]       - Kicks the player");
            echo("[[;#FFFFFF;]       - Every time someone named 'HALO' joins, they are immediately kicked");
            newLine();
            echo("[[;#FFFFFF;] Banning in starblast modding is not very effective, as they can just rejoin with a name like 'HALO1' to not be kicked");
            echo("[[;#FFFFFF;] Banning in starblast modding is not very effective, as they can just rejoin with a name like 'HALO1' to not be kicked");
            break
        case "adminList":
            commandEcho("adminList()", "Prints the list of admins", "adminList()", "[[;#FFFFFF;]");
            newLine()
            echo("[[;#FFFFFF;] Prints a list of players given admin permissions using the giveAdmin(id) command.");
            echo("[[;#FFFFFF;] All shown players are able to kick and ban other players.");
            echo("[[;#FFFFFF;] To remove admin permissions from any of these players, use removeAdmin(id).");
            break
        case "chelp":
            commandEcho("chelp(command)", "Extended description for a specific command", "chelp(adminList)", "[[;#FFFFFF;]");
            newLine()
            echo("[[;#FFFFFF;] Gives more information on the specified command than help() does.");
            break
        case "giveAdmin":
            commandEcho("giveAdmin(id)", "Gives player with the specified ID admin privileges", "giveAdmin(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Gives player with the specified ID administrator permissions.");
            echo("[[;#FFFFFF;] To ensure you've given the right player admin permissions, it will print a message saying their name.");
            newLine();
            echo("[[;#FFFFFF;] The newly added admin will have the following permissions:");
            echo("[[;#FFFFFF;]       - Kick");
            echo("[[;#FFFFFF;]       - Ban");
            newLine();
            echo("[[;#FFFFFF;] Note: Only the mod starter has the ability to perform a bruteforce ban.");
            break
        case "help":
            commandEcho("help()", "Prints the list of commands", "help()", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Provides the list and an elementary description of all current commands.");
            echo("[[;#FFFFFF;] It's recommended to use chelp() if you're confused about a command.");
            break
        case "removeAdmin":
            commandEcho("removeAdmin(id)", "Removes admin privileges from player with specified ID", "removeAdmin(4)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Removes administrator permissions from a player with the specified ID.");
            echo("[[;#FFFFFF;] To ensure you've removen the right admin, it will pring a message saying their name.");
            newLine();
            echo("[[;#FFFFFF;] The removed admin will lose the following permissions:");
            echo("[[;#FFFFFF;]       - Kick");
            echo("[[;#FFFFFF;]       - Ban");
            break
        case "requireShip":
            commandEcho("requireShip(shipID)", "Makes the selected ship mandatory for all players", "requireShip(605)", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Makes the specified ship a mandatory ship.");
            echo("[[;#FFFFFF;] If an incorrect ship has been provided, it will remain unset.");
            newLine();
            echo("[[;#FFFFFF;] After correctly running the command:");
            echo("[[;#FFFFFF;] All currently active players will turn into the specified ship.");
            echo("[[;#FFFFFF;] All spectators will turn into the specified ship upon unspectating.");
            echo("[[;#FFFFFF;] 'Select ship' modal will cease to give players the permission to change their ship");
            newLine();
            echo("[[;#FFFFFF;] To find out the ID of a certain ship, type showShipIDs()");
            echo("[[;#FFFFFF;] To counteract the requireShip command, type unrequireShip()");
            break
        case "showIDs":
            commandEcho("showIDs()", "Prints a list with the IDs and names of all players", "showIDs()", "[[;#FFFFFF;]")
            newLine();
            echo("[[;#FFFFFF;] Prints a list of players' names with their respective identification (ID) unique numbers.");
            echo("[[;#FFFFFF;] Player IDs are used in the following commands:");
            echo("[[;#FFFFFF;]       - giveAdmin(id)");
            echo("[[;#FFFFFF;]       - removeAdmin(id)");
            break
        case "showShipIDs":
            commandEcho("showShipIDs()", "Prints a list with the IDs and names of all ships", "showShipIDs()", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Prints a list of ship names with their respective identification (ID) unique numbers.");
            echo("[[;#FFFFFF;] Ship IDs are used in the following commands:");
            echo("[[;#FFFFFF;]       - requireShip(shipID)");
            break
        case "unrequireShip":
            commandEcho("unrequireShip()", "Removes the required ship", "requireShip()", "[[;#FFFFFF;]");
            newLine();
            echo("[[;#FFFFFF;] Directly counteracts requireShip - Removes the mandatory ship specified using the requireShip command.");
            echo("[[;#FFFFFF;] If there is no mandatory ship, it will remain unset.");
            newLine();
            echo("[[;#FFFFFF;] After correctly running the command:");
            echo("[[;#FFFFFF;] 'Select ship' modal will give players the permission to change their ship");
            break
        default:
            return statusMessage("if", "Unknown command or extended description hasn't been added yet")
    }
    newLine()
}

showShipIDs = () => {
    centeredEcho("Ship list:", "[[ub;#FF4f4f;]");
    anchoredEcho("Ship name ", " Ship ID", "[[b;#5FFFFF;]", "|")
    for (let key of Object.keys(SHIPS["vanilla"])) {
        anchoredEcho(`${SHIPS["vanilla"][key].name} `, ` ${key}`, "[[;#FFFFFF;]", "|")
    }
    newLine();
}

adminList = () => {
    newLine();
    centeredEcho("Admin list:", "[[ub;#FF4f4f;]");
    anchoredEcho("Player name ", " Player ID", "[[b;#5FFFFF;]", "|")
    for (let ship of sessionMemory.admins) {
        anchoredEcho(`${game.ships[fetchShip(ship)].name} `, ` ${ship}`, "[[;#FFFFFF;]", "|")
    }
    newLine();
}

requireShip = (id) => {
    let pID = Number(id);
    if (!SHIPS["vanilla"][pID]) {
        return statusMessage("error", "No ship with the ID of " + pID)
    }
    if (staticMemory.requireShip === pID) {
        return statusMessage("if", `"${SHIPS["vanilla"][pID].name}" is already the required ship`)
    }
    try {
        staticMemory.requireShip = pID;
        for (let ship of game.ships) {
            if (ship.spectating.value) {
                ship.spectating.lastShip = pID;
            } else {
                let type = String(pID);
                let level = type.charAt(0);
                ship.set({type: Number(type), stats: Number(level.repeat(8)), crystals: staticMemory.GEM_CAPS[(Number(type) / 100) >> 0], collider: true, shield: 99999});
            }
        }
        statusMessage("success", `"${SHIPS["vanilla"][pID].name}" is now the required ship`)
    } catch (ex) {
        statusMessage("error", "requireShip(...) error - More in console");
        //console.warn(ex);
    }
}

unrequireShip = () => {
    if (!staticMemory.requireShip) {
        statusMessage("if", `There is already no required ship`)
    } else {
        statusMessage("success", `"${SHIPS["vanilla"][staticMemory.requireShip].name}" is no longer the required ship`)
    }
    staticMemory.requireShip = null;
}

switchDueler = (toReplace, toInsert) => {
    // * Mega guard clause
    if (!toReplace || !toInsert || isNaN(Number(toReplace)) || isNaN(Number(toInsert)) || !sessionMemory.duelers.find(obj => obj.id == toReplace) || (shipByID(toInsert)).custom.sdlType !== "spectator") {
        return statusMessage("error", "Invalid arguments. Use `chelp(switchDueler)` for more help.");
    }

    let toReplaceShip = shipByID(toReplace);


    if (toReplaceShip) {
        for (let id of SDL_CONFIG.hideBeforeDuelerSwitch) {
            toReplaceShip.setUIComponent({id: id, ...NULL_COMPONENT});
        }
    
        toReplaceShip.set({type: 191, collider: false});
        toReplaceShip.custom._statTrack.on = false;
        toReplaceShip.custom.sdlType = "spectator";
    }
    
    toReplace = Number(toReplace);
    toInsert = Number(toInsert);
    
    sessionMemory.duelers = sessionMemory.duelers.filter(obj => obj.id != toReplace);
    
    let insertShip = shipByID(toInsert);
    insertShip.custom.sdlType = "dueler";
    initiateDueler(insertShip);
    clickLegacyButton(insertShip, sessionMemory.duelerStatus.speedsterType);

    prepareDueler(insertShip);

    statusMessage("success", "Dueler `" + toReplaceShip?.name + "` (" + toReplaceShip.id + ") has been replaced with `" + insertShip.name + "` (" + insertShip.id + ")");
    updateScoreboard();
}

if (false) {
    setTimeout(() => {
        newLine();
        newLine();
        
        centeredEcho("welcome to", "[[b;#FFFFFF;]");
        centeredEcho(" ＦＬＩＮＴＬＯＣＫ ＤＵＥＬＩＮＧ            ", "[[gb;#FF0000;]");
        centeredEcho("a mod by nanoray", "[[;#FFFFFF30;]")
        newLine();
        centeredEcho("Contact:", "[[ub;#FF4f4f;]");
        centeredEcho("Discord - h.alcyon", "[[;#FFFFFF;]");
        help()
        newLine();
        echo("[[;#FFFF00;]If it seems like a part of the instructions is cut off, zoom out")
        echo("[[;#FFFF00;]NOTE: Giving yourself admin upon mod startup using giveAdmin() is highly recommended")
        newLine();
    }, 2000)

    echoed = true;
}

showIDs = function () {
    newLine();
    centeredEcho("Player list:", "[[ub;#FF4f4f;]");
    anchoredEcho("Player name ", " Player ID", "[[b;#5FFFFF;]", "|")
    for (let ship of game.ships) {
        anchoredEcho(`${ship.name} `, ` ${ship.id}`, "[[;#FFFFFF;]", "|")
    }
    newLine();
}

forceSpec = (id) => {
    let ind = fetchShip(id);
    if (ind === -1) {
        return statusMessage("error", `No ship with the id of "${id}"`);
    }
    let ref = game.ships[ind];
    if (ref.custom.forcedToSpectate) {
        game.ships[ind].custom.forcedToSpectate = false;
        fleetingMessage(game.ships[ind], "You are no longer forced to spectate");
        statusMessage(
            "success",
            `Ship with the id of "${id}" (${ref.name}) is no longer forced to spectate`
        )
    } else {
        turnToSpectator(game.ships[ind]);
        fleetingMessage(game.ships[ind], "You have been forced to spectate");
        game.ships[ind].custom.forcedToSpectate = true;
        statusMessage(
            "success",
            `Ship with the id of "${id}" (${ref.name}) has been forced to spectate`
        )
    }
}

giveAdmin = (id) => {
    for (let ship of game.ships) {
        if (ship.id === id) {
            if (!(sessionMemory.admins.includes(id))) {
                sessionMemory.admins.push(id)
                game.ships[fetchShip(id)].isUIExpanded && renderExpandedMenu(game.ships[fetchShip(id)], "admin")
                return statusMessage("success", `Player with the id of ${id} (${game.ships[fetchShip(id)].name}) has been granted admin privileges`)
            } else {
                return statusMessage("if", `Player is already admin. Do removeAdmin(${id}) to remove`)
            }
        }
    }
    return statusMessage("error", `Player with the id of ${id} doesn't exist`)
}

removeAdmin = (id) => {
    for (let admin of sessionMemory.admins) {
        if (admin === id) {
            sessionMemory.admins = removeFromArray(sessionMemory.admins, id)
            let target = game.ships[fetchShip(id)]
            target.isUIExpanded && renderExpandedMenu(target, determineType(target))
            closeDashboard(target, game)
            return statusMessage("success", `Player with the id of ${id} (${target.name}) no longer has admin privileges`)
        }
    }
    return statusMessage("error", `There is no admin with the id of ${id}`)
}


copyAllDuels = (onlyLatest = false) => {
    try {
        const getDuelString = (stats) => { 
            let winnerName = stats?.result?.winner?.name;
            if (winnerName && winnerName.length < 6) winnerName = (winnerName.padStart(4, " ")).padEnd(6, " ");
            let loserName = stats?.result?.loser?.name;
            if (loserName && loserName.length < 6) loserName = (loserName.padStart(4, " ")).padEnd(6, " ");
            const gnl = (number) => String(number).length;
            //const gnlh = (number) => ~~(String(number).length / 2);

            let padWHR = Math.max(0, ~~((winnerName.length - gnl(stats.result.winner.hitRate)) / 2));

            let winnerSpan = winnerName.length;

            const getLeftWSP = (message) => ~~((winnerSpan - gnl(message)) / 2);
            const getRightWSP = (message) => Math.ceil((winnerSpan - gnl(message)) / 2);
    
            // ! NEVER INDENTATE THIS - String literals retain whitespace

            let duelString = `
Duel number: ${stats.number}
Duel time:   ${stats.playedOn}
Duelers:     ${winnerName}, ${loserName}
Duel winner: ${winnerName}
Duel length: ${~~(stats.time / 60)}:${String(stats.time % 60).padStart(2, "0")}
\n
             | ${winnerName.length % 2 === 0 ? winnerName : winnerName} | ${loserName}
Shots fired  | ${" ".repeat(getLeftWSP(stats.result.winner.shots))}${stats.result.winner.shots}${" ".repeat(getRightWSP(stats.result.winner.shots))} | ${" ".repeat(~~(loserName.length / 2))}${stats.result.loser.shots}
Shots landed | ${" ".repeat(getLeftWSP(stats.result.winner.hits))}${stats.result.winner.hits}${" ".repeat(getRightWSP(stats.result.winner.hits))} | ${" ".repeat(~~(loserName.length / 2))}${stats.result.loser.hits}
Hit rate     | ${" ".repeat(getLeftWSP(stats.result.winner.hitRate))}${stats.result.winner.hitRate}${" ".repeat(getRightWSP(stats.result.winner.hitRate))} | ${" ".repeat(~~(loserName.length / 2))}${stats.result.loser.hitRate}
    `
            // let spl = duelString.split("\n");
            // for (let s of spl) {
            //     console.log(s.trim());
            //     echo(s.trim());
            // }
            // echo(" \n");
            return duelString;
        }
    
        let concat = "";
    
        if (onlyLatest) {
            concat += getDuelString(sessionMemory.allDuels[sessionMemory.allDuels.length - 1])
        } else {
            for (let duel of sessionMemory.allDuels) {
                concat += getDuelString(duel);
            }
        }

        echo(concat);
    
        // ! asopdkgjfaops
        //console.log(concat);
        //navigator.clipboard.writeText(concat);
        //statusMessage("success", "Copied to the clipboard")
    } catch (ex) {
        //statusMessage("error", "An error has occured while copying. Check devtools for more info");
        //console.warn(ex);
    }

}

copyLatestDuel = () => copyAllDuels(true);



const determineType = (ship) => sessionMemory.admins.includes(ship.id) ? "admin" : "regular";

const teleportToNext = (ship, game, __CALL_STACK = 0) => {
    turnToSpectator(ship);
    let tp = ship.lastTeleported;
    if (!tp && typeof tp !== "number") {
        tp = 0;
    } else {
        tp += 1;
        if (tp >= game.ships.length) {
            tp = 0;
        } 
    }
    ship.lastTeleported = tp;
    if (game.ships[tp].id === ship.id) {
        if (__CALL_STACK < 1) {
            return teleportToNext(ship, game, __CALL_STACK + 1);
        } else {
            return fleetingMessage(ship, "Nobody to teleport to");
        }
    }
    let ref = game.ships[tp];
    ship.set({x: ref.x, y: ref.y});
}

let _scoreboard_defaults = {
    components: [
        { type: "box", position: [0, 0, 100, 8], fill: "hsla(0, 100%, 50%, 0.25)" },
        { type: "box", position: [76, 0, 11, 8], fill: "hsla(0, 100%, 50%, 1)" },
        { type: "box", position: [89, 0, 11, 8], fill: "hsla(0, 100%, 50%, 1)" },
        { type: "text", position: [2, 1, 98, 6], value: fontSubsitution("Duelers"), color: "hsla(0, 100%, 50%, 1)", align: "left" },
        { type: "text", position: [76, 0.5, 11, 7], value: fontSubsitution("K"), color: "hsla(0, 0%, 0%, 1.00)", align: "center" },
        { type: "text", position: [89, 0.5, 11, 7], value: fontSubsitution("D"), color: "hsla(0, 0%, 0%, 1.00)", align: "center" },
    ]
}

const updateScoreboard = () => {
    let sortedPlayers = [...sessionMemory.duelers, ...game.ships.filter(obj => obj.custom.sdlType !== "dueler")];
    //console.log(sortedPlayers);

    let hasPassedSpectatorsHeader = false, addedOffset = 0;

    let playerComponents = sortedPlayers.map((item, index) => {
        let Y_OFFSET = (index + 1) * 9 + addedOffset;

        let addition = [];

        let color = "hsla(0, 100%, 50%,"

        if (item.custom.sdlType === "spectator") {
            if (!hasPassedSpectatorsHeader) {
                hasPassedSpectatorsHeader = true;
                color = "hsla(152, 100%, 50%,";

                addedOffset = 9;

                addition = [
                    { type: "box", position: [0, Y_OFFSET, 100, 8], fill: "hsla(152, 100%, 50%, 0.25)" },
                    { type: "text", position: [2, Y_OFFSET + 1, 98, 6], value: fontSubsitution("Spectators"), color: "hsla(152, 100%, 50%, 1)", align: "left" },
                ]
            }
            Y_OFFSET += 9;
            return [
                ...addition,
                { type: "box", position: [0, Y_OFFSET, 100, 8], fill: color+"0.065)" },
                { type: "player", position: [2, Y_OFFSET + 1, 59, 6], id: item.id, color: "hsla(0, 100%, 100%, 1)", align: "left" },
            ]
        }
        return [
            ...addition,
            { type: "box", position: [0, Y_OFFSET, 100, 8], fill: color+"0.065)" },
            { type: "box", position: [76, Y_OFFSET, 11, 8], fill: color+"0.1)" },
            { type: "box", position: [89, Y_OFFSET, 11, 8], fill: color+"0.1)" },
            { type: "player", position: [2, Y_OFFSET + 1, 59, 6], id: item.id, color: "hsla(0, 100%, 100%, 1)", align: "left" },
            { type: "text", position: [76, Y_OFFSET + 1, 11, 6], value: item.kd.kills, color: "hsla(0, 100%, 100%, 1)", align: "center" },
            { type: "text", position: [89, Y_OFFSET + 1, 11, 6], value: item.kd.deaths, color: "hsla(0, 100%, 100%, 1)", align: "center" },
        ]
    });

    let outp = playerComponents.flat();

    game.setUIComponent({
        id: "scoreboard",
        clickable: false,
        visible: true,
        components: [
            ..._scoreboard_defaults.components,
            ...outp
        ]
    });
}

const handleEloCalculation = (killer, victim) => {
    const KILLER_TIER = (killer.type / 100) >> 0, VICTIM_TIER = (victim.type / 100) >> 0;
    victim.custom.goto = {x: victim.x, y: victim.y};

    const calculateKD = (kills, deaths) => {
        let outp = kills / deaths;
        if (outp === Infinity) {
            return kills;
        }
        return Number(outp.toFixed(1));
    }

    if (KILLER_TIER <= VICTIM_TIER) {
        victimNewElo = updateSubjectElo(victim.elo, killer.elo, false);
        killer.elo = updateSubjectElo(killer.elo, victim.elo, true);
        victim.elo = victimNewElo;
    }

    killer.kd = {
        value: calculateKD(killer.kd.kills + 1, killer.kd.deaths),
        kills: killer.kd.kills + 1,
        deaths: killer.kd.deaths
    }

    victim.kd = {
        value: calculateKD(victim.kd.kills, victim.kd.deaths + 1),
        kills: victim.kd.kills,
        deaths: victim.kd.deaths + 1
    }

    updateScoreboard();
}

const customEvent = (eventName) => {
    switch (eventName) {
        case "ship_left":
            // ! recalculateTickDelay();
            sessionMemory.duelers = sessionMemory.duelers.filter(obj => !!shipByID(obj.id));
            updateScoreboard();
            break
    }
}


const TRACK_STATS = {
    CRYSTAL_LAG_INDEX: 2,

    MINIMUM_OFFSET_FOR_DISCHARGE_RECOGNITION: 45, // leniency 25
    MINIMUM_OFFSET_FOR_IMPACT_RECOGNITION: 47, // leniency 37

    flushAndSave: function(victor, save = true) {
        for (let ship of sessionMemory.duelers) {
            ship.custom._statTrack.on = false;
        }
        let victorShip = shipByID(victor);
        let loserShip = sessionMemory.duelers.find(obj => obj.id != victor);

        if (save) {
            let whr = roundToDecimalPlace((victorShip.custom._statTrack.stats.hits / victorShip.custom._statTrack.stats.shots) * 100, 1);
            let lhr = roundToDecimalPlace((loserShip.custom._statTrack.stats.hits / loserShip.custom._statTrack.stats.shots) * 100, 1);
            sessionMemory.allDuels[sessionMemory.allDuels.length - 1] = {
                ...sessionMemory.allDuels[sessionMemory.allDuels.length - 1],
                playedOn: String(new Date()),
                number: sessionMemory.allDuels.length,
                id: generateRandomHex(),
                result: {
                    winner: {
                        name: victorShip.name,
                        shots: victorShip.custom._statTrack.stats.shots,
                        hits: victorShip.custom._statTrack.stats.hits,
                        hitRate: (isNaN(whr) ? 0 : whr) + "%",
                    },
                    loser: {
                        name: loserShip.name,
                        shots: loserShip.custom._statTrack.stats.shots,
                        hits: loserShip.custom._statTrack.stats.hits,
                        hitRate: (isNaN(lhr) ? 0 : lhr) + "%",
                    }
                }
            }
        }
    },

    generatorTracker: function(ship, value) {
        if (!ship.custom._statTrack.on) return;

        let ref = ship.custom._statTrack;
        if (value <= (ref.lastGenerator - this.MINIMUM_OFFSET_FOR_DISCHARGE_RECOGNITION)) {

            ship.custom._statTrack.stats.shots++;
            
            // ! Probably would not work, keeping it here anyway
            //let dischargeID = generateRandomHex();
            //ship.custom._statTrack.lastDischargeRegister = dischargeID;

            // * Debug
            //echo("[[;#FFFFFF;] Discharged");
            //echo(`[[;#0042FF;] Value: ${value} <= Comp: ${(ref.lastGenerator - this.MINIMUM_OFFSET_FOR_DISCHARGE_RECOGNITION)}`);
        } else {
            //echo(`[[;#FFFF00;] Value: ${value} - Comp: ${(ref.lastGenerator - this.MINIMUM_OFFSET_FOR_DISCHARGE_RECOGNITION)}`);
        }

        ship.custom._statTrack.lastGenerator = value;
    },

    shieldTracker: function(ship, value) {
        if (!ship.custom._statTrack.on) return;

        let ref = ship.custom._statTrack;

        let cumulativeDifference = 0;

        let crystalDiff = Math.max(0, (ref.lastCrystals - ship.crystals));
        cumulativeDifference += crystalDiff;

        let shieldDiff = Math.abs(value - ref.lastShield);
        cumulativeDifference += shieldDiff;

        if (cumulativeDifference >= this.MINIMUM_OFFSET_FOR_IMPACT_RECOGNITION) {
            let target = sessionMemory.duelers.find(obj => obj.id !== ship.id);
            target.custom._statTrack.stats.hits++;
            //echo("[[;#FFFFFF;] Impacted");
            //echo(`[[;#0042FF;] Value: ${cumulativeDifference.toFixed(1)} !>= Comp: ${this.MINIMUM_OFFSET_FOR_IMPACT_RECOGNITION.toFixed(1)} || SD: ${shieldDiff.toFixed(1)} || CD: ${crystalDiff.toFixed(1)}`);
        } else {
            //echo(`[[;#FFFF00;] Value: ${cumulativeDifference} !>= Comp: ${this.MINIMUM_OFFSET_FOR_IMPACT_RECOGNITION}`);
        }

        ship.custom._statTrack.lastCrystals = ship.crystals;
        ship.custom._statTrack.lastShield = value;
    },

    statCleanup: function() {
        for (let ship of sessionMemory.duelers) {
            let ref = ship.custom._statTrack;
            if (ref.stats.hits > ref.stats.shots) {
                ref.stats.hits = ref.stats.shots;
            }
        }
        return;
    }

    // crystalTracker: function(ship,value) {
    //     ship.custom._statTrack.lastCrystalBuffer.unshift(value);
    //     ship.custom._statTrack.lastCrystalBuffer.pop();
    //     ship.custom._statTrack.lastCrystals = ship.custom._statTrack.lastCrystalBuffer[this.CRYSTAL_LAG_INDEX];
    // }
}

const initiateDueler = (ship, forceIndex = null) => {
    const insertAt = forceIndex ?? sessionMemory.duelers.length;
    
    if (insertAt > 1) {
        return statusMessage("error", "Invalid `insertAt` (" + insertAt + ") in initiateDueler(...)");
    }
    
    ship.custom.isDuelerReady = false;
    ship.custom.isDueling = false;
    ship.custom._statTrack.on = false;

    // Object.defineProperty(ship, "crystals", {
    //     set(v) {
    //         TRACK_STATS.crystalTracker(ship, v);
    //     }
    // })

    sessionMemory.duelers[insertAt] = ship;
    READYING_PHASE.renderReadyForDueler(ship);
    //READYING_PHASE.initiateInvulnerability(ship);
}

const READYING_PHASE = {
    // initiateInvulnerability: function(ship) {
    //     if (ship.custom.isDueling) return;

    //     let isDueler = false;

    //     for (let dueler of sessionMemory.duelers) {
    //         if (dueler.id === ship.id) {
    //             isDueler = true;
    //             break;
    //         }
    //     }

    //     if (!isDueler) return;

    //     ship.set({invulnerable: 60});

    //     scheduleJob(1000, () => this.initiateInvulnerability(ship));
    // },

    startDuel: function () {
        for (let ship of sessionMemory.duelers) {
            ship.custom.isDueling = true;
            ship.custom._statTrack.on = SDL_CONFIG.shouldTrackStats;
            ship.custom._statTrack.lastGenerator = 140;
            ship.custom._statTrack.lastShield = 300;
            ship.custom._statTrack.lastCrystals = 719;
            ship.custom._statTrack.stats = {
                shots: 0,
                hits: 0
            }
            //ship.custom._statTrack.lastDischargeRegister = null; // * String
            // ship.custom._statTrack.lastCrystalBuffer = new Array(TRACK_STATS.CRYSTAL_LAG_INDEX).fill(719);
        }

        REQUEST_SHIP_CHANGE.started = false;
        REQUEST_SHIP_CHANGE.initiatedBy = null;

        sessionMemory.allDuels[sessionMemory.allDuels.length] = {
            active: true,
            time: 0,
            result: {}
        }
        
        const addSecondToDuelTime = () => {
            let ref = sessionMemory.allDuels[sessionMemory.allDuels.length - 1];
            ref.time += 1;
            if (ref.active) {
                scheduleJob(1000, addSecondToDuelTime);
            }
        }
        scheduleJob(1000, addSecondToDuelTime);

        const OFFSET = 225;

        const COORDS = {
            0: {x: -OFFSET / 2, y: OFFSET},
            1: {x: OFFSET / 2, y: OFFSET},
        }

        for (let i in sessionMemory.duelers) {
            let target = sessionMemory.duelers[i];
            target.set({collider: true, shield: 9999, generator: 140, crystals: 719, x: COORDS[i].x, y: COORDS[i].y, idle: false})
        }

        for (let id of SDL_CONFIG.hideBeforeInit) {
            game.setUIComponent({id: id, ...NULL_COMPONENT});
        }
    },

    refreshReadyComponent: function() {
        let readyCount = 0;

        for (let ship of sessionMemory.duelers) {
            readyCount += !!ship.custom.isDuelerReady;
        }

        if (readyCount === 2) {
            return this.startDuel();
        }

        for (let ship of sessionMemory.duelers) {

            ship.setUIComponent({
                id: "readyCount",
                position: [23.5, 3, 32, 4],
                clickable: false,
                visible: true,
                components: [
                    {type: "text", position: [44.93, -83.79, 13.2, 253.63], align: "left", value: "▰", color: "rgba(255,0,98,1)"},
                    {type: "box", position: [0, 0, 49.65, 102.77], fill: "rgba(255,0,98,1)"},
                    {type: "text", position: [2, 0, 51.2, 100], align: "left", value: fontSubsitution(`${readyCount}/${sessionMemory.duelers.length} duelers ready`), color: "rgba(0,0,0,1)"},
                ]
            })
        }
    },

    renderReadyForDueler: function (ship) {
        if (!ship.custom.isDuelerReady) {
            ship.setUIComponent({
                id: "duelerReady",
                position: [68.5, 1, 7, 5.5],
                clickable: true,
                shortcut: "1",
                visible: true,
                components: [
                    {type: "box", position: [0, 38, 100, 60], fill: "hsla(360, 39%, 50%, 0.25)"},
                    {type: "text", position: [0, 38, 100, 60], align: "center", value: "1", color: "hsla(360, 39%, 50%, 1)"},
                    {type: "box", position: [0, 0, 100, 33.5], fill: "hsla(360, 39%, 50%, 1)"},
                    {type: "text", position: [0, 1, 100, 31.5], align: "center", value: "𝗡𝗢𝗧 𝗥𝗘𝗔𝗗𝗬", color: "hsla(0, 0%, 0%, 1)"},
                ]
            })
        } else {
            ship.setUIComponent({
                id: "duelerReady",
                position: [68.5, 1, 7, 5.5],
                clickable: true,
                shortcut: "1",
                visible: true,
                components: [
                    {type: "box", position: [0, 38, 100, 60], fill: "hsla(159, 67%, 50%, 0.25)"},
                    {type: "text", position: [0, 38, 100, 60], align: "center", value: "1", color: "hsla(159, 67%, 50%, 1)"},
                    {type: "box", position: [0, 0, 100, 33.5], fill: "hsla(159, 67%, 50%, 1)"},
                    {type: "text", position: [0, 1, 100, 31.5], align: "center", value: "𝗥𝗘𝗔𝗗𝗬", color: "hsla(0, 0%, 0%, 1)"},
                ]
            })
        }

        this.refreshReadyComponent();
    }
} 
    



const REQUEST_SHIP_CHANGE = {
    started: false,
    initiatedBy: null,

    initiate: function(ship) {
        if (sessionMemory.duelers.length < 2) {
            return fleetingMessage(ship, "Wait for your opponent");
        }

        if (this.started) {
            return;
        }
        
        this.started = true;
        this.initiatedBy = ship;

        for (let target of sessionMemory.duelers) {
            if (target.id === ship.id) continue;

            target.setUIComponent({
                id: "requestChange",
                position: [23.5, 8, 41, 6.5],
                clickable: false,
                visible: true,
                components: [
                    {type: "text", position: [78.09, -40.44, 8, 125.81], align: "left", value: "▰", color: "rgba(255,0,98,1)"},
                    {type: "box", position: [0, 0, 82, 50.5], fill: "rgba(255,0,98,1)"},
                    {type: "text", position: [0.52, 2.01, 82, 48.5], align: "left", value: fontSubsitution("Your opponent is requesting speedster type switch"), color: "rgba(0,0,0,1)"},
                    {type: "text", position: [0.35, 55.34, 49, 41.5], align: "left", value: fontSubsitution("Press 5 to accept, or ignore to deny"), color: "rgba(220,220,220,1)"},
                ]
            })
        }

        fleetingMessage(ship, "Switch requested");
    },

    accept: function(acceptor) {
        if (acceptor.id == this.initiatedBy.id) {
            return fleetingMessage(acceptor, "Wait for your opponents response")
        }

        this.started = false;
        this.initiatedBy = null;

        let switchTo = sessionMemory.duelerStatus.speedsterType === "new" ? "legacy" : "new";
        sessionMemory.duelerStatus.speedsterType = switchTo;

        for (let ship of sessionMemory.duelers) {
            ship.setUIComponent({id: "requestChange", ...NULL_COMPONENT});

            clickLegacyButton(ship, switchTo);
        }
    }
}


let _lastIntermission = {};
const prepareDueler = (ship, sendToIntermission = false) => {
    if (sendToIntermission) {
        const PLACEHOLDER = {name: "VACANT"};
        // TODO - Clean this mess up
        //ship.intermission(_lastIntermission);
        let killer = shipByID(Number(_lastIntermission.dlw));
        let victim = shipByID(Number(_lastIntermission.dll));

        if (!killer) killer = {...PLACEHOLDER};
        if (!victim) victim = {...PLACEHOLDER};

        ship.set({idle: true});
        // ship.setUIComponent({
        //     id: "prepareForIntermission",
        //     position: [32, 20.5, 36, 75],
        //     clickable: false,
        //     visible: false,
        //     components: [
        //         {type: "text", position: [43.5, 29, 26.5, 2.5], align: "center", value: "some text some text", color: "#DCDCDC00"},
        //         {type: "text", position: [43.5, 29, 26.5, 2.5], align: "center", value: "lorem ipsum dolor sit amet", color: "#DCDCDC00"},
        //         {type: "player", position: [43.5, 29, 26.5, 2.5], align: "center", id: _lastIntermission.dlw, color: "#DCDCDC00"},
        //         {type: "player", position: [72, 29, 27, 2.5], align: "center",  id: _lastIntermission.dll, color: "#DCDCDC00"},
        //     ]
        // })
        ship.setUIComponent({
            id: "flIntermission",
            position: [32, 20.5, 36, 75],
            clickable: false,
            visible: true,
            components: [
                {type: "box", position: [0, 0, 100, 11], fill: "rgba(255,0,80,1)" },
                {type: "text", position: [-1.49, -0.37, 67.5, 8], align: "center", value: "𝐅𝐋𝐈𝐍𝐓𝐋𝐎𝐂𝐊", color: "rgba(0,0,0,1)"},
                {type: "text", position: [-1.49, -0.69, 67.5, 8], align: "center", value: "𝐅𝐋𝐈𝐍𝐓𝐋𝐎𝐂𝐊", color: "rgba(255,255,255,1)" },
                {type: "box", position: [9.68, 5.89, 10.5, 4.5], fill: "rgba(0,0,0,1)"},
                {type: "text", position: [9.68, 5.89, 10.5, 4.5], align: "center", value: "𝐒𝐃𝐋", color: "rgba(255,255,255,1)" },
                {type: "box", position: [60, 7.5, 40, 3.5], fill: "rgba(74,74,74,1)"},
                {type: "text", position: [60, 7.5, 40, 3.5], align: "center", value: "𝖨𝖭𝖳𝖤𝖱𝖬𝖨𝖲𝖲𝖨𝖮𝖭", color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 11, 100, 4], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [0, 11, 100, 4], align: "center", value: "𝖣𝖴𝖤𝖫 𝖱𝖤𝖲𝖴𝖫𝖳𝖲", color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 15.5, 100, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [1.5, 15.5, 97, 5.5], align: "left", value: fontSubsitution("Duel length"), color: "rgba(255,255,255,1)" },
                {type: "text", position: [1.5, 15.5, 97, 5.5], align: "right", value: _lastIntermission.dlLength, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 21.5, 100, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [1.5, 21.5, 97, 5.5], align: "left", value: fontSubsitution("Duel winner"), color: "rgba(255,255,255,1)" },
                {type: "text", position: [1.5, 21.5, 97, 5.5], align: "right", value: _lastIntermission.dlWinner, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 27.5, 42, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "box", position: [42.5, 27.5, 28, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "box", position: [71, 27.5, 29, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [43.5, 28.5, 26.5, 3.5], align: "center", value: killer.name, color: "rgba(255,255,255,1)" },
                {type: "text", position: [72, 28.5, 27, 3.5], align: "center",  value: victim.name, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 33.5, 42, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [0, 33.5, 40, 5.5], align: "right", value: fontSubsitution("Duels won"), color: "rgba(255,255,255,1)" },
                {type: "box", position: [42.5, 33.5, 28, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "box", position: [71, 33.5, 29, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [43.5, 34, 26.5, 4.5], align: "center", value: killer.kd.kills, color: "rgba(255,255,255,1)" },
                {type: "text", position: [72, 34, 27, 4.5], align: "center", value: victim.kd.kills, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 39.5, 42, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [0, 39.5, 40, 5.5], align: "right", value: fontSubsitution("Shots fired"), color: "rgba(255,255,255,1)" },
                {type: "box", position: [42.5, 39.5, 28, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "box", position: [71, 39.5, 29, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [43.5, 40, 26.5, 4.5], align: "center", value: _lastIntermission.dlwFired, color: "rgba(255,255,255,1)" },
                {type: "text", position: [72, 40, 27, 4.5], align: "center", value: _lastIntermission.dllFired, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 45.5, 42, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [0, 45.5, 40, 5.5], align: "right", value: fontSubsitution("Shots landed"), color: "rgba(255,255,255,1)" },
                {type: "box", position: [42.5, 45.5, 28, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "box", position: [71, 45.5, 29, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [43.5, 46, 26.5, 4.5], align: "center", value: _lastIntermission.dlwLanded, color: "rgba(255,255,255,1)" },
                {type: "text", position: [72, 46, 27, 4.5], align: "center", value: _lastIntermission.dllLanded, color: "rgba(255,255,255,1)" },
                {type: "box", position: [0, 51.5, 42, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [0, 51.5, 40, 5.5], align: "right", value: fontSubsitution("Hit rate"), color: "rgba(255,255,255,1)" },
                {type: "box", position: [42.5, 51.5, 28, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [43.5, 52, 26.5, 4.5], align: "center", value: _lastIntermission.dlwHitrate, color: "rgba(255,255,255,1)" },
                {type: "box", position: [71, 51.5, 29, 5.5], fill: "rgba(112,112,112,1)"},
                {type: "text", position: [72, 52, 27, 4.5], align: "center", value: _lastIntermission.dllHitrate, color: "rgba(255,255,255,1)" },
            ]
        })

        ship.setUIComponent({
            id: "borderOuter",
            position: [31.5, 19.5, 37, 50.5],
            clickable: false,
            visible: true,
            components: [
                {type: "box", position: [0, 0, 100, 100], stroke: "rgba(255,255,255,1)", width: 7},
            ]
        })

        return ship.setUIComponent({
            id: "okButton",
            position: [32, 64, 36, 5],
            clickable: true,
            visible: true,
            components: [
                {type: "box", position: [0, 0, 100, 100], fill: "rgba(155,155,155,1)" , stroke: "rgba(220,220,220,1)" , width: 4},
                {type: "text", position: [0, 0, 100, 100], align: "center", value: "𝗢𝗞", color: "rgba(0,0,0,1)"},
            ]
        })
        
    }

    ship.custom.isDuelerReady = false;

    READYING_PHASE.renderReadyForDueler(ship);
    selectedSpeedsterProcedure(ship);

    ship.set({x: 0, y: 0, vx: 0, vy: 0, shield: 9999, crystals: 719, collider: false, idle: false});
}

this.event = function (event, game) {
    switch (event.name) {
        case "ship_destroyed":
            handleEloCalculation(event.killer, event.ship);
            let killer = sessionMemory.duelers.find(obj => obj.id == event.killer.id);
            let victim = sessionMemory.duelers.find(obj => obj.id == event.ship.id);


            if (killer && victim) {
                killer.custom.isDuelerReady = false;
                victim.custom.isDuelerReady = false;

                let duelRef = sessionMemory.allDuels[sessionMemory.allDuels.length - 1];

                duelRef.active = false;

                ++killer.custom._statTrack.stats.hits;

                TRACK_STATS.statCleanup();

                let khr =  roundToDecimalPlace((killer.custom._statTrack.stats.hits / killer.custom._statTrack.stats.shots) * 100, 1);
                let vhr = roundToDecimalPlace((victim.custom._statTrack.stats.hits / victim.custom._statTrack.stats.shots) * 100, 1);

                if (isNaN(khr)) khr = 0;
                if (isNaN(vhr)) vhr = 0;

                let display = {
                    "Duelers:": `${killer.name}, ${victim.name}`,
                    "dlWinner": killer.name + "",
                    "dlLength": `${~~(duelRef.time / 60)}:${String(duelRef.time % 60).padStart(2, "0")}`,
                    "⠀": " ",
                    "Winner stats": " ",
                    "dlw": killer.id,
                    "dlwFired": " " + killer.custom._statTrack.stats.shots,
                    "dlwLanded": " " + killer.custom._statTrack.stats.hits,
                    "dlwHitrate": khr + "%",
                    "⠀⠀": " ",
                    "Loser stats": " ",
                    "dll": victim.id,
                    "dllFired": " " + victim.custom._statTrack.stats.shots,
                    "dllLanded": " " +  victim.custom._statTrack.stats.hits,
                    "dllHitrate":  vhr + "%",
                };
                //killer.intermission(display);
                _lastIntermission = display;
                prepareDueler(killer, true);

                for (let ship of game.ships) {
                    prepareDueler(ship, true);
                }

                TRACK_STATS.flushAndSave(killer.id);
                if (sessionMemory.allDuels.length === 3) {
                    copyAllDuels();
                }
            }
            break
        case "ship_spawned":
            if (event.ship != null) {
                event.ship.custom._statTrack = {};
                if (sessionMemory.banned.includes(event.ship.name)) {
                    kickPlayer(event.ship)
                }
                if (!event.ship.custom.hasOwnProperty("registered") && event.ship.name) {
                    for (let comp of sessionMemory.bruteforceBanned) {
                        let lsim = levenshteinSimilarity(comp, event.ship.name);
                        if (lsim >= staticMemory.bruteforceBan_minimumSimilarity) {
                            statusMessage("warn", `${event.ship.name} has been kicked: Levenshtein similarity ${lsim} - Maximum ${staticMemory.bruteforceBan_minimumSimilarity}`);
                            setTimeout(() => {
                                kickPlayer(event.ship.name);
                            }, 50);
                        }
                    }
                }

                
                let type = staticMemory.requireShip ? String(staticMemory.requireShip) : String(event.ship.type);

                let level = String((type - (type % 100)) / 100);


                if (sessionMemory.duelers.find(obj => obj.id == event.ship.id)) {
                    scheduleJob(1500, () => prepareDueler(event.ship, true))
                }
                
                if (!event.ship.custom.hasOwnProperty("registered")) {
                    const COR = {
                        "new": "605",
                        "legacy": "609"
                    }

                    type = (sessionMemory.duelers.length < 2) ? COR[sessionMemory.duelerStatus.speedsterType] : "191";
                    level = String((type - (type % 100)) / 100);

                    event.ship.elo = 0;
                    event.ship.kd = {
                        value: 0,
                        kills: 0,
                        deaths: 0
                    }
                    event.ship.custom.goto = {x: 0, y: 0};
                    event.ship.custom.forcedToSpectate = false;
                    event.ship.custom.uiHidden = false;
                    event.ship.custom._shipSelectOpen = false;
                    event.ship.custom._ttlTimer = null;
                    event.ship.custom.speedsterType = sessionMemory.duelerStatus.speedsterType ? sessionMemory.duelerStatus.speedsterType : "new";
                    
                    event.ship.set({
                        type: Number(type), 
                        stats: Number(level.repeat(8)), 
                        shield: 9999, 
                        crystals: staticMemory.GEM_CAPS[(Number(type) / 100) >> 0], 
                        collider: false,
                        invulnerable: 60
                    })
                    if (_ALLOW_LEGACY_TURN) {
                        if (sessionMemory.duelers.length < 2) {
                            selectedSpeedsterProcedure(event.ship);
                        }
                    }

                    if (sessionMemory.duelers.length < 2) {
                        initiateDueler(event.ship);
                        event.ship.custom.sdlType = "dueler";
                    } else {
                        event.ship.custom.sdlType = "spectator";
                        event.ship.set({
                            type: 191, 
                            stats: Number("1".repeat(8)), 
                            shield: 9999, 
                            crystals: 0, 
                            collider: false,
                            invulnerable: 60
                        })
                    }
                    updateScoreboard();
                    //recalculateTickDelay();
                    statusMessage("info", `${event.ship.name} joined. ID: ${event.ship.id}`);
                }
                event.ship.custom.registered = true;
                event.ship.lastTeleported = null;
                event.ship._nextButtonClick = 0;
                event.ship.afk = {
                    time: 0,
                    lastPos: {
                        x: 0,
                        y: 0
                    }
                },
                event.ship.spectating = {
                    value: false,
                    lastShip: null
                };
                
                event.ship.set({
                    x: event.ship.custom.goto.x, 
                    y: event.ship.custom.goto.y,
                    stats: Number(level.repeat(8)), 
                    crystals: staticMemory.GEM_CAPS[(Number(type) / 100) >> 0], 
                })
                
                
                if (!(sessionMemory.rememberedIDs.includes(event.ship.id))) {
                    sessionMemory.rememberedIDs.push(event.ship.id)
                }
                renderSpectateRegen(event.ship);

            }
            break;
        case "ui_component_clicked":
            var component = event.id;
            
            if (game.step < event.ship._nextButtonClick) {
                return fleetingMessage(event.ship, "You are being rate limited")
            }
            
            const DELAY_BUTTON_CLICK = staticMemory._CLICK_RATE_LIMIT; // * in ticks
            event.ship._nextButtonClick = game.step + DELAY_BUTTON_CLICK;

            switch (component) {
                case "okButton":
                    let removal = ["okButton", "flIntermission", "borderOuter"];

                    for (let id of removal) {
                        event.ship.setUIComponent({id: id, ...NULL_COMPONENT});
                    }

                    if (sessionMemory.duelers.find(obj => obj.id == event.ship.id)) {
                        prepareDueler(event.ship);
                    } else {
                        event.ship.set({idle: false})
                    }
                    break;

                case "duelerReady":
                    event.ship.custom.isDuelerReady = !event.ship.custom.isDuelerReady;
                    READYING_PHASE.renderReadyForDueler(event.ship);
                    break;
                
                case "asLegacy":
                    if (REQUEST_SHIP_CHANGE.started) {
                        REQUEST_SHIP_CHANGE.accept(event.ship);
                    } else {
                        REQUEST_SHIP_CHANGE.initiate(event.ship);
                    }
                    break;

                case "hide_all_ui":
                    hideAllUI(event.ship, !event.ship.custom.uiHidden);
                    event.ship.custom.uiHidden = !event.ship.custom.uiHidden;
                    break;

                // case "showShipTree":
                //     return SHIP_TREE_PANEL.renderShipTree(event.ship);

                // case "closeShipTree":
                //     return SHIP_TREE_PANEL.closeShipTree(event.ship);

                // case "spectate":
                //     if (event.ship.custom.forcedToSpectate) {
                //         return fleetingMessage(event.ship, "You have been forced to spectate");
                //     }
                //     if (event.ship.spectating.value) {
                //         let type = event.ship.spectating.lastShip;
                //         let level = type.charAt(0);
                //         event.ship.set({type: Number(type), stats: Number(level.repeat(8)), crystals: staticMemory.GEM_CAPS[(Number(type) / 100) >> 0], collider: false, shield: 99999, vx: 0, vy: 0});
                        
                //         setTimeout(() => {
                //             if (event.ship.type !== 191) {
                //                 event.ship.set({collider: true});
                //             }
                //         }, 1000)

                //         event.ship.spectating.value = false;
                //     } else {
                //         turnToSpectator(event.ship);
                //     }
                //     break

                // case "regen":
                //     event.ship.set({shield: 99999, crystals: staticMemory.GEM_CAPS[(event.ship.type / 100) >> 0]})
                //     break

                // case "teleport":
                //     return teleportToNext(event.ship, game);


                default:
                    // Search every KEY and if component.startsWith(KEY) execute and return the function
                    // All prefix-based component must be formatted like {action}_{id}
                    //                      Make sure to include the underscore ^^^

                    // Sort these by frequency to boost performance
                    const extractArg = (comp) => comp.split("_")[1];

                    const prefixes = {
                        "selectShip": () => {
                            let type = component.split("_")[1];
                            let level = type.charAt(0);

                            // ! Guard clause if the player already had ship tree open when requireShip() was fired
                            if (staticMemory.requireShip && staticMemory.requireShip != Number(type)) {
                                return;
                            }

                            if (_ALLOW_LEGACY_TURN) {
                                if (type == "605") {
                                    return selectedSpeedsterProcedure(event.ship);
                                } else {
                                    deselectedSpeedsterProcedure(event.ship);
                                }
                            }

                            event.ship.set({type: Number(type), stats: Number(level.repeat(8)), crystals: staticMemory.GEM_CAPS[(Number(type) / 100) >> 0], shield: 99999})
                        },
                    }
                    for (let prefix of Object.keys(prefixes)) {
                        if (component.startsWith(prefix + "_")) {
                            return prefixes[prefix]();
                        }
                    }
                    return;
            }
            return;
    }
};

const kickPlayer = (ship) => ship.gameover({ "": "You have been kicked from participating", "Score": 0 });


const removeFromArray = (arr, target) => arr.filter(item => item !== target);
const removeIndexFromArray = (arr, index) => arr.filter((_, ind) => ind !== index);

const fetchChat = (id1, id2) => sessionMemory.chatChannels.findIndex(el => el.parties !== undefined && el.parties.includes(id1) && el.parties.includes(id2))
const fetchShip = (id) => game.ships.findIndex(el => el.id === id)



const FLEETING_TTL = 3000;


let fleetingTimer = null
const fleetingMessage = (ship, message) => {
    if (!ship.custom._ttlTimer) {
        ship.setUIComponent({
            id: "fleeting",
            position: [0, 80, 78, 5],
            clickable: false,
            visible: true,
            components: [
                { type: "text", position: [0, 0, 100, 100], color: "hsla(0, 100%, 65%, 1.00)", value: message, align: "right" }
            ]
        })
        //fleetingTimer = 
        ship.custom._ttlTimer = scheduleJob(FLEETING_TTL, () => {
            ship.setUIComponent({
                id: "fleeting",
                ...NULL_COMPONENT
            })
            ship.custom._ttlTimer = null;
        })
    }
}

const randomString = (len = 16) => {
    let outp = "";
    let alp = "abcdefghjiklmnopqrstuvwxyz1234576879";
    for (let i = 0; i < len; i++) {
        outp += alp.charAt(~~(Math.random() * alp.length));
    }
    return outp;
}

let _lastNumOfShips = 0;
let _lastCalculatedTickDelay = staticMemory.TICK_THROTTLE_PER_PLAYER + 0;
const recalculateTickDelay = () => _lastCalculatedTickDelay = staticMemory.TICK_THROTTLE_PER_PLAYER * game.ships.length;

let _scheduledJobs = [];

const scheduleJob = (ms, callback) => {
    const insertAtIndex = (array, element, index) => [...array.slice(0, index), element, ...array.slice(index)];
    const jobID = generateRandomHex();

    let insert = {
        _id: jobID,
        triggerOn: (game.step + ((ms / 1000) * 60)) >> 0,
        callback
    }

    let insertBefore = null;

    for (let jobIndex in _scheduledJobs) {
        if (_scheduledJobs[jobIndex]?.triggerOn >= insert.triggerOn) {
            insertBefore = jobIndex;
            break
        }
    }

    if (insertBefore) {
        _scheduledJobs = insertAtIndex(_scheduledJobs, insert, insertBefore);
    } else _scheduledJobs.push(insert);
    
    return jobID;
}

this.tick = (game) => {

    if (game.ships.length < _lastNumOfShips) {
        asynchronize(
            () => customEvent("ship_left")
        )
    }
    _lastNumOfShips = game.ships.length;

    if (game.step % SDL_CONFIG.TRACKER_TICK_RATE === 0) {
        for (let i = 0, len = _scheduledJobs.length; i < len; i++) {
            let target = _scheduledJobs[i];
            if (target?.triggerOn < game.step) {
                target.callback();
                _scheduledJobs.shift();
                i--;
            } else break;
        }
        for (let ship of game.ships) {
            TRACK_STATS.generatorTracker(ship, ship.generator);
            TRACK_STATS.shieldTracker(ship, ship.shield);
        }
    }

    for (let j = 0, glen = game.ships.length; j < glen; j++) {
        let ship = game.ships[j];

        if (staticMemory.alwaysPickUpGems) {
            let t = (ship.type / 100) >> 0;
            let k = 20 * t * t;
            if (ship.crystals === k) {
                ship.set({crystals: k - 1})
            }
        }
    }
}


// ! Below are helper functions
function expectedProbability(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

const roundToDecimalPlace = (number, decimalPlaces) => Number(number.toFixed(decimalPlaces));

function updateSubjectElo(subject, opponent, didSubjectWin) {
    const {MAX_WIN_LOSS_THRESHOLD} = staticMemory;

    let kFactor = staticMemory.ELO_K_FACTOR;

    const expectedWinProbability = expectedProbability(subject, opponent);

    const actualOutcome = didSubjectWin ? 1 : 0;

    const newRating = subject + kFactor * (actualOutcome - expectedWinProbability);

    if (didSubjectWin) {
        if (newRating > (subject + MAX_WIN_LOSS_THRESHOLD)) {
            newRating = subject + MAX_WIN_LOSS_THRESHOLD;
        }
    } else {
        if (newRating < (subject - MAX_WIN_LOSS_THRESHOLD)) {
            newRating = subject - MAX_WIN_LOSS_THRESHOLD;
        }
    }

    return roundToDecimalPlace(newRating, 1); 
}



function levenshteinSimilarity(str1, str2) {
    function levenshteinDistance(s1, s2) {
        const m = s1.length;
        const n = s2.length;

        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) {
            for (let j = 0; j <= n; j++) {
                if (i === 0) {
                    dp[i][j] = j;
                } else if (j === 0) {
                    dp[i][j] = i;
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + (s1[i - 1] === s2[j - 1] ? 0 : 1),
                        dp[i][j - 1] + 1,
                        dp[i - 1][j] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return similarity;
}


function asynchronize(callback) {
    setTimeout(() => {
        try {
            callback();
        } catch (error) {
            statusMessage("error", `asynchronize(...) failure: Callback - ${callback.name}. More in console`)
            //console.warn(error);
        }
    }, 0);
}