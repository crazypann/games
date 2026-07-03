const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;

let snake, direction, food, score, game, gameOver, lives, highScore;
let changingDirection = false; // Prevents rapid double-key self-collision

// Difficulty / level state
let baseSpeed = 600; // Tracks the selected difficulty setting
let speed = baseSpeed; 
let level = 1;
const LEVEL_TARGET = 30;

function initGame(resetLives = true) {
    snake = [{ x: 9 * box, y: 10 * box }];
    direction = null;
    changingDirection = false;
    food = randomPosition();
    gameOver = false;
    
    if (resetLives) {
        score = 0;
        lives = 3;
        level = 1;
        speed = baseSpeed; // Uses selected difficulty
    }
    
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    
    // Update Dashboard UI
    document.getElementById('score').textContent = score;
    document.getElementById('highscore').textContent = highScore;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    
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

document.addEventListener('keydown', (e) => {
    if (gameOver || changingDirection) return;
    
    const key = e.key;
    const goingUp = direction === 'UP';
    const goingDown = direction === 'DOWN';
    const goingRight = direction === 'RIGHT';
    const goingLeft = direction === 'LEFT';

    if (key === 'ArrowLeft' && !goingRight) {
        direction = 'LEFT';
        changingDirection = true;
    }
    if (key === 'ArrowUp' && !goingDown) {
        direction = 'UP';
        changingDirection = true;
    }
    if (key === 'ArrowRight' && !goingLeft) {
        direction = 'RIGHT';
        changingDirection = true;
    }
    if (key === 'ArrowDown' && !goingUp) {
        direction = 'DOWN';
        changingDirection = true;
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initGame(true);
});

function draw() {
    // Reset changingDirection flag at the start of a new frame
    changingDirection = false;
    
    // Only process movement if a direction is set
    if (direction) {
        // Calculate new head position
        let head = { ...snake[0] };
        if (direction === 'LEFT') head.x -= box;
        if (direction === 'UP') head.y -= box;
        if (direction === 'RIGHT') head.x += box;
        if (direction === 'DOWN') head.y += box;

        // Check collision BEFORE rendering the new head
        let crashed = false;
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            crashed = true;
        }
        if (!crashed && snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            crashed = true;
        }

        if (crashed) {
            handleCrash();
            return;
        }

        // Move the snake
        snake.unshift(head);

        // Check if snake eats food
        if (head.x === food.x && head.y === food.y) {
            handleFoodEaten();
        } else {
            snake.pop(); // Remove tail if no food eaten
        }
    }

    // DRAW EVERYTHING AFTER UPDATING THE LOGIC
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGameElements();
}

function drawGameElements() {
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#4ade80' : '#86efac'; // Neon green head, lighter green body
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2); // Added minor gap for retro look
    }
    // Draw food
    ctx.fillStyle = '#f87171';
    ctx.fillRect(food.x, food.y, box - 2, box - 2);
}

// function handleCrash() {
//     clearInterval(game);
//     lives--;
//     document.getElementById('lives').textContent = lives;
    
//     // Update high score
//     if (score > highScore) {
//         highScore = score;
//         localStorage.setItem('snakeHighScore', highScore);
//         document.getElementById('highscore').textContent = highScore;
//     }
    
//     if (lives > 0) {
//         setTimeout(() => {
//             alert('Oops! You crashed! Lives left: ' + lives);
//             initGame(false); // Game now actually restarts and keeps current score!
//         }, 50);
//     } else {
//         gameOver = true;
//         setTimeout(() => {
//             alert('Game Over! Your score: ' + score + '\nHigh Score: ' + highScore);
//         }, 50);
//     }
// }

function handleCrash() {
    clearInterval(game);
    lives--;
    document.getElementById('lives').textContent = lives;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highscore').textContent = highScore;
    }
    
    if (lives > 0) {
        setTimeout(() => {
            alert('Oops! You crashed! Lives left: ' + lives);
            
            // Reset direction so the snake pauses and waits for new input
            direction = null;
            
            // Restart the game interval without calling initGame()
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
    
    // Check level-up
    if (snake.length >= LEVEL_TARGET) {
        const clearedLevel = level;
        level++;
        document.getElementById('level').textContent = level;
        speed = Math.round(speed * 0.8);
        
        clearInterval(game);
        setTimeout(() => {
            alert('Congratulations! You cleared level ' + clearedLevel + '!\nLevel ' + level + ' starts now.');
            initGame(false); // Reset board for next level
        }, 50);
    }
}

// Difficulty Button Logic
const diffButtons = document.querySelectorAll('.diff-btn');

diffButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Remove active class from all buttons
        diffButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        e.target.classList.add('active');
        
        // Update the base speed based on the button's data attribute
        baseSpeed = parseInt(e.target.getAttribute('data-speed'), 10);
        
        // Restart the game automatically to apply the new difficulty
        initGame(true);
    });
});

// --- MOBILE SWIPE CONTROLS ---
let touchStartX = 0;
let touchStartY = 0;

// Listen for the start of a touch
canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

// Prevent scrolling when swiping on the canvas
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault(); 
}, { passive: false });

// Listen for the end of a touch
canvas.addEventListener('touchend', function(e) {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, { passive: false });

function handleSwipe(startX, startY, endX, endY) {
    // Don't register swipes if the game is over or direction just changed
    if (gameOver || changingDirection) return;

    let deltaX = endX - startX;
    let deltaY = endY - startY;
    
    // Require a minimum swipe distance (e.g., 30px) to ignore accidental taps
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    const goingUp = direction === 'UP';
    const goingDown = direction === 'DOWN';
    const goingRight = direction === 'RIGHT';
    const goingLeft = direction === 'LEFT';

    // Check if the swipe was mostly horizontal or mostly vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && !goingLeft) {
            direction = 'RIGHT';
            changingDirection = true;
        } else if (deltaX < 0 && !goingRight) {
            direction = 'LEFT';
            changingDirection = true;
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && !goingUp) {
            direction = 'DOWN';
            changingDirection = true;
        } else if (deltaY < 0 && !goingDown) {
            direction = 'UP';
            changingDirection = true;
        }
    }
}

// Initialize the game on load
initGame();