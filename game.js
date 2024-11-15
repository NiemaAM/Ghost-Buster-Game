const gridWidth = 13;
const gridHeight = 8;

let selectedCell = null;
const clickedCells = []; // Cells clicked by the player
let ghostPosition;

let ghosts = 1;
let busts = 2;
let score = 50;
let endgame = false;
let isView = false; // hide/show the probabilities

const G = []; // Ghost location domain
for (let y = 0; y < gridHeight; y++) {for (let x = 0; x < gridWidth; x++) {G.push({ x, y });}} //initialize the domain with all cells positions
const S = ['red', 'orange', 'yellow', 'green']; // Sensor reading domain
const P = {'red': 0.6500, 'orange': 0.20, 'yellow': 0.10, 'green': 0.050}; // Conditional probability distributions P(Color | Distance from Ghost)
let probabilities = Array(gridHeight).fill().map(() => Array(gridWidth).fill(1 / (gridWidth * gridHeight)));

// Initialize the game
function initializeGame() {
    const grid = document.getElementById('gameGrid');
    document.getElementById('endGameScreen').style.display = 'none'; 
    grid.innerHTML = '';
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.onclick = () => selectCell(x, y);
            grid.appendChild(cell);
        }
    }
    placeGhost();
    updateDisplay();
}

// Place the ghost randomly
/* PlaceGhost() returns xg, yg */
function placeGhost() {
    const random = Math.floor(Math.random() * G.length); //take a randome position from the domain G
    const xg = G[random].x;
    const yg = G[random].y;
    return ghostPosition = { xg, yg };
}

// Update the display
function updateDisplay() {
    document.getElementById('ghosts').textContent = ghosts;
    document.getElementById('score').textContent = score;
    document.getElementById('busts').textContent = busts;
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        cell.textContent = probabilities[y][x].toFixed(2);
        if (!isView) {
            cell.style.color = 'transparent';
        } else {
            cell.style.color = 'black';
        }
    });
}

// Handle cell selection
function selectCell(x, y) {
    if (!endgame)
    if (score > 0){
        score -= 1; 
        selectedCell = { x, y };
        const cells = document.querySelectorAll('.cell');
        cells.forEach(c => c.classList.remove('selected')); // Remove previous selection
        const cell = document.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
        cell.classList.add('selected'); // Highlight the selected cell
        // Enable the Bust & Time button when a cell is selected
        document.getElementById('bustButton').disabled = false;
        //document.getElementById('timeButton').disabled = false;
        // Perform sensor reading and update display
        sensorReading(x, y);
        updateDisplay();
    } else {
        document.getElementById('messages').innerHTML += "Game Over!<br>";
        // End the game
        endgame = true;
        document.getElementById('endGameScreen').style.display = 'flex'; 
        document.getElementById('endGameMessage').innerHTML = "Game Over!";
        // Disable buttons
        document.getElementById('bustButton').disabled = true;
        //document.getElementById('timeButton').disabled = true;
        // Show solution
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                sensorReading(x,y);
            }
        }
    }
}

// Handle bust button
function bust() {
    busts -= 1;  // Deduct a bust
    if (score > 0)
    if (selectedCell && ghostPosition.xg === selectedCell.x && ghostPosition.yg === selectedCell.y) {
        ghosts -= 1; // Reduce remaining ghosts
        document.getElementById('messages').innerHTML += "You busted the ghost!<br>";
        document.getElementById('endGameScreen').style.display = 'flex'; 
        document.getElementById('endGameMessage').innerHTML = "You busted the ghost!";
        // End the game
        endgame = true;
        // Trigger confetti
        confetti({
            particleCount: 300,
            spread: 100,
            origin: { y: 0.6 },
            decay: 0.94,
            startVelocity: 30,
        });
    } else {
        score -= 5; // Deduct score for wrong guess
        document.getElementById('messages').innerHTML += "Wrong guess!<br>";
        // Game over case (no more busts)
        if (busts <= 0 || score === 0) {
            document.getElementById('messages').innerHTML += "Game Over!<br>";
            document.getElementById('endGameScreen').style.display = 'flex'; 
            document.getElementById('endGameMessage').innerHTML = "Game Over!";
            // End the game
            endgame = true;
        }  
    }
    if (endgame){
        // Disable buttons
        document.getElementById('bustButton').disabled = true;
        //document.getElementById('timeButton').disabled = true;
        // Show solution
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                sensorReading(x,y);
            }
        }
    }
    document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    updateDisplay();
}

// Handle time button
/* 
function time() {
    score += 1; // Add points to the score
    document.getElementById('messages').innerHTML += "Time added!<br>";
    document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    updateDisplay();
}
*/

// Handle view button
function view() {
    isView = !isView;
    updateDisplay();
}

//Handle new Game button
function newGame(){
    location.reload(); 
}

// ComputeInitialPriorProbabilities(locations)
function ComputeInitialPriorProbabilities(locations) { //TODO: what is locations?
    const totalCells = gridWidth * gridHeight;
    probabilities = Array(gridHeight).fill().map(() => Array(gridWidth).fill(1 / totalCells));
}

// Separate conditional distribution tables for colors per distance
/* DistanceSense (xclk,yclk, dist, xg,yg) returns a color based on 
(i) the type of distance dist of the clicked position (xclk,yclk) from the ghost position (gs,yg) 
(ii) the conditional probability tables. 
For this you will have to sample the appropriate cond. distribution table to return the color.*/
function DistanceSense(xclk, yclk, dist, xg, yg) {
    dist = Math.abs(xclk - xg) + Math.abs(yclk - yg);
    if (dist === 0) return S[0];
    if (dist <= 2) return S[1];
    if (dist <= 4) return S[2];
    return S[3];
}

// Sensor reading: display color based on distance
function sensorReading(x, y) {
    const color =  DistanceSense(x, y, 0, ghostPosition.xg, ghostPosition.yg);
    // Display the color on the clicked cell
    const cell = document.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
    cell.style.backgroundColor = color;
    cell.style.borderColor = color;
    UpdatePosteriorGhostLocationProbabilities(color, x, y); 
    // Display the sensor reading with the color and the probability value
    if (!endgame)
        document.getElementById('messages').innerHTML += `<span style="background-color: ${color.toLowerCase()}">sensor at (${x}, ${y}) [${color}]</span><br>`;
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
}

// Update probabilities using Bayesian inference
/* UpdatePosteriorGhostLocationProbabilities(Color: c, xclk,yclk). 
updates the probabilities for each location based on the color c obtained/sensed at position xclk, yclk*/
function UpdatePosteriorGhostLocationProbabilities(c, xclk, yclk) {
    /* After each click number t in {1, 2, 3 …} at location Li the Posterior Probability of the Ghost locations 
    Pt(G = Li) should be updated using Bayesian inference as follows:
    Pt(G = Li) = P(S = Color at location Li | G = Li) * Pt-1(G = Lj)
    With P0(G = Lj) is a uniform distribution (Initial prior probability)
    And P(S = Color at location Li | G = Li) = P(S = Color | distance = 0).*/
    let totalProbability = 0;
    clickedCells.push({ xclk, yclk }); // add the new clicked cell to the list of clicked cells

    if (c === 'red'){ // the ghost is in the selected cell
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] = (y === yclk && x === xclk) ? 1 : 0;
            }
        }
    } else { // the ghost is not in the selected cell
        probabilities[yclk][xclk] = 0;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color = DistanceSense(x, y, 0, ghostPosition.xg, ghostPosition.yg); //return a specific color for each cell
                probabilities[y][x] *= (color === c) ? P[c] : (1 - P[c]);
                totalProbability += probabilities[y][x];
            }
        }
        // Normalize the probabilities so that the sum of all probabilities is 1
        /* You will need to normalize all the probabilities of the other locations, 
        after each update of the posteriori probability of the clicked position Li*/
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] /= totalProbability; // Normalize each probability
            }
        }
    }
}

// Update probabilities using Bayesian inference
/* UpdatePosteriorGhostLocationProbabilities(Color: c, xclk, yclk)
updates the probabilities for each location based on the color c obtained/sensed at position xclk, yclk */
function UpdatePosteriorGhostLocationProbabilities(c, xclk, yclk) {
    /* After each click number t in {1, 2, 3 …} at location Li the Posterior Probability of the Ghost locations 
    Pt(G = Li) should be updated using Bayesian inference as follows:
    Pt(G = Li) = P(S = Color at location Li | G = Li) * Pt-1(G = Lj)
    With P0(G = Lj) as a uniform distribution (Initial prior probability)
    And P(S = Color at location Li | G = Li) = P(S = Color | distance = 0).*/
    let totalProbability = 0;
    clickedCells.push({ xclk, yclk }); // Add the new clicked cell to the list of clicked cells

    if (c === 'red') { // The ghost is in the selected cell
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] = (y === yclk && x === xclk) ? 1 : 0;
            }
        }
    } else { // The ghost is not in the selected cell
        probabilities[yclk][xclk] = 0;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const distance = Math.abs(x - xclk) + Math.abs(y - yclk);
                // Set probability to 0 for cells surrounding green or yellow cells
                if ((c === 'green' && distance <= 4) || (c === 'yellow' && distance >= 5) || (c === 'orange' && distance >=3)) {
                    probabilities[y][x] = 0;
                } else {
                    probabilities[y][x] *= 1 - P[c];
                    totalProbability += probabilities[y][x];
                }
            }
        }

        // Normalize the probabilities so that the sum of all probabilities is 1
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] /= totalProbability; // Normalize each probability
            }
        }
    }
}


// Initialize the game on load
window.onload = initializeGame;
