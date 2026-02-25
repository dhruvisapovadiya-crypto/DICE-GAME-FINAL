const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 1;

let p1Fixed;
let p2Fixed;

let player1Name = "";
let player2Name = "";

let p1Turns = 0;
let p2Turns = 0;

const MAX_TURNS = 5;

let countdownInterval = null;
let timeLeft = 20;

let p1Stage = 0;
let p2Stage = 0;

let p1Energy = 100;
let p2Energy = 100;
const ENERGY_DECREASE_PER_ROLL = 20;

function startGame() {
    playGame();
}

function playGame() {

    let p1 = document.getElementById("p1").value.trim();
    let p2 = document.getElementById("p2").value.trim();
    let error = document.getElementById("error");
    let regex = /^[A-Za-z]+$/;

    error.innerText = "";

    if (p1 === "") {
        error.innerText = "Player1 Name cannot be empty";
        return;
    }
    if (p2 === "") {
        error.innerText = "Player2 Name cannot be empty";
        return;
    }
    if (!regex.test(p1)) {
        error.innerText = "Only alphabets allowed";
        return;
    }
    if (!regex.test(p2)) {
        error.innerText = "Only alphabets allowed";
        return;
    }
    if (p1.toLowerCase() === p2.toLowerCase()) {
        error.innerText = "Names cannot be same";
        return;
    }

    localStorage.setItem("player1Name", p1);
    localStorage.setItem("player2Name", p2);

    window.location.href = "game.html";
}

function initGame() {

    player1Name = localStorage.getItem("player1Name");
    player2Name = localStorage.getItem("player2Name");

    if (!player1Name || !player2Name) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("p1Name").innerText = player1Name;
    document.getElementById("p2Name").innerText = player2Name;

    p1Fixed = random();
    do {
        p2Fixed = random();
    } while (p2Fixed === p1Fixed);

    document.getElementById("dice1").innerText = diceFaces[p1Fixed];
    document.getElementById("dice2").innerText = diceFaces[p2Fixed];

    updateHighlight();
    startRollTimer();
    updateEnergyBars();
}

function rollDice() {
    clearInterval(countdownInterval);
    const diceEl = document.getElementById("rollingDice");
    let finalRoll = random();
    let rollingTime = 0;

    const animation = setInterval(() => {
        diceEl.innerText = diceFaces[random()];
        rollingTime += 100;

        if (rollingTime >= 1000) {
            clearInterval(animation);
            diceEl.innerText = diceFaces[finalRoll];

            if (currentPlayer === 1 && p1Turns < MAX_TURNS)
                handleRoll(finalRoll, "p1");
            else if (currentPlayer === 2 && p2Turns < MAX_TURNS)
                handleRoll(finalRoll, "p2");
        }

    }, 100);
}

function handleRoll(roll, player) {

    const isP1 = player === "p1";
    const firstFixed = p1Fixed;
    const secondFixed = p2Fixed;
    const playerName = isP1 ? player1Name : player2Name;
    const tableId = isP1 ? "p1Table" : "p2Table";
    let turnNumber = isP1 ? p1Turns + 1 : p2Turns + 1;
    let stage = isP1 ? p1Stage : p2Stage;

    if (stage === 0) {
        if (roll === firstFixed) {
            addToTable(tableId, turnNumber, diceFaces[roll], "Matched ✅");
            if (isP1) p1Stage = 1; else p2Stage = 1;

            startRollTimer();
            return;
        }
        addToTable(tableId, turnNumber, diceFaces[roll], " No Match ❌");
        if (isP1) {
            p1Turns++;
            currentPlayer = 2;
        } else {
            p2Turns++;
            currentPlayer = 1;
        }
        decreaseEnergy(isP1);
        updateHighlight();
        checkMaxTurns();
        startRollTimer();
        return;
    }
    if (stage === 1) {
        if (roll === secondFixed) {
            addToTable(tableId, "Bonus", diceFaces[roll], "🏆 WIN");
            finishGame(playerName);
            return;
        }

        addToTable(tableId, "Bonus", diceFaces[roll], "No Match Dice2❌");
        if (isP1) {
            p1Stage = 0;
            p1Turns++;
            currentPlayer = 2;
        } else {
            p2Stage = 0;
            p2Turns++;
            currentPlayer = 1;
        }

        updateHighlight();
        checkMaxTurns();
        startRollTimer();
        return;
    }
}

function decreaseEnergy(isP1) {
    if (isP1) {
        p1Energy -= ENERGY_DECREASE_PER_ROLL;
        if (p1Energy < 0) {
            p1Energy = 0;
        }
    } else {
        p2Energy -= ENERGY_DECREASE_PER_ROLL;
        if (p2Energy < 0) {
            p2Energy = 0;
        }
    }
    updateEnergyBars();
}

function updateEnergyBars() {
    document.getElementById("p1Progress").style.width = p1Energy + "%";
    document.getElementById("p2Progress").style.width = p2Energy + "%";
}

function checkMaxTurns() {
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        finishDraw();
    }
}

function addToTable(tableId, turn, roll, status) {
    const table = document.getElementById(tableId);
    const row = document.createElement("tr");
    row.innerHTML = `<td>${turn}</td><td>${roll}</td><td>${status}</td>`;
    table.appendChild(row);
}

function updateEnergyBars() {
    document.getElementById("p1Progress").style.width = p1Energy + "%";
    document.getElementById("p2Progress").style.width = p2Energy + "%";
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

function finishGame(winner) {
    saveLeaderboard(winner);
    document.getElementById("winnerText").innerText = `🏆 ${winner} Wins!`;
    document.getElementById("winnerScreen").style.display = "flex";
    clearInterval(countdownInterval);
}

function finishDraw() {
    saveLeaderboard("Draw");
    document.getElementById("drawScreen").style.display = "flex";
    clearInterval(countdownInterval);
}

function saveLeaderboard(result) {
    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];
    history.push({ player1: player1Name, player2: player2Name, result });
    localStorage.setItem("leaderboard", JSON.stringify(history));
}

function loadLeaderboard() {
    const tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${game.player1}</td>
            <td>${game.player2}</td>
            <td>${game.result}</td>
        `;
        tbody.appendChild(row);
    });
}

function random() {
    return Math.floor(Math.random() * 6);
}

function goHome() {
    window.location.href = "index.html";
}

function updateHighlight() {

    const p1Box = document.getElementById("p1Card");
    const p2Box = document.getElementById("p2Card");
    const turn1 = document.getElementById("turn1");
    const turn2 = document.getElementById("turn2");

    if (currentPlayer === 1) {
        p1Box.classList.add("player-active");
        p2Box.classList.remove("player-active");
        turn1.style.display = "inline";
        turn2.style.display = "none";
    } else {
        p2Box.classList.add("player-active");
        p1Box.classList.remove("player-active");
        turn2.style.display = "inline";
        turn1.style.display = "none";
    }
}