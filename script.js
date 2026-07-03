const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;

let snake, direction, food, score, game, gameOver, lives, highScore;
let changingDirection = false; 
let isPaused = false;

// Difficulty / level state
let baseSpeed = 600; 
let speed = baseSpeed; 
let level = 1;
const LEVEL_TARGET = 30;

function initGame(resetLives = true) {
    snake = [{ x: 9 * box, y: 10 * box }];
    direction = null;
    changingDirection = false;
    isPaused = false;
    food = randomPosition();
    gameOver = false;
    
    if (resetLives) {
        score = 0;
        lives = 3;
        level = 1;
        speed = baseSpeed;
    }
    
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    
    document.getElementById('score').textContent = score;
    document.getElementById('highscore').textContent = highScore;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    document.getElementById('pauseBtn').textContent = 'Pause';
    
    if (game) clearInterval(game);
    game = setInterval(draw, speed);
}

function randomPosition() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box
        };
    } while (snake && snake.some(segment => segment.x === pos.x && segment.y === pos.y));
    return pos;
}

// --- UNIFIED DIRECTION CONTROLLER ---
function handleDirectionInput(newDir) {
    if (gameOver || isPaused || changingDirection) return;

    const goingUp = direction === 'UP';
    const goingDown = direction === 'DOWN';
    const goingRight = direction === 'RIGHT';
    const goingLeft = direction === 'LEFT';

    if (newDir === 'LEFT' && !goingRight) {
        direction = 'LEFT';
        changingDirection = true;
    } else if (newDir === 'UP' && !goingDown) {
        direction = 'UP';
        changingDirection = true;
    } else if (newDir === 'RIGHT' && !goingLeft) {
        direction = 'RIGHT';
        changingDirection = true;
    } else if (newDir === 'DOWN' && !goingUp) {
        direction = 'DOWN';
        changingDirection = true;
    }
}

// --- EVENT LISTENERS ---

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }
    
    const keyMap = {
        'ArrowLeft': 'LEFT',
        'ArrowUp': 'UP',
        'ArrowRight': 'RIGHT',
        'ArrowDown': 'DOWN'
    };

    if (keyMap[e.key]) {
        handleDirectionInput(keyMap[e.key]);
    }
});

// Buttons
document.getElementById('restartBtn').addEventListener('click', () => initGame(true));
document.getElementById('pauseBtn').addEventListener('click', togglePause);

// Difficulty Buttons
const diffButtons = document.querySelectorAll('.diff-btn');
diffButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        diffButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        baseSpeed = parseInt(e.target.getAttribute('data-speed'), 10);
        initGame(true);
    });
});

// --- GAME LOOP ---
function draw() {
    changingDirection = false;
    
    if (direction) {
        let head = { ...snake[0] };
        if (direction === 'LEFT') head.x -= box;
        if (direction === 'UP') head.y -= box;
        if (direction === 'RIGHT') head.x += box;
        if (direction === 'DOWN') head.y += box;

        let crashed = false;
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) crashed = true;
        if (!crashed && snake.some(segment => segment.x === head.x && segment.y === head.y)) crashed = true;

        if (crashed) {
            handleCrash();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            handleFoodEaten();
        } else {
            snake.pop(); 
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGameElements();
}

function drawGameElements() {
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#4ade80' : '#86efac'; 
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2); 
    }
    ctx.fillStyle = '#f87171';
    ctx.fillRect(food.x, food.y, box - 2, box - 2);
}

// --- GAME MECHANICS ---
function handleCrash() {
    clearInterval(game);
    lives--;
    document.getElementById('lives').textContent = lives;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highscore').textContent = highScore;
    }
    
    if (lives > 0) {
        setTimeout(() => {
            alert('Oops! You crashed! Lives left: ' + lives);
            direction = null;
            game = setInterval(draw, speed); 
        }, 50);
    } else {
        gameOver = true;
        setTimeout(() => {
            alert('Game Over! Your score: ' + score + '\nHigh Score: ' + highScore);
        }, 50);
    }
}

function handleFoodEaten() {
    score++;
    document.getElementById('score').textContent = score;
    food = randomPosition();
    
    if (snake.length >= LEVEL_TARGET) {
        const clearedLevel = level;
        level++;
        document.getElementById('level').textContent = level;
        speed = Math.round(speed * 0.8);
        
        clearInterval(game);
        setTimeout(() => {
            alert('Congratulations! You cleared level ' + clearedLevel + '!\nLevel ' + level + ' starts now.');
            initGame(false); 
        }, 50);
    }
}

function togglePause() {
    if (gameOver || !direction) return; 

    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');

    if (isPaused) {
        clearInterval(game); 
        pauseBtn.textContent = 'Resume';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '30px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else {
        game = setInterval(draw, speed); 
        pauseBtn.textContent = 'Pause';
    }
}

// --- MOBILE SWIPE CONTROLS ---
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

canvas.addEventListener('touchend', (e) => {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, { passive: false });

function handleSwipe(startX, startY, endX, endY) {
    let deltaX = endX - startX;
    let deltaY = endY - startY;
    
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        handleDirectionInput(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
        handleDirectionInput(deltaY > 0 ? 'DOWN' : 'UP');
    }
}

// --- D-PAD CONTROLS ---
const dpadEvents = [
    { id: 'btnUp', dir: 'UP' },
    { id: 'btnLeft', dir: 'LEFT' },
    { id: 'btnRight', dir: 'RIGHT' },
    { id: 'btnDown', dir: 'DOWN' }
];

dpadEvents.forEach(btn => {
    const element = document.getElementById(btn.id);
    if (element) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            handleDirectionInput(btn.dir);
        }, { passive: false });
    }
});

initGame();