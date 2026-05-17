// ----------------------------------------------------
// HTML Element References
// ----------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameUI = document.getElementById('gameUI');
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogTitle = document.getElementById('dialogTitle');
const dialogText = document.getElementById('dialogText');
const dialogButtons = document.getElementById('dialogButtons');

// Stats UI
const uiDays = document.getElementById('daysDisplay');
const uiTime = document.getElementById('clockDisplay');
const uiEnergy = document.getElementById('energyDisplay');
const uiFun = document.getElementById('funDisplay');
const uiIntel = document.getElementById('intelDisplay');
const uiStr = document.getElementById('strDisplay');
const uiDollars = document.getElementById('dollarsDisplay');
const uiCompanion = document.getElementById('companionDisplay');
const uiNails = document.getElementById('nailsDisplay');
const uiScrews = document.getElementById('screwsDisplay');
const uiLumber = document.getElementById('lumberDisplay');
const uiItems = document.getElementById('itemDisplay');
// Minigames
const basketballUI = document.getElementById('basketballUI');
const meterCursor = document.getElementById('meterCursor');
const bballMessage = document.getElementById('bballMessage');

const dogUI = document.getElementById('dogUI');
const dogMessage = document.getElementById('dogMessage');

// ----------------------------------------------------
// Game State
// ----------------------------------------------------
let isPlaying = false;
let gameState = 'OVERWORLD'; // OVERWORLD, DIALOG, MINIGAME_BBALL, MINIGAME_DOG_COUNTDOWN, MINIGAME_DOG
let lastTime = performance.now();

const state = {
    character: 'Asher', // 'Asher' or 'Elliot'
    daysRemaining: 30,
    clockMinutes: 8 * 60, // 8:00 AM
    energy: 100,
    maxEnergy: 100,
    maxEnergyBuffTimer: 0,
    intel: 0,
    strength: 0,
    dollars: 50,
    fun: 0,
    
    // Inventory & Progress
    nails: 0,
    screws: 0,
    lumber: 0,
    treehouseBuildCount: 0, // Needs to reach 10
    hasTreehouseCouch: false,
    hasTreehouseTV: false,
    hasTreehouseLEDs: false,
    
    hasAirlessBall: false,
    has3DShoes: false,
    hasDogToy: false,
    
    // School / Target Program
    inTargetProgram: false,
    
    // Companion
    companion: null, // 'Rohan', 'Taj', or null
    
    // Position
    x: 600,
    y: 400,
    speed: 2,
    size: 20
};

const keys = { w: false, a: false, s: false, d: false, ' ': false, '1': false, '2': false, '3': false, '4': false, '5': false };

// ----------------------------------------------------
// Zones & Map Data
// ----------------------------------------------------
canvas.width = 1200;
canvas.height = 800;

// Top-left: House, Bottom-left: Downtown, Top-right: School/Church, Bottom-right: Sports/Wilderness
const zones = [
    { name: 'Office', x: 50, y: 50, w: 150, h: 60, color: '#1e3a8a', label: 'Office' },
    { name: 'Bedroom', x: 50, y: 120, w: 150, h: 50, color: '#6366f1', label: 'Bedroom (Sleep)' },
    { name: 'Garage', x: 50, y: 180, w: 150, h: 80, color: '#475569', label: 'Garage (3D)' },
    { name: 'Treehouse', x: 220, y: 50, w: 150, h: 210, color: '#854d0e', label: 'Backyard Treehouse' },
    
    { name: 'Sope Creek', x: 800, y: 50, w: 300, h: 150, color: '#dc2626', label: 'Sope Creek Elementary' },
    { name: 'Grace Marietta', x: 800, y: 220, w: 300, h: 150, color: '#9333ea', label: 'Grace Marietta Church' },
    
    { name: 'GP Center', x: 50, y: 400, w: 200, h: 150, color: '#0f172a', label: 'GP Center (Dad)' },
    { name: 'Fugu Express', x: 50, y: 600, w: 120, h: 100, color: '#ea580c', label: 'Fugu Express' },
    { name: 'Home Depot', x: 190, y: 600, w: 150, h: 100, color: '#f97316', label: 'Home Depot' },
    
    { name: 'Sports Complex', x: 600, y: 600, w: 250, h: 150, color: '#2563eb', label: 'Sports Complex' },
    { name: 'Wilderness', x: 900, y: 600, w: 200, h: 150, color: '#166534', label: 'Fall Creek Falls' },
    
    { name: 'Taj House', x: 500, y: 50, w: 200, h: 150, color: '#0d9488', label: "Rohan & Taj's House" }
];

// NPCs
const npcs = [
    { name: 'Mom', x: 400, y: 200, radius: 15, color: '#f472b6' },
    { name: 'Dad', x: 150, y: 475, radius: 15, color: '#94a3b8' } // Inside GP Center
];

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
document.getElementById('btnAsher').addEventListener('click', () => startGame('Asher'));
document.getElementById('btnElliot').addEventListener('click', () => startGame('Elliot'));

document.getElementById('btnInstructions').addEventListener('click', showInstructions);

function showInstructions() {
    showDialog("Map Instructions", 
        "🏠 Office: Play Minecraft/Solder (+Fun, +Intel)\n" +
        "🏠 Bedroom: Sleep to restore energy and save the day.\n" +
        "🏠 Garage: 3D Print items using Dollars\n" +
        "🏠 Treehouse: Build it and install furniture!\n" +
        "🏫 Sope Creek: Study (+Intel) or Math Test!\n" +
        "⛪ Grace Marietta: Hang out (Heals, +Fun)\n" +
        "🏙️ GP Center: Work with Dad (+Dollars)\n" +
        "🍣 Fugu Express: Buy food (+Energy)\n" +
        "🛠️ Home Depot: Buy building materials (-Dollars)\n" +
        "🏀 Sports Complex: Play Hoops (+Strength)\n" +
        "🌲 Wilderness: Hike (+Strength, +Fun)\n" +
        "🏠 Taj's House: Recruit a companion for +Fun!",
        [{label: "[1] Got it!", action: () => {}}]
    );
}

function startGame(char) {
    state.character = char;
    startScreen.classList.add('hidden');
    gameUI.classList.remove('hidden');
    canvas.classList.remove('hidden');
    isPlaying = true;
    updateUI();
    
    // Story Context Intro
    showDialog("Welcome to Family Stick RPG!", 
        "Your main objective is to finish the Shed-Style Treehouse in your backyard in 30 days! \n\nHelp Dad at GP Center to earn Dollars, buy materials at Home Depot, and level up your stats at school and the sports complex!\n\nKeep your Fun level high to boost all your stat gains!", 
        [{label: "[1] Let's Go!", action: () => {}}]
    );

    requestAnimationFrame(gameLoop);
}

// Input (Handles global keydowns including numbers for dialogs and start screen)
window.addEventListener('keydown', e => { 
    if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; 
    if(e.key === 'e' || e.key === 'E') handleInteraction();
    
    // Start Screen Character Select
    if (!isPlaying) {
        if (e.key === '1') startGame('Asher');
        if (e.key === '2') startGame('Elliot');
    }
    
    // Dialog Selection
    if (gameState === 'DIALOG' || gameState.startsWith('MINIGAME_MATH')) {
        let num = parseInt(e.key);
        let btns = dialogButtons.querySelectorAll('button');
        if (!isNaN(num) && num > 0) {
            if (num <= btns.length) {
                btns[num - 1].click();
            }
        } else if (gameState === 'DIALOG') {
            if (e.key.toLowerCase() === 'e' || e.key === ' ') {
                if (btns.length > 0) btns[0].click();
            } else if (e.key.toLowerCase() === 'q') {
                if (btns.length > 1) btns[btns.length - 1].click();
            }
        }
    }
});
window.addEventListener('keyup', e => { 
    if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; 
});

// ----------------------------------------------------
// Utility Functions
// ----------------------------------------------------
function formatTime(mins) {
    let h = Math.floor(mins / 60) % 24;
    let m = Math.floor(mins % 60);
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDuration(mins) {
    if (mins < 60) return `${mins} mins`;
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    return m > 0 ? `${h} hour${h > 1 ? 's' : ''} ${m} min${m > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''}`;
}

function updateUI() {
    uiDays.innerText = state.daysRemaining;
    uiTime.innerText = formatTime(state.clockMinutes);
    uiEnergy.innerText = Math.floor(state.energy);
    uiFun.innerText = state.fun;
    uiIntel.innerText = state.intel;
    uiStr.innerText = state.strength;
    uiDollars.innerText = state.dollars;
    
    uiCompanion.innerText = state.companion || 'None';
    uiNails.innerText = state.nails;
    uiScrews.innerText = state.screws;
    uiLumber.innerText = state.lumber;
    
    let items = [];
    if(state.hasAirlessBall) items.push('Airless Ball');
    if(state.has3DShoes) items.push('3D Shoes');
    if(state.hasDogToy) items.push('Dog Toy');
    uiItems.innerText = items.length > 0 ? items.join(', ') : 'None';
}

function showDialog(title, text, buttons) {
    gameState = 'DIALOG';
    dialogTitle.innerText = title;
    dialogText.innerText = text;
    dialogButtons.innerHTML = '';
    
    // Reset movement keys so we don't sprint off after closing
    keys.w = false; keys.a = false; keys.s = false; keys.d = false;
    
    buttons.forEach((btn, index) => {
        const b = document.createElement('button');
        b.className = 'dialog-btn';
        b.innerText = btn.label;
        b.onclick = () => {
            btn.action();
            if(!btn.keepOpen) {
                dialogOverlay.classList.add('hidden');
                gameState = 'OVERWORLD';
                // Move player slightly down to avoid re-triggering immediately
                state.y += 10;
            }
        };
        dialogButtons.appendChild(b);
    });
    
    dialogOverlay.classList.remove('hidden');
}

function sleepAction() {
    let currentMinsOfDay = state.clockMinutes % (24 * 60);
    
    // 7am = 420 mins, 7pm = 1140 mins
    if (currentMinsOfDay >= 420 && currentMinsOfDay < 1140) {
        showDialog("Not Bedtime!", "It's not bedtime yet. You should find another way to get energy.", [{label:"[1] Okay", action:()=>{}}]);
        return;
    }
    
    let energyRestored = 0;
    // 7pm to 9:30pm (1140 to 1290) -> 100 energy
    if (currentMinsOfDay >= 1140 && currentMinsOfDay < 1290) {
        energyRestored = 100;
    } 
    // 9:30pm to 12:00am (1290 to 1440/0) -> 75 energy
    else if (currentMinsOfDay >= 1290 && currentMinsOfDay <= 1440) {
        energyRestored = 75;
    } 
    // 12am to 7am (0 to 420) -> 70 ramping down to 0
    else if (currentMinsOfDay >= 0 && currentMinsOfDay < 420) {
        energyRestored = Math.floor(70 * (1 - (currentMinsOfDay / 420)));
    }
    
    state.energy = Math.min(state.maxEnergy, state.energy + energyRestored);
    
    // Reset daily buffs/variables
    state.fun = 0;
    state.daysRemaining -= 1;
    state.companion = null;
    
    // Jump to 7 AM next day
    if (currentMinsOfDay < 420) {
        // It's already the "next day" numerically
        state.clockMinutes = Math.floor(state.clockMinutes / (24 * 60)) * 24 * 60 + (7 * 60); 
    } else {
        state.clockMinutes = Math.floor(state.clockMinutes / (24 * 60)) * 24 * 60 + (24 * 60) + (7 * 60); 
    }
    
    updateUI();
    
    if (state.daysRemaining <= 0) {
        showDialog("Game Over!", "You ran out of days to finish the treehouse!", [{label: "Restart", action: () => location.reload()}]);
    } else {
        showDialog("Good Morning!", `You woke up feeling refreshed. Gained ${energyRestored} Energy. Day ${31 - state.daysRemaining} begins! Fun has been reset to 0.`, [{label: "Let's Go!", action: ()=>{}}]);
    }
}

function advanceTime(mins) {
    let oldDay = Math.floor(state.clockMinutes / (24*60));
    state.clockMinutes += mins;
    let newDay = Math.floor(state.clockMinutes / (24*60));
    if (newDay > oldDay) {
        state.daysRemaining -= (newDay - oldDay);
    }
    
    if (state.maxEnergyBuffTimer > 0) {
        state.maxEnergyBuffTimer -= mins;
        if (state.maxEnergyBuffTimer <= 0) {
            state.maxEnergyBuffTimer = 0;
            state.maxEnergy = 100;
            if (state.energy > state.maxEnergy) state.energy = state.maxEnergy;
            updateUI();
            showDialog("Energy Crash", "Brian's hype wore off. Your max energy returned to 100.", [{label:"[1] Okay", action:()=>{}}]);
        }
    }
}

function applyStatChange(actionName, timeCost, energyCost, statsMap) {
    let currentMinsOfDay = state.clockMinutes % (24 * 60);
    // Late night penalty: Double cost between 9:30 PM (1290 mins) and 7:00 AM (420 mins)
    if (currentMinsOfDay >= 1290 || currentMinsOfDay < 420) {
        timeCost *= 2;
        if (energyCost > 0) {
            energyCost *= 2;
        }
    }

    advanceTime(timeCost);
    state.energy -= energyCost;
    
    // Fun Mechanic
    if (statsMap.fun) {
        state.fun += statsMap.fun;
        delete statsMap.fun; // Don't process fun as a regular stat multiplier target
    }
    
    // Cap Fun
    if (state.fun > 100) state.fun = 100;
    if (state.fun < -100) state.fun = -100;
    
    let multiplier = 1 + (state.fun / 100);
    if (multiplier < 0) multiplier = 0;
    
    let resultText = `Time spent: ${formatDuration(timeCost)}.\nEnergy used: ${energyCost}.\n`;
    if (state.fun !== 0) {
        resultText += `(Fun Bonus: ${state.fun}% multiplier!)\n`;
    }
    
    for(let [stat, val] of Object.entries(statsMap)) {
        let finalVal = Math.floor(val * multiplier);
        if (stat === 'dollars') finalVal = val; // Don't multiply dollars by fun
        
        if (stat !== 'dollars') {
            state[stat] += finalVal;
            resultText += `${finalVal >= 0 ? '+' : ''}${finalVal} ${stat.charAt(0).toUpperCase() + stat.slice(1)}! \n`;
        } else {
            state[stat] += finalVal;
            resultText += `${finalVal >= 0 ? '+' : ''}$${finalVal} \n`;
        }
    }
    
    if (state.energy < 0) state.energy = 0;
    if (state.energy > state.maxEnergy) state.energy = state.maxEnergy;
    
    updateUI();
    
    // Show explicit result popup
    showDialog(`${actionName} Complete!`, resultText, [{label: "[1] Awesome!", action: ()=>{}}]);
    
    if(state.energy <= 0) {
        setTimeout(() => {
            showDialog("Passed Out!", "You completely ran out of energy and blacked out! You wake up in your bed 8 hours later.", [
                { label: '[1] Wake Up', action: () => { 
                    state.energy = state.maxEnergy;
                    advanceTime(8 * 60);
                    state.fun = 0;
                    
                    let bedroom = zones.find(z => z.name === 'Bedroom');
                    if (bedroom) {
                        state.x = bedroom.x + 50;
                        state.y = bedroom.y + 25;
                    }
                    
                    dialogOverlay.classList.add('hidden');
                    gameState = 'OVERWORLD';
                    updateUI();
                } }
            ]);
        }, 500);
    }
}

// ----------------------------------------------------
// Interaction Logic
// ----------------------------------------------------
function handleInteraction() {
    if (gameState !== 'OVERWORLD') return;
    
    // Check NPCs
    for (let npc of npcs) {
        let dist = Math.hypot(state.x - npc.x, state.y - npc.y);
        if (dist < 40) {
            if (npc.name === 'Mom') {
                showDialog("Mom (Kim)", "Make sure you aren't staying up too late! I found a Couch for the treehouse, but it's super heavy.", [
                    { label: '[1] Buy Couch ($500)', action: () => { 
                        if (state.treehouseBuildCount < 10) {
                            showDialog("Not Ready", "You need to finish building the physical treehouse first before installing furniture!", [{label:"[1] Okay", action:()=>{}}]);
                        } else if (state.dollars < 500) {
                            showDialog("Too expensive", "You don't have $500.", [{label:"[1] Okay", action:()=>{}}]);
                        } else if (state.strength < 500) {
                            showDialog("Too weak", "You need 500 Strength to lift and install this massive couch!", [{label:"[1] Okay", action:()=>{}}]);
                        } else if (state.hasTreehouseCouch) {
                            showDialog("Already Installed", "The couch is already in the treehouse!", [{label:"[1] Okay", action:()=>{}}]);
                        } else {
                            state.dollars -= 500;
                            state.hasTreehouseCouch = true;
                            updateUI();
                            showDialog("Success!", "You bought the Couch and installed it!", [{label:"[1] Nice", action:()=>{}}]);
                        }
                    }, keepOpen: true },
                    { label: '[2] Rest (Restore Energy, Takes Time)', action: () => {
                        let missingEnergy = state.maxEnergy - state.energy;
                        if (missingEnergy <= 0) {
                            showDialog("Full Energy", "You already have full energy!", [{label:"[1] Okay", action:()=>{}}]);
                        } else {
                            let timeCost = 120;
                            let currentMinsOfDay = state.clockMinutes % (24 * 60);
                            if (currentMinsOfDay >= 1290 || currentMinsOfDay < 420) {
                                timeCost *= 2;
                            }
                            advanceTime(timeCost);
                            state.energy = state.maxEnergy;
                            updateUI();
                            showDialog("Rested!", `Mom made you a snack. You restored all your energy, but it took ${formatDuration(timeCost)}.`, [{label:"[1] Thanks Mom!", action:()=>{}}]);
                        }
                    }, keepOpen: true },
                    { label: '[3] Not right now', action: () => {} }
                ]);
                return;
            } else if (npc.name === 'Dad') {
                showDialog("Dad (Kyle)", "Hey buddy. Want to help me with some Fusion 360 scripts? Or do you want to buy some LED lights?", [
                    { label: '[1] Help Dad (2h, -$ Energy)', action: () => {
                        let payout = 20 + Math.floor(state.intel * 1.5);
                        applyStatChange("Helping Dad", 120, 30, { dollars: payout, fun: -20 });
                    }, keepOpen: true },
                    { label: '[2] Buy LED Lights ($20)', action: () => {
                        if (state.treehouseBuildCount < 10) {
                            showDialog("Not Ready", "You need to finish building the physical treehouse first before installing lights!", [{label:"[1] Okay", action:()=>{}}]);
                        } else if (state.hasTreehouseLEDs) {
                            showDialog("Already Installed", "LED lights are already installed!", [{label:"[1] Okay", action:()=>{}}]);
                        } else if (state.dollars >= 20) {
                            state.dollars -= 20;
                            state.hasTreehouseLEDs = true;
                            // Takes 24 hours to install (skip to next day basically)
                            applyStatChange("Installing LEDs", 1440, 50, { fun: 10 });
                        } else {
                            showDialog("Insufficient Funds", "You need $20.", [{label:"[1] Okay", action:()=>{}}]);
                        }
                    }, keepOpen: true },
                    { label: '[3] Nevermind', action: () => {} }
                ]);
                return;
            }
        }
    }

    // Check Zones
    const pRect = { x: state.x - 10, y: state.y - 10, w: 20, h: 20 };
    for (let z of zones) {
        if (pRect.x < z.x + z.w && pRect.x + pRect.w > z.x &&
            pRect.y < z.y + z.h && pRect.y + pRect.h > z.y) {
            
            triggerZone(z.name);
            return;
        }
    }
}

function triggerZone(zoneName) {
    if (zoneName === 'Bedroom') {
        showDialog("Bedroom", "Ready to call it a day?", [
            { label: '[1] Go to Sleep', action: () => sleepAction(), keepOpen: true },
            { label: '[2] Not Yet', action: () => {} }
        ]);
    } else if (zoneName === 'Office') {
        const actionStr = state.character === 'Elliot' ? '[1] Solder Circuits' : '[1] Play Minecraft';
        
        showDialog("Home Office", "The L-shaped pine desk and midnight blue walls.", [
            { label: actionStr, action: () => applyStatChange(state.character==='Elliot'?"Soldering":"Minecraft", 60, 15, { intel: 5, fun: 20 }), keepOpen: true },
            { label: '[2] Take Free TV', action: () => {
                if (state.treehouseBuildCount < 10) {
                    showDialog("Not Ready", "You need to finish building the physical treehouse first before installing the TV!", [{label:"[1] Okay", action:()=>{}}]);
                } else if (state.hasTreehouseTV) {
                    showDialog("Already Installed", "The TV is already in the treehouse!", [{label:"[1] Okay", action:()=>{}}]);
                } else if (state.intel < 500) {
                    showDialog("Too Technical", "You need 500 Intelligence to set up the complex internet connection for this TV.", [{label:"[1] Okay", action:()=>{}}]);
                } else {
                    state.hasTreehouseTV = true;
                    applyStatChange("Installing TV", 180, 20, { fun: 50 });
                }
            }, keepOpen: true},
            { label: '[3] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Garage') {
        showDialog("Tech Station", "The Bambu X1C 3D Printer is humming.", [
            { label: '[1] Craft Airless Basketball ($200)', action: () => {
                if(state.dollars >= 200) { 
                    state.dollars -= 200; 
                    let successChance = Math.min(95, 30 + state.intel);
                    if (Math.random() * 100 < successChance) {
                        state.hasAirlessBall = true; updateUI(); 
                        showDialog("Success!", "You printed an Airless Basketball!", [{label:"[1] Sweet!", action:()=>{}}]);
                    } else {
                        applyStatChange("Failed Print", 0, 0, { fun: -25 });
                    }
                } else showDialog("Insufficient Funds", "You don't have enough dollars.", [{label:"[1] Okay", action:()=>{}}]);
            }, keepOpen: true},
            { label: '[2] Craft 3D Shoes ($300)', action: () => {
                if(state.dollars >= 300) { 
                    state.dollars -= 300; 
                    let successChance = Math.min(95, 30 + state.intel);
                    if (Math.random() * 100 < successChance) {
                        state.has3DShoes = true; updateUI(); 
                        showDialog("Success!", "You printed 3D Shoes!", [{label:"[1] Sweet!", action:()=>{}}]);
                    } else {
                        applyStatChange("Failed Print", 0, 0, { fun: -25 });
                    }
                } else showDialog("Insufficient Funds", "You don't have enough dollars.", [{label:"[1] Okay", action:()=>{}}]);
            }, keepOpen: true},
            { label: '[3] Craft Dog Toy ($150)', action: () => {
                if(state.dollars >= 150) { 
                    state.dollars -= 150; 
                    let successChance = Math.min(95, 30 + state.intel);
                    if (Math.random() * 100 < successChance) {
                        state.hasDogToy = true; updateUI(); 
                        showDialog("Success!", "You printed a Dog Toy! This will distract dogs.", [{label:"[1] Sweet!", action:()=>{}}]);
                    } else {
                        applyStatChange("Failed Print", 0, 0, { fun: -25 });
                    }
                } else showDialog("Insufficient Funds", "You don't have enough dollars.", [{label:"[1] Okay", action:()=>{}}]);
            }, keepOpen: true},
            { label: '[4] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Treehouse') {
        let reqNails = (state.treehouseBuildCount + 1) * 2;
        let reqScrews = (state.treehouseBuildCount + 1) * 2;
        let reqLumber = (state.treehouseBuildCount + 1);
        
        showDialog("The Backyard", "The Shed-Style Treehouse site.", [
            { label: `[1] Build (Need ${reqNails}N, ${reqScrews}S, ${reqLumber}L)`, action: () => {
                if (state.treehouseBuildCount >= 10) {
                    if (state.hasTreehouseCouch && state.hasTreehouseLEDs && state.hasTreehouseTV) {
                        showDialog("YOU WIN!", "You completely finished the Shed-Style Treehouse with all the furniture! Your family is amazed!", [{label:"[1] Play Again", action:()=>location.reload()}]);
                    } else {
                        showDialog("Structure Done!", "The physical treehouse is done. Now you need to install the Couch, TV, and LEDs!", [{label:"[1] Okay", action:()=>{}}]);
                    }
                } else {
                    if (state.nails >= reqNails && state.screws >= reqScrews && state.lumber >= reqLumber) {
                        state.nails -= reqNails; state.screws -= reqScrews; state.lumber -= reqLumber;
                        state.treehouseBuildCount++;
                        applyStatChange("Building", 120, 30, { strength: 10, fun: 10 });
                    } else {
                        showDialog("Not Enough Materials", `You need ${reqNails} Nails, ${reqScrews} Screws, and ${reqLumber} Lumber. Go to Home Depot!`, [{label:"[1] Okay", action:()=>{}}]);
                    }
                }
            }, keepOpen: true},
            { label: '[2] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Sope Creek') {
        let btns = [
            { label: '[1] Study (+Intel)', action: () => applyStatChange("Studying", 180, 40, { intel: 15, fun: -5 }), keepOpen: true }
        ];
        
        btns.push({ label: '[2] Take Target Entrance Exam (Needs 200 INT)', action: () => {
            if (state.intel >= 200) {
                startEntryMath();
            } else {
                showDialog("Not Smart Enough", "You need at least 200 Intelligence to take the Target Entrance Exam.", [{label:"[1] Okay", action:()=>{}}]);
            }
        }, keepOpen: true });
        
        if (state.inTargetProgram) {
            btns.push({ label: '[3] Target Math Question (Double Intel)', action: () => startTargetMath(), keepOpen: true });
            btns.push({ label: '[4] Leave', action: () => {} });
        } else {
            btns.push({ label: '[3] Leave', action: () => {} });
        }
        
        showDialog("Sope Creek Elementary", "Time to learn!", btns);
    } else if (zoneName === 'Grace Marietta') {
        showDialog("Grace Marietta Church", "Head to Sunday School and hang out with friends?", [
            { label: '[1] Go to Church (2 hours)', action: () => { 
                let friends = ["David", "Will", "Joey", "Brian"];
                let friend = friends[Math.floor(Math.random() * friends.length)];
                
                let funBonus = 30;
                let energyBonus = 50;
                let intelBonus = 0;
                
                let events = [];
                let friendRoll = Math.random();
                if (friend === "David" && friendRoll < 0.25) {
                    funBonus += 20;
                    events.push("You played Minecraft with David! (+20 Extra Fun)");
                } else if (friend === "Will" && friendRoll < 0.25) {
                    funBonus += 20;
                    events.push("You played Pokemon with Will! (+20 Extra Fun)");
                } else if (friend === "Joey" && friendRoll < 0.25) {
                    intelBonus += 100;
                    events.push("Joey taught you something smart! (+100 Intelligence)");
                } else if (friend === "Brian" && friendRoll < 0.25) {
                    state.maxEnergy = 200;
                    state.maxEnergyBuffTimer = 24 * 60;
                    events.push("Brian hyped you up! (+100 Max Energy Cap for 24 hours)");
                }
                
                let globalRoll = Math.random();
                if (globalRoll < 0.10) {
                    funBonus = 0;
                    events.push("Will had ridiculous asparagus pee! You lost the fun bonus.");
                } else if (globalRoll >= 0.10 && globalRoll < 0.20) {
                    funBonus = 100;
                    energyBonus -= 20;
                    events.push("David ripped an epic fart! (+100 Fun, -20 Energy)");
                }
                
                let statsMap = { fun: funBonus };
                if (intelBonus > 0) statsMap.intel = intelBonus;
                
                applyStatChange(`Church with ${friend}`, 120, -energyBonus, statsMap);
                
                if (events.length > 0) {
                    setTimeout(() => {
                        showDialog(`Hung out with ${friend}!`, events.join("\n\n"), [{label:"[1] Awesome", action:()=>{}}]);
                    }, 200);
                }
                
            }, keepOpen: true},
            { label: '[2] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Fugu Express') {
        showDialog("Fugu Express", "Welcome! Try to avoid the cheddar cheese and onions today.", [
            { label: '[1] California Roll ($25)', action: () => {
                if(state.dollars >= 25) { 
                    state.dollars -= 25; state.energy = Math.min(state.maxEnergy, state.energy + 50); updateUI(); 
                    showDialog("Yum!", "Ate a California Roll. Restored 50 Energy.", [{label:"[1] Nice", action:()=>{}}]);
                } else showDialog("Insufficient Funds", "You don't have enough.", [{label:"[1] Okay", action:()=>{}}]);
            }, keepOpen: true},
            { label: state.character === 'Asher' ? '[2] Dumplings ($150)' : '[2] Bento Box ($150)', action: () => {
                if(state.dollars >= 150) { 
                    state.dollars -= 150; state.energy = Math.min(state.maxEnergy, state.energy + 100); 
                    if(state.character==='Asher') {
                        state.fun = 100;
                        showDialog("Dumpling Buff!", "Ate Dumplings. +100 Energy, and +100 Fun for the rest of the day!", [{label:"[1] Sweet!", action:()=>{}}]);
                    } else {
                        state.fun = 50;
                        state.hasBentoBonus = true; // Still give the basketball advantage
                        showDialog("Bento Buff!", "Ate Bento Box. +100 Energy, +50 Fun, and basketball is easier today!", [{label:"[1] Sweet!", action:()=>{}}]);
                    }
                    updateUI(); 
                } else showDialog("Insufficient Funds", "You don't have enough dollars.", [{label:"[1] Okay", action:()=>{}}]);
            }, keepOpen: true},
            { label: '[3] Leave', action: () => {} }
        ]);
function openHomeDepotStore() {
    let msg = `You have:\n${state.nails} Nails\n${state.screws} Screws\n${state.lumber} Lumber\n\nWhat would you like to buy?`;
    let updateStore = () => {
        openHomeDepotStore();
    };
    
    showDialog("Home Depot Store", msg, [
        { label: '[1] Buy 5 Nails ($5)', action: () => { if(state.dollars >= 5){ state.dollars -= 5; state.nails+=5; updateUI(); updateStore(); } }, keepOpen: true },
        { label: '[2] Buy 5 Screws ($5)', action: () => { if(state.dollars >= 5){ state.dollars -= 5; state.screws+=5; updateUI(); updateStore(); } }, keepOpen: true },
        { label: '[3] Buy 1 Lumber ($10)', action: () => { if(state.dollars >= 10){ state.dollars -= 10; state.lumber+=1; updateUI(); updateStore(); } }, keepOpen: true },
        { label: '[4] Leave', action: () => {} }
    ]);
}

    } else if (zoneName === 'Home Depot') {
        showDialog("Home Depot", "Going shopping at Home Depot takes 2 hours.", [
            { label: '[1] Go Shopping (2 hours)', action: () => {
                applyStatChange("Drove to Home Depot", 120, 10, { fun: -10 });
                setTimeout(() => {
                    openHomeDepotStore();
                }, 100);
            }, keepOpen: true },
            { label: '[2] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Taj House') {
        showDialog("Rohan & Taj's House", "Knock to see if they can play.", [
            { label: '[1] Knock (30 mins)', action: () => {
                state.clockMinutes += 30;
                state.energy -= 5;
                if(Math.random() < 0.25) {
                    state.companion = Math.random() < 0.5 ? 'Rohan' : 'Taj';
                    state.fun = Math.min(100, state.fun + 50);
                    updateUI();
                    showDialog("Recruited!", `${state.companion} is joining you! +50 Fun!`, [{label:"[1] Let's go!", action:()=>{}}]);
                } else {
                    updateUI();
                    showDialog("No Answer", "They aren't home right now. You wasted 30 minutes knocking.", [{label:"[1] Bummer", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: '[2] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Sports Complex') {
        showDialog("Sports Complex", "Play some ball?", [
            { label: '[1] Basketball Minigame', action: () => startBasketball(), keepOpen: true }, 
            { label: '[2] Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Wilderness') {
        showDialog("Fall Creek Falls", "Hiking trail takes a FULL DAY (12 hours).", [
            { label: '[1] Hike', action: () => applyStatChange("Hiking", 720, 80, { strength: 40, fun: 100 }), keepOpen: true },
            { label: '[2] Leave', action: () => {} }
        ]);
    }
}

// ----------------------------------------------------
// Overworld Rendering
// ----------------------------------------------------
function drawOverworld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Zones
    for(let z of zones) {
        ctx.fillStyle = z.color;
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Verdana';
        ctx.fillText(z.label, z.x + 5, z.y + 20);
        
        if (z.name === 'Treehouse') {
            ctx.font = '12px Verdana';
            ctx.fillText(`Build: ${state.treehouseBuildCount}/10`, z.x + 5, z.y + 45);
            ctx.fillText(`Couch: ${state.hasTreehouseCouch ? 'Yes' : 'No'}`, z.x + 5, z.y + 65);
            ctx.fillText(`TV: ${state.hasTreehouseTV ? 'Yes' : 'No'}`, z.x + 5, z.y + 85);
            ctx.fillText(`LEDs: ${state.hasTreehouseLEDs ? 'Yes' : 'No'}`, z.x + 5, z.y + 105);
        }
    }
    
    // Draw NPCs
    for(let npc of npcs) {
        drawStickFigure(npc.x, npc.y, npc.color);
        ctx.fillStyle = '#fff';
        ctx.fillText(npc.name, npc.x - 15, npc.y - 25);
    }
    
    // Draw Companion
    if(state.companion) {
        // Follow player smoothly
        let cx = state.x - 30; // offset
        let cy = state.y;
        drawStickFigure(cx, cy, '#10b981'); // Green companion
        ctx.fillStyle = '#fff';
        ctx.fillText(state.companion, cx - 15, cy - 25);
    }
    
    // Draw Player
    let playerColor = state.character === 'Asher' ? '#3b82f6' : '#ef4444';
    drawStickFigure(state.x, state.y, playerColor);
    
    // Draw interaction prompt if near zone/npc
    ctx.fillStyle = '#fff';
    ctx.font = '16px Verdana';
    ctx.fillText("WASD to Move. Press 'E' near buildings/people.", 10, 780);
}

function drawStickFigure(x, y, headColor) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    
    // Head
    ctx.beginPath();
    ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
    ctx.fillStyle = headColor;
    ctx.fill();
    ctx.stroke();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x, y + 15);
    // Arms
    ctx.moveTo(x - 10, y + 5);
    ctx.lineTo(x + 10, y + 5);
    // Legs
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x - 8, y + 25);
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x + 8, y + 25);
    ctx.stroke();
}

// ----------------------------------------------------
// Minigame: Math (Sope Creek)
// ----------------------------------------------------
let mathState = { active: false, timer: 0, maxTime: 0, isEntry: false, questionsAnswered: 0, lastTick: 0, a: 0, b: 0, warning: "" };

function startEntryMath() {
    mathState.isEntry = true;
    mathState.questionsAnswered = 0;
    nextMathQuestion();
}

function startTargetMath() {
    mathState.isEntry = false;
    mathState.questionsAnswered = 0;
    nextMathQuestion();
}

function nextMathQuestion() {
    let a, b, timeLimit;
    if (mathState.isEntry) {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        timeLimit = 5;
        mathState.warning = ` (Question ${mathState.questionsAnswered + 1}/3)`;
    } else {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 90) + 10;
        timeLimit = 30;
        mathState.warning = " (WARNING: Wrong answer removes you from Target Program!)";
    }
    mathState.a = a;
    mathState.b = b;
    
    let correct = a * b;
    generateMathOptions(correct, timeLimit);
}

function generateMathOptions(correct, timeLimit) {
    let answers = [correct];
    while(answers.length < 4) {
        let wrong = correct + (Math.floor(Math.random() * 20) - 10);
        if (wrong > 0 && !answers.includes(wrong)) {
            answers.push(wrong);
        }
    }
    // Shuffle
    answers.sort(() => Math.random() - 0.5);
    
    let buttons = answers.map((ans, idx) => {
        return {
            label: `[${idx+1}] ${ans}`,
            action: () => {
                if (!mathState.active) return;
                if (ans === correct) {
                    mathTestSuccess();
                } else {
                    mathTestFailed(false);
                }
            },
            keepOpen: true
        }
    });
    
    gameState = 'MINIGAME_MATH';
    mathState.active = true;
    mathState.timer = timeLimit;
    mathState.maxTime = timeLimit;
    mathState.lastTick = performance.now();
    
    showDialog(`Math Test: Time Left ${timeLimit}s`, `What is ${mathState.a} x ${mathState.b}?${mathState.warning}`, buttons);
}

function mathTestSuccess() {
    mathState.active = false;
    mathState.questionsAnswered++;
    
    if (mathState.isEntry) {
        if (mathState.questionsAnswered >= 3) {
            state.inTargetProgram = true;
            applyStatChange("Math Test Passed!", 60, 10, { fun: 20 });
            setTimeout(() => {
                showDialog("Passed!", "You passed all 3 questions and are now in the Target Program!", [{label:"[1] Sweet", action:()=>{}}]);
            }, 100);
        } else {
            // Next question immediately
            nextMathQuestion();
        }
    } else {
        applyStatChange("Target Math", 180, 40, { intel: 30, fun: 10 });
        setTimeout(() => {
            showDialog("Nailed It!", "Target Math complete. Massive Intelligence boost!", [{label:"[1] Nice", action:()=>{}}]);
        }, 100);
    }
}

function mathTestFailed(isTimeout) {
    mathState.active = false;
    applyStatChange("Math Test Failed", 60, 10, { fun: -10 });
    
    let msg = isTimeout ? "You ran out of time!" : "Wrong answer!";
    
    if (!mathState.isEntry) {
        state.inTargetProgram = false;
        setTimeout(() => {
            showDialog("Failed!", `${msg} You were kicked out of the Target Program!`, [{label:"[1] Dang it", action:()=>{}}]);
        }, 100);
    } else {
        setTimeout(() => {
            showDialog("Failed!", `${msg} Try again later.`, [{label:"[1] Okay", action:()=>{}}]);
        }, 100);
    }
}

// ----------------------------------------------------
// Minigame: Basketball
// ----------------------------------------------------
let bballMeter = 0;
let bballDir = 1;
let bballSpeed = 5;
let bballAnimFrame;

function startBasketball() {
    gameState = 'MINIGAME_BBALL';
    dialogOverlay.classList.add('hidden'); // Ensure dialog hides explicitly
    basketballUI.classList.remove('hidden');
    bballMessage.innerText = "";
    
    // Airless ball makes it slower
    bballSpeed = state.hasAirlessBall ? 3 : 7;
    if (state.hasBentoBonus) bballSpeed *= 0.8;
    
    animateBasketball();
}

function animateBasketball() {
    if (gameState !== 'MINIGAME_BBALL') return;
    
    bballMeter += bballDir * bballSpeed;
    if (bballMeter > 390 || bballMeter < 0) bballDir *= -1;
    
    meterCursor.style.left = `${bballMeter}px`;
    
    // Check input
    if (keys[' ']) {
        keys[' '] = false; // consume input
        // Sweet spot is 180 to 220
        if (bballMeter >= 180 && bballMeter <= 220) {
            bballMessage.innerText = "SWISH! +Strength";
            bballMessage.style.color = "#22c55e";
            setTimeout(() => {
                basketballUI.classList.add('hidden');
                state.y += 10; // bounce back
                applyStatChange("Basketball", 15, 10, { strength: 10 });
            }, 1000);
        } else {
            bballMessage.innerText = "BRICK! Missed.";
            bballMessage.style.color = "#ef4444";
            setTimeout(() => {
                basketballUI.classList.add('hidden');
                state.y += 10; // bounce back
                applyStatChange("Basketball", 15, 10, { strength: 2 });
            }, 1000);
        }
        return;
    }
    
    bballAnimFrame = requestAnimationFrame(animateBasketball);
}

// ----------------------------------------------------
// Minigame: Dog Attack
// ----------------------------------------------------
let dogState = { x: 0, y: 300, isJumping: false, velocityY: 0, obstacles: [], frame: 0, type: 'Beignet', countdown: 3, lastTick: 0 };

function triggerDogAttack() {
    let type = Math.random() > 0.5 ? 'Beignet' : 'Kylo & Finn';
    showDialog("DOG ENCOUNTER!", `Watch out! ${type} is rapidly approaching! Get ready to run!`, [
        { label: 'Prepare to Run', action: () => { startDogCountdown(type); }, keepOpen: true }
    ]);
}

function startDogCountdown(type) {
    gameState = 'MINIGAME_DOG_COUNTDOWN';
    dialogOverlay.classList.add('hidden'); // Manually close since keepOpen is true
    dogUI.classList.remove('hidden');
    
    dogState.type = type;
    dogState.obstacles = [];
    dogState.frame = 0;
    dogState.y = 300;
    dogState.countdown = 3;
    dogState.lastTick = performance.now();
    
    dogMessage.innerText = "Get Ready...";
}

function drawDogCountdown(currentTime) {
    ctx.fillStyle = '#334155'; // Lighter slate color instead of #111
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Floor
    ctx.strokeStyle = '#444';
    ctx.beginPath(); ctx.moveTo(0, 320); ctx.lineTo(1200, 320); ctx.stroke();
    
    let playerColor = state.character === 'Asher' ? '#3b82f6' : '#ef4444';
    drawStickFigure(200, 300, playerColor);
    drawStickFigure(50, 300, dogState.type === 'Beignet' ? '#d97706' : '#991b1b');
    
    // Countdown text
    ctx.fillStyle = '#facc15';
    ctx.font = '80px Verdana';
    ctx.textAlign = 'center';
    
    if (dogState.countdown > 0) {
        ctx.fillText(dogState.countdown, canvas.width/2, 200);
    } else {
        ctx.fillText("GO!", canvas.width/2, 200);
    }
    ctx.textAlign = 'left';
    
    if (currentTime - dogState.lastTick > 1000) {
        dogState.countdown--;
        dogState.lastTick = currentTime;
        if (dogState.countdown < 0) {
            gameState = 'MINIGAME_DOG';
            dogMessage.innerText = `${dogState.type} is chasing you! Jump the fences!`;
        }
    }
}

function drawDogGame() {
    ctx.fillStyle = '#334155'; // Lighter slate color instead of #111
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Verdana';
    ctx.fillText(`${dogState.type} Chase! Press SPACE to jump. Survive 500 frames. Frame: ${dogState.frame}/500`, 20, 40);
    
    // Floor
    ctx.strokeStyle = '#444';
    ctx.beginPath(); ctx.moveTo(0, 320); ctx.lineTo(1200, 320); ctx.stroke();
    
    // Player
    if (keys[' '] && !dogState.isJumping) {
        dogState.isJumping = true;
        dogState.velocityY = state.has3DShoes ? -18 : -15; // 3D shoes jump higher/faster
        keys[' '] = false;
    }
    
    if (dogState.isJumping) {
        dogState.y += dogState.velocityY;
        dogState.velocityY += 1; // gravity
        if (dogState.y >= 300) {
            dogState.y = 300;
            dogState.isJumping = false;
        }
    }
    
    let playerColor = state.character === 'Asher' ? '#3b82f6' : '#ef4444';
    drawStickFigure(200, dogState.y, playerColor);
    
    // Dog (Behind player)
    drawStickFigure(50, 300, dogState.type === 'Beignet' ? '#d97706' : '#991b1b');
    
    // Obstacles
    if (dogState.frame % 80 === 0) {
        dogState.obstacles.push({ x: 1200, width: 20, height: 40 });
    }
    
    let speed = state.has3DShoes ? 10 : 8;
    for (let i = dogState.obstacles.length - 1; i >= 0; i--) {
        let obs = dogState.obstacles[i];
        obs.x -= speed;
        
        ctx.fillStyle = '#a16207'; // Fence color
        ctx.fillRect(obs.x, 320 - obs.height, obs.width, obs.height);
        
        // Collision (Player is roughly at x=200, width=16)
        if (obs.x < 210 && obs.x + obs.width > 190 && dogState.y > 320 - obs.height - 20) {
            // Hit!
            dogUI.classList.add('hidden');
            
            if(dogState.type === 'Beignet') {
                state.energy -= 30;
                showDialog("You Got Caught!", "Beignet ate your lunch! -30 Energy", [{label: "Darn it", action: ()=>{}}]);
            } else {
                state.strength = Math.max(0, state.strength - 20);
                showDialog("You Got Caught!", "Kylo & Finn attacked! -20 Strength", [{label: "Ouch", action: ()=>{}}]);
            }
            updateUI();
            return; // Ends minigame, showDialog naturally switches to DIALOG state, then back to OVERWORLD
        }
    }
    
    dogState.frame++;
    if (dogState.frame > 500) {
        // Win!
        dogUI.classList.add('hidden');
        showDialog("Escaped!", "You managed to outrun the dogs!", [{label: "Phew", action: ()=>{}}]);
        updateUI();
    }
}

// ----------------------------------------------------
// Main Game Loop
// ----------------------------------------------------
function gameLoop(currentTime) {
    if (!isPlaying) return;
    
    const dt = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState === 'OVERWORLD') {
        // Movement
        if (keys.w) state.y -= state.speed;
        if (keys.s) state.y += state.speed;
        if (keys.a) state.x -= state.speed;
        if (keys.d) state.x += state.speed;
        
        // Bounds
        state.x = Math.max(10, Math.min(canvas.width - 10, state.x));
        state.y = Math.max(10, Math.min(canvas.height - 10, state.y));
        
        // Random Dog Encounter (Walking triggers it very rarely)
        if ((keys.w || keys.a || keys.s || keys.d) && Math.random() < 0.001) {
            triggerDogAttack();
        }
        
        // Time & Buff Decay (Real time 1 min = in game 1 hour roughly)
        // Let's manually advance time via actions to keep it simpler and match RPG mechanics, 
        // but we'll decay buffs over frames.
        if (state.dumplingTimer > 0) state.dumplingTimer -= 0.01;
        if (state.companionTimer > 0) {
            state.companionTimer -= 0.01;
            if (state.companionTimer <= 0) {
                showDialog("Companion Left", `${state.companion} went home! You lost your stat multiplier.`, [{label:"Bye!", action:()=>{}}]);
                state.companion = null;
                updateUI();
            }
        }
        
        drawOverworld();
    } else if (gameState === 'MINIGAME_DOG_COUNTDOWN') {
        drawDogCountdown(currentTime);
    } else if (gameState === 'MINIGAME_DOG') {
        drawDogGame();
    } else if (gameState === 'MINIGAME_MATH') {
        if (mathState.active) {
            let now = performance.now();
            let elapsed = (now - mathState.lastTick) / 1000;
            mathState.lastTick = now;
            mathState.timer -= elapsed;
            
            if (mathState.timer <= 0) {
                mathState.timer = 0;
                mathTestFailed(true); // timed out
            } else {
                dialogTitle.innerText = `Math Test: Time Left ${Math.ceil(mathState.timer)}s`;
            }
        }
    }
    // MINIGAME_BBALL and DIALOG are handled via DOM overlays and separate animation loops
    
    requestAnimationFrame(gameLoop);
}
