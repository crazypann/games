
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;
let snake, direction, food, score, game, gameOver, lives, highScore;

function initGame(resetLives = true) {
    snake = [{ x: 9 * box, y: 10 * box }];
    direction = null;
    food = randomPosition();
    if (resetLives) score = 0;
    gameOver = false;
    if (resetLives) lives = 3;
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('highscore').textContent = 'High Score: ' + highScore;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    if (game) clearInterval(game);
    game = setInterval(draw, 600); // Slow for kids
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
    if (gameOver) return;
    if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    else if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    else if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    else if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initGame();
});



function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Don't move the snake until a direction is set
    if (!direction) {
        // Draw snake
        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = i === 0 ? '#0f0' : '#fff';
            ctx.fillRect(snake[i].x, snake[i].y, box, box);
        }
        // Draw food
        ctx.fillStyle = '#f00';
        ctx.fillRect(food.x, food.y, box, box);
        return;
    }

    // Move snake: calculate new head position
    let head = { ...snake[0] };
    if (direction === 'LEFT') head.x -= box;
    if (direction === 'UP') head.y -= box;
    if (direction === 'RIGHT') head.x += box;
    if (direction === 'DOWN') head.y += box;

    // Add new head to the snake
    snake.unshift(head);

    // Check collision with wall or self AFTER adding head
    let crashed = false;
    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height
    ) {
        crashed = true;
    }
    if (
        !crashed && snake.length > 1 &&
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        crashed = true;
    }

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#0f0' : '#fff';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }
    // Draw food
    ctx.fillStyle = '#f00';
    ctx.fillRect(food.x, food.y, box, box);

    if (crashed) {
        clearInterval(game);
        lives--;
        document.getElementById('lives').textContent = 'Lives: ' + lives;
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('highscore').textContent = 'High Score: ' + highScore;
        }
        if (lives > 0) {
            setTimeout(() => {
                alert('Oops! You crashed! Lives left: ' + lives);
                // Restart round, keep score and lives
                initGame(false);
            }, 50);
        } else {
            gameOver = true;
            setTimeout(() => {
                alert('Game Over! Your score: ' + score + '\nHigh Score: ' + highScore);
            }, 50);
        }
        return;
    }

    // Check if snake eats food
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = 'Score: ' + score;
        food = randomPosition();
        // Do not remove tail, snake grows
    } else {
        // Remove tail
        snake.pop();
    }
}

// Start the game initially
initGame();
