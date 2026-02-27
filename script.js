const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
let players = [];
let currentPlayerIndex = 0;

let Fixed1;
let Fixed2;

const MAX_TURNS = 5;
const ENERGY_DECREASE_PER_ROLL = 20;

let countdownInterval = null;
let timeLeft = 20;


function startGame() {
    const inputs = document.querySelectorAll(".player-input");
    const players = [];

    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            players.push(input.value.trim());
        }
    });

    if (players.length < 2) {
        document.getElementById("error").innerText = "Enter all player names!";
        return;
    }

    localStorage.setItem("players", JSON.stringify(players));

    window.location.href = "game.html";
}

function initGame() {
    const storedPlayers = JSON.parse(localStorage.getItem("players"));
    if (!storedPlayers || storedPlayers.length < 2) {
        window.location.href = "index.html";
        return;
    }

    players = storedPlayers.map(name => ({
        name,
        stage: 0,
        energy: 100,
        turns: 0
    }));

    const playersContainer = document.getElementById("playersContainer");
    playersContainer.innerHTML = "";
    players.forEach((player, index) => {
        const playerCard = document.createElement("div");
        playerCard.classList.add("player-card");
        playerCard.id = `player${index}Card`;
        playerCard.innerHTML = `
            <h3>${player.name}</h3>
            <div class="energy-bar">
                <div class="energy-progress" id="player${index}Progress" style="width: ${player.energy}%"></div>
            </div>
            <table id="player${index}Table" class="player-table">
                <thead>
                    <tr><th>Turn</th><th>Roll</th><th>Status</th></tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        playersContainer.appendChild(playerCard);
    });

    Fixed1 = random();
    do {
        Fixed2 = random();
    } while (Fixed2 === Fixed1);

    document.getElementById("dice1").innerText = diceFaces[Fixed1];
    document.getElementById("dice2").innerText = diceFaces[Fixed2];

    updateHighlight();
    startRollTimer();
    updateEnergyBars();
}

function rollDice() {
    clearInterval(countdownInterval);
    const diceEl = document.getElementById("rollingDice");
    const finalRoll = random();
    let rollingTime = 0;

    const animation = setInterval(() => {
        diceEl.innerText = diceFaces[random()];
        rollingTime += 100;

        if (rollingTime >= 1000) {
            clearInterval(animation);
            diceEl.innerText = diceFaces[finalRoll];
            handleRoll(finalRoll, currentPlayerIndex);
        }
    }, 100);
}

function handleRoll(roll, playerIndex) {
    const player = players[playerIndex];
    const tableId = `player${playerIndex}Table`;

    if (player.stage === 0) {
        if (roll === Fixed1) {
            addToTable(tableId, player.turns + 1, diceFaces[roll], "Matched ✅");
            player.stage = 1;
        } else {
            addToTable(tableId, player.turns + 1, diceFaces[roll], "No Match ❌");
        }
        player.turns++;        
        decreaseEnergy(player); 
        if (player.stage === 0) nextPlayer(); 
    } else if (player.stage === 1) {
        if (roll === Fixed2) {
            addToTable(tableId, "Bonus", diceFaces[roll], "🏆 WIN");
            finishGame(player.name);
            return;
        } else {
            addToTable(tableId, "Bonus", diceFaces[roll], "No Match Dice2 ❌");
            player.stage = 0;
            nextPlayer(); 
        }
   
    }

    updateEnergyBars(); 
    updateHighlight();

    if (!document.getElementById("winnerScreen").style.display.includes("flex")) {
        checkMaxTurns();
        startRollTimer();
    }
}

function nextPlayer() {
    let foundNext = false;
    const totalPlayers = players.length;
    for (let i = 1; i <= totalPlayers; i++) {
        let nextIndex = (currentPlayerIndex + i) % totalPlayers;
        if (players[nextIndex].turns < MAX_TURNS) {
            currentPlayerIndex = nextIndex;
            foundNext = true;
            break;
        }
    }
    if (!foundNext) {
        checkMaxTurns(true);
    }
}

function decreaseEnergy(player) {
    player.energy -= ENERGY_DECREASE_PER_ROLL;
    if (player.energy < 0) player.energy = 0;
}


function updateEnergyBars() {
    players.forEach((player, index) => {
        const bar = document.getElementById(`player${index}Progress`);
        if (bar) {
            bar.style.width = player.energy + "%";
        }
    });
}

function checkMaxTurns(force = false) {
    if (force || players.every(p => p.turns >= MAX_TURNS)) {
        if (!document.getElementById("drawScreen").classList.contains("active") &&
            !document.getElementById("winnerScreen").classList.contains("active")) {
            finishDraw();
        }
    }
}

function finishGame(winner) {
    saveLeaderboard(`${winner} wins`);
    const winnerScreen = document.getElementById("winnerScreen");
    document.getElementById("winnerText").innerText = `🏆 ${winner} Wins!`;
    winnerScreen.classList.add("active");
    clearInterval(countdownInterval);
}

function finishDraw() {
    players.forEach(p => p.energy = 0);
    updateEnergyBars();
    saveLeaderboard("Game Draw");
    const drawScreen = document.getElementById("drawScreen");
    drawScreen.classList.add("active");
    clearInterval(countdownInterval);
}


function addToTable(tableId, turn, roll, status) {
    const tableBody = document.getElementById(tableId)?.querySelector("tbody");
    if (!tableBody) return;
    const row = document.createElement("tr");
    row.innerHTML = `<td>${turn}</td><td>${roll}</td><td>${status}</td>`;
    tableBody.appendChild(row);
}

function saveLeaderboard(result) {
    let today = new Date().toDateString();
    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];
    history.unshift({
        players: players.map(p => p.name).join(", "),
        result,
        date: today
    });
    localStorage.setItem("leaderboard", JSON.stringify(history));
}

function loadLeaderboard() {
    const tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let today = new Date().toDateString();
    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];
    let todayGames = history.filter(game => game.date === today);

    todayGames.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${game.players}</td><td>${game.result}</td>`;
        tbody.appendChild(row);
    });
}


function startRollTimer() {
    clearInterval(countdownInterval);
    timeLeft = 20;
    const timerEl = document.getElementById("timer");
    timerEl.innerText = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            rollDice();
        }
    }, 1000);
}

function random() {
    return Math.floor(Math.random() * 6);
}

function goHome() {
    window.location.href = "index.html";
}

function updateHighlight() {
    players.forEach((player, index) => {
        const card = document.getElementById(`player${index}Card`);
        if (!card) return;
        if (index === currentPlayerIndex) {
            card.classList.add("player-active");
        } else {
            card.classList.remove("player-active");
        }
    });
}