// 1. Select the HTML elements
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status-text');
const resetButton = document.getElementById('reset-button');

// Select Mode & Difficulty Panel Elements
const btnPvp = document.getElementById('btn-pvp');
const btnPvc = document.getElementById('btn-pvc');
const difficultyPanel = document.getElementById('difficulty-panel');
const btnEasy = document.getElementById('btn-easy');
const btnImpossible = document.getElementById('btn-impossible');

// 2. Set up the Game State (The Brain)
let board = [null, null, null, null, null, null, null, null, null];
let currentPlayer = 'X';
let isGameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'pvc'
let difficulty = 'easy'; // 'easy' or 'impossible'
let isAiThinking = false; // Lock interactions during AI calculation

// 3. Define the Win Conditions (The Rules)
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// 4. Initialize the Event Listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetButton.addEventListener('click', resetGame);

// Mode & Difficulty Toggle Listeners
btnPvp.addEventListener('click', () => {
    if (gameMode !== 'pvp') {
        gameMode = 'pvp';
        btnPvp.classList.add('active');
        btnPvc.classList.remove('active');
        difficultyPanel.classList.add('hidden');
        resetGame();
    }
});

btnPvc.addEventListener('click', () => {
    if (gameMode !== 'pvc') {
        gameMode = 'pvc';
        btnPvc.classList.add('active');
        btnPvp.classList.remove('active');
        difficultyPanel.classList.remove('hidden');
        resetGame();
    }
});

btnEasy.addEventListener('click', () => {
    if (difficulty !== 'easy') {
        difficulty = 'easy';
        btnEasy.classList.add('active');
        btnImpossible.classList.remove('active');
        resetGame();
    }
});

btnImpossible.addEventListener('click', () => {
    if (difficulty !== 'impossible') {
        difficulty = 'impossible';
        btnImpossible.classList.add('active');
        btnEasy.classList.remove('active');
        resetGame();
    }
});

// 5. Core Game Logic
function handleCellClick(event) {
    const clickedCell = event.target;
    // Get the index as an integer
    const cellIndex = parseInt(clickedCell.getAttribute('data-index'));

    // If the cell is already taken, game is over, or AI is thinking, do nothing
    if (board[cellIndex] !== null || !isGameActive || isAiThinking) {
        return;
    }

    makeMove(cellIndex, currentPlayer);
}

function makeMove(cellIndex, player) {
    // Update the array state
    board[cellIndex] = player;

    // Update the visual board
    const clickedCell = cells[cellIndex];
    clickedCell.innerText = player;
    clickedCell.classList.add(player.toLowerCase());

    // Check if this move resulted in a win or draw
    const gameResult = checkWinState(board);

    if (gameResult.status === 'win') {
        statusText.innerText = `Player ${player} Wins!`;
        highlightWinningCells(gameResult.line);
        isGameActive = false; // Stop further clicks
        return;
    }

    if (gameResult.status === 'draw') {
        statusText.innerText = "It's a Draw!";
        isGameActive = false;
        return;
    }

    // Switch turns
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.innerText = `Player ${currentPlayer}'s Turn`;

    // Trigger AI move if PVC mode and it's 'O' (Computer's Turn)
    if (gameMode === 'pvc' && currentPlayer === 'O' && isGameActive) {
        triggerAiMove();
    }
}

// Check winning status for a given board layout
function checkWinState(boardState) {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];

        if (boardState[a] !== null && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return { status: 'win', line: winConditions[i] };
        }
    }

    if (!boardState.includes(null)) {
        return { status: 'draw' };
    }

    return { status: 'active' };
}

// Add CSS pulse and styling to winner slots
function highlightWinningCells(line) {
    line.forEach(idx => {
        cells[idx].classList.add('winning');
    });
}

// Simulated delay for AI turn to feel organic
function triggerAiMove() {
    isAiThinking = true;
    
    // Set loading indicator
    statusText.innerHTML = `AI is thinking <span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>`;

    setTimeout(() => {
        if (!isGameActive) {
            isAiThinking = false;
            return;
        }

        let targetMove;
        if (difficulty === 'easy') {
            targetMove = getEasyMove();
        } else {
            targetMove = getImpossibleMove();
        }

        isAiThinking = false;
        makeMove(targetMove, 'O');
    }, 600);
}

// Easy Mode: Pick a random free space
function getEasyMove() {
    const availableMoves = [];
    board.forEach((val, idx) => {
        if (val === null) {
            availableMoves.push(idx);
        }
    });

    if (availableMoves.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
}

// Impossible Mode: Minimax (Backtracking algorithm)
function getImpossibleMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'O'; // Simulate AI making this move
            let score = minimax(board, 0, false);
            board[i] = null; // Revert cell back to empty

            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(tempBoard, depth, isMaximizing) {
    const result = checkWinState(tempBoard);
    
    if (result.status === 'win') {
        const winner = tempBoard[result.line[0]];
        // AI wins (O) => score = 10 - depth (prefer fast wins)
        // User wins (X) => score = depth - 10 (prefer late losses)
        return winner === 'O' ? (10 - depth) : (depth - 10);
    }
    
    if (result.status === 'draw') {
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < tempBoard.length; i++) {
            if (tempBoard[i] === null) {
                tempBoard[i] = 'O';
                let score = minimax(tempBoard, depth + 1, false);
                tempBoard[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < tempBoard.length; i++) {
            if (tempBoard[i] === null) {
                tempBoard[i] = 'X';
                let score = minimax(tempBoard, depth + 1, true);
                tempBoard[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// 6. Reset Logic
function resetGame() {
    // Wipe the underlying array
    board = [null, null, null, null, null, null, null, null, null];

    // Reset game state variables
    currentPlayer = 'X';
    isGameActive = true;
    isAiThinking = false;
    statusText.innerText = `Player X's Turn`;

    // Wipe visual classes and inner text
    cells.forEach(cell => {
        cell.innerText = '';
        cell.className = 'cell';
    });
}