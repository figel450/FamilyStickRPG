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
const uiTime = document.getElementById('clockDisplay');
const uiEnergy = document.getElementById('energyDisplay');
const uiIntel = document.getElementById('intelDisplay');
const uiStr = document.getElementById('strDisplay');
const uiCraft = document.getElementById('craftDisplay');
const uiBits = document.getElementById('bitsDisplay');
const uiCompanion = document.getElementById('companionDisplay');
const uiTreehouse = document.getElementById('treehouseDisplay');
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
    clockMinutes: 8 * 60, // 8:00 AM
    energy: 100,
    maxEnergy: 100,
    intel: 0,
    strength: 0,
    crafting: 0,
    bits: 50,
    fun: 100,
    
    // Inventory & Progress
    treehousePercent: 0,
    hasAirlessBall: false,
    has3DShoes: false,
    hasBentoBonus: false,
    dumplingTimer: 0,
    
    // Companion
    companion: null, // 'Rohan', 'Taj', or null
    companionTimer: 0,
    
    // Position
    x: 600,
    y: 400,
    speed: 2,
    size: 20
};

const keys = { w: false, a: false, s: false, d: false, ' ': false };

// ----------------------------------------------------
// Zones & Map Data
// ----------------------------------------------------
canvas.width = 1200;
canvas.height = 800;

// Top-left: House, Bottom-left: Downtown, Top-right: School/Church, Bottom-right: Sports/Wilderness
const zones = [
    { name: 'Office', x: 50, y: 50, w: 150, h: 100, color: '#1e3a8a', label: 'Home: Office' },
    { name: 'Garage', x: 50, y: 160, w: 150, h: 100, color: '#475569', label: 'Home: Garage' },
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
        "🏠 Office: Code/Solder (+Intel/Crafting)\n" +
        "🏠 Garage: 3D Print items using Bits\n" +
        "🏠 Treehouse: Spend Bits to build it!\n" +
        "🏫 Sope Creek: Study (+Intel)\n" +
        "⛪ Grace Marietta: Hang out (Heals Energy)\n" +
        "🏙️ GP Center: Work with Dad (+Bits)\n" +
        "🍣 Fugu Express: Buy food (+Energy)\n" +
        "🛠️ Home Depot: Work a shift (+Bits)\n" +
        "🏀 Sports Complex: Play Hoops (+Strength)\n" +
        "🌲 Wilderness: Hike (+Strength, +Bits)\n" +
        "🏠 Taj's House: Recruit a companion for a stat boost!",
        [{label: "Got it!", action: () => {}}]
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
        "Your main objective is to finish the Shed-Style Treehouse in your backyard. \n\nHelp Dad at GP Center to earn Bits, buy materials at Home Depot, and level up your stats at school and the sports complex!\n\nWatch out for neighborhood dogs!", 
        [{label: "Let's Go!", action: () => {}}]
    );

    requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', e => { 
    if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; 
    if(e.key === 'e' || e.key === 'E') handleInteraction();
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

function updateUI() {
    uiTime.innerText = formatTime(state.clockMinutes);
    uiEnergy.innerText = Math.floor(state.energy);
    uiIntel.innerText = state.intel;
    uiStr.innerText = state.strength;
    uiCraft.innerText = state.crafting;
    uiBits.innerText = state.bits;
    
    uiCompanion.innerText = state.companion || 'None';
    uiTreehouse.innerText = `${state.treehousePercent}%`;
    
    let items = [];
    if(state.hasAirlessBall) items.push('Airless Ball');
    if(state.has3DShoes) items.push('3D Shoes');
    uiItems.innerText = items.length > 0 ? items.join(', ') : 'None';
}

function showDialog(title, text, buttons) {
    gameState = 'DIALOG';
    dialogTitle.innerText = title;
    dialogText.innerText = text;
    dialogButtons.innerHTML = '';
    
    // Reset movement keys so we don't sprint off after closing
    keys.w = false; keys.a = false; keys.s = false; keys.d = false;
    
    buttons.forEach(btn => {
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

function applyStatChange(actionName, timeCost, energyCost, statsMap) {
    state.clockMinutes += timeCost;
    state.energy -= energyCost;
    
    let multiplier = (state.companion) ? 1.5 : 1;
    if (state.dumplingTimer > 0) multiplier += 0.5;
    
    let resultText = `Time spent: ${timeCost} mins.\nEnergy used: ${energyCost}.\n`;
    if (multiplier > 1) {
        resultText += `(Bonus Multiplier Active: ${multiplier}x!)\n`;
    }
    
    for(let [stat, val] of Object.entries(statsMap)) {
        let finalVal = Math.floor(val * multiplier);
        state[stat] += finalVal;
        resultText += `+${finalVal} ${stat.charAt(0).toUpperCase() + stat.slice(1)}! \n`;
    }
    
    if (state.energy < 0) state.energy = 0;
    if (state.energy > state.maxEnergy) state.energy = state.maxEnergy;
    
    updateUI();
    
    // Show explicit result popup
    showDialog(`${actionName} Complete!`, resultText, [{label: "Awesome!", action: ()=>{}}]);
    
    if(state.energy === 0) {
        setTimeout(() => {
            showDialog("Passed Out!", "You ran out of energy. Mom found you and carried you to bed. It's a new day.", [
                { label: 'Wake Up', action: () => { state.energy = state.maxEnergy; state.clockMinutes += 480; updateUI(); } }
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
                showDialog("Mom (Kim)", "Make sure you guys aren't staying up too late! Here, have a snack.", [
                    { label: 'Thanks Mom! (Heal)', action: () => { 
                        state.energy = state.maxEnergy; 
                        updateUI(); 
                        showDialog("Feeling Great", "Mom's snacks fully restored your Energy!", [{label:"OK", action:()=>{}}]);
                    }, keepOpen: true } // keepOpen true so the second dialog handles the state change
                ]);
                return;
            } else if (npc.name === 'Dad') {
                showDialog("Dad (Kyle)", "I need some help testing this Fusion 360 algorithm. Can you run some scripts?", [
                    { label: 'Help Dad (-20 Energy, +50 Bits)', action: () => {
                        applyStatChange("Testing Code", 60, 20, { bits: 50 });
                    }, keepOpen: true },
                    { label: 'Not right now', action: () => {} }
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
    if (zoneName === 'Office') {
        const actionStr = state.character === 'Elliot' ? 'Solder Circuits (+Crafting)' : 'Play Minecraft (+Intel)';
        const stat = state.character === 'Elliot' ? { crafting: 5 } : { intel: 5 };
        
        showDialog("Home Office", "The L-shaped pine desk and midnight blue walls make this a great place to focus.", [
            { label: actionStr, action: () => applyStatChange(state.character==='Elliot'?"Soldering":"Minecraft", 60, 15, stat), keepOpen: true },
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Garage') {
        showDialog("Tech Station", "The Bambu X1C 3D Printer is humming.", [
            { label: 'Craft Airless Basketball (200 Bits)', action: () => {
                if(state.bits >= 200) { 
                    state.bits -= 200; state.hasAirlessBall = true; updateUI(); 
                    showDialog("Crafting Success!", "You printed an Airless Basketball! The sports minigame will now be easier.", [{label:"Sweet!", action:()=>{}}]);
                } else {
                    showDialog("Insufficient Funds", "You don't have enough bits.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Craft 3D Shoes (300 Bits)', action: () => {
                if(state.bits >= 300) { 
                    state.bits -= 300; state.has3DShoes = true; updateUI(); 
                    showDialog("Crafting Success!", "You printed 3D Shoes! You will run faster and jump higher when dogs chase you.", [{label:"Sweet!", action:()=>{}}]);
                } else {
                    showDialog("Insufficient Funds", "You don't have enough bits.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Treehouse') {
        showDialog("The Backyard", "The Shed-Style Treehouse site.", [
            { label: 'Build (Needs 50 Bits of Materials)', action: () => {
                if(state.bits >= 50 && state.treehousePercent < 100) {
                    state.bits -= 50;
                    state.treehousePercent += 10;
                    if(state.treehousePercent >= 100) {
                        showDialog("CONGRATULATIONS!", "You finished building the massive Shed-Style Treehouse! Your family is proud of you.", [{label:"Woohoo!", action:()=>{}}]);
                    } else {
                        applyStatChange("Building", 120, 30, { crafting: 10 });
                    }
                } else if (state.treehousePercent >= 100) {
                    showDialog("It's Done", "The treehouse is already finished. Good job!", [{label:"Okay", action:()=>{}}]);
                } else {
                    showDialog("Insufficient Funds", "You need 50 Bits to buy more materials from Home Depot.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Sope Creek') {
        showDialog("Sope Creek Elementary", "Time to learn!", [
            { label: 'Study (+Intel)', action: () => applyStatChange("Studying", 180, 40, { intel: 15 }), keepOpen: true },
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Grace Marietta') {
        showDialog("Grace Marietta Church", "Will and David are here! Hanging out restores energy fully and gives fun.", [
            { label: 'Hang out (Heal)', action: () => { 
                state.energy = state.maxEnergy; 
                applyStatChange("Hanging Out", 60, 0, { fun: 50 }); 
            }, keepOpen: true },
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Fugu Express') {
        showDialog("Fugu Express", "Welcome! Try to avoid the cheddar cheese and onions today.", [
            { label: 'California Roll (50 Bits)', action: () => {
                if(state.bits >= 50) { 
                    state.bits -= 50; state.energy += 50; updateUI(); 
                    showDialog("Yum!", "Ate a California Roll. Restored 50 Energy.", [{label:"Nice", action:()=>{}}]);
                } else {
                    showDialog("Insufficient Funds", "You don't have enough bits.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: state.character === 'Asher' ? 'Dumplings (75 Bits)' : 'Bento Box (75 Bits)', action: () => {
                if(state.bits >= 75) { 
                    state.bits -= 75; state.energy += 70; 
                    if(state.character==='Asher') {
                        state.dumplingTimer = 240; 
                        showDialog("Dumpling Buff!", "Ate Dumplings. +70 Energy, and you have a massive stat-gain multiplier for the next 4 hours!", [{label:"Sweet!", action:()=>{}}]);
                    } else {
                        state.hasBentoBonus = true;
                        showDialog("Bento Buff!", "Ate Bento Box. +70 Energy, and the basketball minigame will permanently be slower and easier!", [{label:"Sweet!", action:()=>{}}]);
                    }
                    updateUI(); 
                } else {
                    showDialog("Insufficient Funds", "You don't have enough bits.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Mystery Roll (10 Bits)', action: () => {
                if(state.bits >= 10) {
                    state.bits -= 10;
                    if(Math.random() > 0.5) {
                        state.energy -= 30; // Cheese/Onions!
                        showDialog("Yuck!", "Diced onions and cheddar cheese! Lost 30 Energy.", [{label:"Gross", action:()=>{}}]);
                    } else {
                        state.energy += 40;
                        showDialog("Lucky!", "It was delicious! Gained 40 Energy.", [{label:"Nice", action:()=>{}}]);
                    }
                    updateUI();
                } else {
                    showDialog("Insufficient Funds", "You don't have enough bits.", [{label:"Okay", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Home Depot') {
        showDialog("Home Depot", "Buy materials for projects or work a shift.", [
            { label: 'Work a shift (+Money)', action: () => applyStatChange("Working", 180, 50, { bits: 100 }), keepOpen: true },
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Taj House') {
        showDialog("Rohan & Taj's House", "Knock to see if they can play.", [
            { label: 'Knock (30 mins)', action: () => {
                state.clockMinutes += 30;
                state.energy -= 5;
                if(Math.random() < 0.25) {
                    state.companion = Math.random() < 0.5 ? 'Rohan' : 'Taj';
                    state.companionTimer = 300; // 5 hours
                    updateUI();
                    showDialog("Recruited!", `${state.companion} is joining you! For the next 5 hours, you get a 50% stat boost on all activities!`, [{label:"Let's go!", action:()=>{}}]);
                } else {
                    updateUI();
                    showDialog("No Answer", "They aren't home right now. You wasted 30 minutes knocking.", [{label:"Bummer", action:()=>{}}]);
                }
            }, keepOpen: true},
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Sports Complex') {
        showDialog("Sports Complex", "Play some ball?", [
            { label: 'Basketball Minigame', action: () => startBasketball(), keepOpen: true }, // Keep dialog open so startBasketball handles state transition properly!
            { label: 'Leave', action: () => {} }
        ]);
    } else if (zoneName === 'Wilderness') {
        showDialog("Fall Creek Falls", "Hiking trail.", [
            { label: 'Hike (+Str, +Fun)', action: () => applyStatChange("Hiking", 240, 60, { strength: 20, fun: 30, bits: 20 }), keepOpen: true },
            { label: 'Leave', action: () => {} }
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
    ctx.fillStyle = '#111';
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
    ctx.fillStyle = '#111';
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
    }
    // MINIGAME_BBALL and DIALOG are handled via DOM overlays and separate animation loops
    
    requestAnimationFrame(gameLoop);
}
