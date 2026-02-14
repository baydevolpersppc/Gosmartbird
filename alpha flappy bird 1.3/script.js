const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function forceLandscape() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {
      // Some browsers block this until user interaction
    });
  }
}

// Try on load
window.addEventListener("load", forceLandscape);

// Try again on first user interaction
window.addEventListener("touchstart", forceLandscape, { once: true });
window.addEventListener("click", forceLandscape, { once: true });


/* ============================================
         MOBILE-FRIENDLY CANVAS SCALING
=============================================== */
document.body.style.touchAction = "none";
document.body.style.overscrollBehavior = "none";

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

// Fix roundRect for browsers that don't support it
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ============================
      GAME SETTINGS
=============================== */
const skinMap = {
  flappybird3: "flappybird3.png",
  pink: "pinkbird.png",
  zombie: "zombiebird.png",
  blue: "bluebird.png",
  lizard: "lizardbird.png",
  einstein: "einsteinbird.png"
};
const equippedSkin = localStorage.getItem("equippedSkin") || "flappybird3";
const bee = new Image();
bee.src = `source/${skinMap[equippedSkin]}`;
/* BACKGROUND IMAGE */
const bg = new Image();
bg.src = "source/background.png";
let bgLoaded = false;
bg.onload = () => bgLoaded = true;
let bgOffset = 0;

/* ============================
      BEE PHYSICS
=============================== */
let beeX = 300, beeY = 200;
let beeWidth = 34, beeHeight = 34;
let velocityY = 0;
let gravity = 0.14;
let flapPower = -4.4;
const maxFallSpeed = 6;
let beeRotation = 0;

/* ============================
      STAGE PHYSICS
=============================== */
const stagePhysics = {
  easy: { gravity: 0.14, flap: -4.4, speed: 2.8, min: 1300, max: 1800 },
  average: { gravity: 0.18, flap: -4.8, speed: 3.5, min: 900, max: 1400 },
  difficult: { gravity: 0.25, flap: -5.5, speed: 4.6, min: 600, max: 1000 }
};

let currentStage = "easy";

/* ============================
   ADDED: STAGE QUESTION TIME
=============================== */
const stageTime = { easy: 5, average: 15, difficult: 30 };

function getStageSpacing(stage) {
  return stagePhysics[stage].speed * 60 * stageTime[stage];
}

/* ============================
      PIPES
=============================== */
const blockWidth = 90;
let blockSpeed = stagePhysics.easy.speed;
let minSpacing = stagePhysics.easy.min;
let maxSpacing = stagePhysics.easy.max;

function getRandomSpacing() {
  return Math.floor(Math.random() * (maxSpacing - minSpacing + 1)) + minSpacing;
}

/* ============================
      SCORES
=============================== */
let score = 0, earnedCoins = 0;
let coins = parseInt(localStorage.getItem("coins")) || 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

/* ============================
      GAME STATE
=============================== */
let gameStarted = false;
let gameOver = false;

/* ============================
      QUESTIONS
=============================== */
const questionBank = {
  easy: [
    { q: "12+1 = ?", a: [13,14], correct: 13 },
    { q: "16+3 = ?", a: [19,18], correct: 19 },
    { q: "5+4 = ?", a: [9,8], correct: 9 },
    { q: "3+8 = ?", a: [11,12], correct: 11 },
    { q: "2+6 = ?", a: [8,9], correct: 8 },
    { q: "7+5 = ?", a: [12,13], correct: 12 },
    { q: "9+7 = ?", a: [16,18], correct: 16 },
    { q: "8+7 = ?", a: [15,14], correct: 15 },
    { q: "15-3 = ?", a: [12,13], correct: 12 },
    { q: "16-9 = ?", a: [7,8], correct: 7 },
    { q: "13-6 = ?", a: [7,6], correct: 7 },
    { q: "19-8 = ?", a: [11,10], correct: 11 },
    { q: "12-9 = ?", a: [3,2], correct: 3 },
    { q: "17-8 = ?", a: [9,3], correct: 9 },
    { q: "11-5 = ?", a: [6,7], correct: 6 },
    { q: "2*3 = ?", a: [6,8], correct: 6 },
    { q: "5*2 = ?", a: [10,13], correct: 10 },
    { q: "4*4 = ?", a: [16,12], correct: 16 },
    { q: "3*3 = ?", a: [9,12], correct: 9 },
    { q: "1*8 = ?", a: [8,0], correct: 8 },
    { q: "2*6 = ?", a: [12,13], correct: 12 },
    { q: "5*5 = ?", a: [25,30], correct: 25 },
    { q: "10/2 = ?", a: [5,12], correct: 5 },
    { q: "12/3 = ?", a: [4,3], correct: 4 },
    { q: "20/5 = ?", a: [4,3], correct: 4 },
    { q: "18/2 = ?", a: [9,8], correct: 9 },
    { q: "15/3 = ?", a: [5,4], correct: 5 },
    { q: "24/4 = ?", a: [6,2], correct: 6 },
    { q: "30/10 = ?", a: [3,5], correct: 3 }
  ],
  average: [
    { q: "5*2+3 = ?", a: [13,25], correct: 13 },
    { q: "15/3-2 = ?", a: [3,4], correct: 3 },
    { q: "6*1-5 = ?", a: [1,2], correct: 1 },
    { q: "3/3+3 = ?", a: [4,3], correct: 4 },
    { q: "4*6+5 = ?", a: [29,24], correct: 29 },
    { q: "10/2+6 = ?", a: [11,10], correct: 11 },
    { q: "2*1-2 = ?", a: [0,1], correct: 0 },
    { q: "18/6+2 = ?", a: [5,6], correct: 5 },
    { q: "11*2-3 = ?", a: [19,18], correct: 19 },
    { q: "12/4+9 = ?", a: [12,11], correct: 12 },
    { q: "7*3-8 = ?", a: [17,16], correct: 17 },
    { q: "20/10+7 = ?", a: [9,8], correct: 9 },
    { q: "4*2-7 = ?", a: [1,2], correct: 1 },
    { q: "4/2+19 = ?", a: [21,22], correct: 21 },
    { q: "6*6+10 = ?", a: [46,56], correct: 46 }
  ],
  difficult: [
    { q: "12*2/6+3 = ?", a: [7,8], correct: 7 },
    { q: "45/5*3-2 = ?", a: [25,24], correct: 25 },
    { q: "11*3/3-5 = ?", a: [6,5], correct: 6 },
    { q: "40/4*5+9 = ?", a: [59,69], correct: 59 },
    { q: "16*1/2+11 = ?", a: [19,18], correct: 19 }
  ]
};

const TARGET_QUESTION_COUNT = 50;

function buildQuestionQueue() {
  const ordered = [
  ...questionBank.easy,
  ...questionBank.average,
  ...questionBank.difficult
  ];

  if (ordered.length >= TARGET_QUESTION_COUNT) {
    return ordered.slice(0, TARGET_QUESTION_COUNT);
  }

  // Keep stage order stable by padding from the hardest stage only.
  const fallbackBank = questionBank.difficult.length
    ? questionBank.difficult
    : (questionBank.average.length ? questionBank.average : questionBank.easy);
  let fallbackIndex = 0;
  while (ordered.length < TARGET_QUESTION_COUNT) {
    ordered.push(fallbackBank[fallbackIndex % fallbackBank.length]);
    fallbackIndex++;
  }

  return ordered;
}

let questions = buildQuestionQueue();

let questionIndex = 0;
let answeredCount = 0;
let blocks = [];

/* ============================
      STAGE PROGRESSION
=============================== */
function updateStage() {
  const e = questionBank.easy.length;
  const a = questionBank.average.length;

  if (answeredCount < e) currentStage = "easy";
  else if (answeredCount < e + a) currentStage = "average";
  else currentStage = "difficult";

  const s = stagePhysics[currentStage];
  gravity = s.gravity;
  flapPower = s.flap;
  blockSpeed = s.speed;
  minSpacing = s.min;
  maxSpacing = s.max;
}

/* ============================
      PIPE CREATION
=============================== */
function createPipe(x) {
  if (questionIndex >= questions.length) return;

  const q = questions[questionIndex];
  const stageAtSpawn = currentStage;
  questionIndex++;

  // Randomize whether correct answer is on top or bottom
  const isCorrectTop = Math.random() < 0.5;
  let topAns, bottomAns;
  if (isCorrectTop) {
    topAns = q.correct;
    bottomAns = q.a.find(ans => ans !== q.correct);
  } else {
    bottomAns = q.correct;
    topAns = q.a.find(ans => ans !== q.correct);
  }

  blocks.push({
    x,
    q: q.q,
    topAns,
    bottomAns,
    correct: q.correct,
    answered: false,
    spacing: getStageSpacing(stageAtSpawn),
    topColor: "#4CAF50",
    bottomColor: "#FF5722"
  });
}

/* ============================
      PIPE MANAGEMENT (FIXED)
=============================== */
function maintainPipes() {
  if (blocks.length === 0 && questions.length > 0) {
    const spawnX = Math.max(canvas.width + 200, beeX + getStageSpacing(currentStage));
    createPipe(spawnX);
  }
  if (blocks.length === 0) return;

  const last = blocks[blocks.length - 1];

  if (last.x < beeX) {
    const spawnX = Math.max(canvas.width + 200, last.x + last.spacing);
    createPipe(spawnX);
  }

  // keep pipes until they move off the left edge of the screen
  blocks = blocks.filter(b => b.x + blockWidth > 0);
}

/* ============================
      DRAWING
=============================== */
function drawBee() {
  ctx.save();
  const cx = beeX + beeWidth / 2;
  const cy = beeY + beeHeight / 2;
  const maxRot = Math.PI / 6;
  beeRotation = Math.min(Math.max(velocityY / 10, -maxRot), maxRot);
  ctx.translate(cx, cy);
  ctx.rotate(beeRotation);
  ctx.drawImage(bee, -beeWidth/2, -beeHeight/2, beeWidth, beeHeight);
  ctx.restore();
}

function drawQuestion() {
  const block = blocks.find(b => !b.answered);
  if (!block) return;

  ctx.fillStyle = "#ffeb3b";
  ctx.strokeStyle = "#f57f17";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(canvas.width/2-160, 20, 320, 60, 12);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(block.q, canvas.width / 2, 58);
  ctx.textAlign = "start";
}

function drawBlocks() {
  const mid = canvas.height / 2;
  for (let b of blocks) {
    ctx.fillStyle = b.topColor;
    ctx.fillRect(b.x, 0, blockWidth, mid - 20);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(b.x - 5, mid - 20, blockWidth + 10, 20);
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(b.topAns, b.x + blockWidth/2, mid/2);

    ctx.fillStyle = b.bottomColor;
    ctx.fillRect(b.x, mid + 20, blockWidth, mid - 20);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(b.x - 5, mid, blockWidth + 10, 20);
    ctx.fillStyle = "white";
    ctx.fillText(b.bottomAns, b.x + blockWidth/2, mid + mid/2);
  }
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "right";
  ctx.fillText("High: " + highScore, canvas.width - 20, 40);
  ctx.fillText("Score: " + score, canvas.width - 20, 70);
  ctx.fillText("🪙 " + coins, canvas.width - 20, 100);
  ctx.textAlign = "start";
}

/* ============================
      COLLISION
=============================== */
function isColliding(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/* ============================
      GAME OVER
=============================== */
function endGame() {
  earnedCoins = score;
  coins += earnedCoins;
  localStorage.setItem("coins", coins);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  finalScore.textContent = "Score: " + score;
  finalCoins.textContent = "Coins Earned: " + earnedCoins;
  gameOverUI.style.display = "flex";

  gameStarted = false;
  gameOver = true;
}

function drawBackground() {
  if (!bgLoaded) return;

  if (gameStarted) {
    bgOffset -= blockSpeed * 0.2;
    if (bgOffset <= -canvas.width) bgOffset = 0;
  }

  ctx.drawImage(bg, bgOffset, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgOffset + canvas.width, 0, canvas.width, canvas.height);
}

/* ============================
      GAME LOOP
=============================== */
let lastTime = performance.now();
function update(now) {
  const delta = (now - lastTime) / 16.67;
  lastTime = now;
  requestAnimationFrame(update);

  
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();


  if (!gameStarted) {
    drawBee();
    drawBlocks();
    drawScore();
    return;
  }

  velocityY = Math.min(velocityY + gravity * delta, maxFallSpeed);
  beeY += velocityY * delta;

  drawBee();
  drawQuestion();
  drawBlocks();
  drawScore();
  maintainPipes();

  for (let b of blocks) {
    b.x -= blockSpeed * delta;
    const mid = canvas.height/2;
    const hitTop = isColliding(beeX,beeY,beeWidth,beeHeight,b.x,0,blockWidth,mid);
    const hitBottom = isColliding(beeX,beeY,beeWidth,beeHeight,b.x,mid,blockWidth,mid);

    if (!b.answered && (hitTop || hitBottom)) {
      b.answered = true;
      if ((hitTop && b.topAns === b.correct) || (hitBottom && b.bottomAns === b.correct)) {
        score++;
        answeredCount++;
        updateStage();
      } else {
        endGame();
      }
    }
  }

  if (beeY < 0 || beeY + beeHeight > canvas.height) endGame();
}

/* ============================
      INPUT
=============================== */
function flap() {
  if (!gameStarted) {
    // Removed bgOffset = 0; to prevent background reset on game start
    blocks = [];
    questionIndex = 0;
    score = 0;
    earnedCoins = 0;
    answeredCount = 0;
    questions = buildQuestionQueue();
    beeY = 200;
    velocityY = 0;
    gameOver = false;
    currentStage = "easy";
    updateStage();
    gameStarted = true;
    gameOverUI.style.display = "none";
  }
  velocityY = flapPower;
}
const rotateOverlay = document.getElementById("rotateOverlay");

function checkOrientation() {
  if (window.innerHeight > window.innerWidth) {
    // Portrait
    rotateOverlay.style.display = "flex";
    canvas.style.display = "none";
  } else {
    // Landscape
    rotateOverlay.style.display = "none";
    canvas.style.display = "block";
    resizeCanvas();
  }
}

window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

// Initial check
checkOrientation();


window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});
canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", e => {
  e.preventDefault(); // Prevent default touch behaviors like scrolling or zooming
  flap();
});

retryBtn.addEventListener("click", flap);
homeBtn.addEventListener("click", () => location.href = "index.html");

requestAnimationFrame(update);


const bgMusic = document.getElementById("bgmusic");

// Enable sound on first interaction
function enableAudio() {
  bgMusic.play().catch(() => {});
  window.removeEventListener("touchstart", enableAudio);
  window.removeEventListener("click", enableAudio);
  window.removeEventListener("keydown", enableAudio);
}

// Listen for the first user action
window.addEventListener("touchstart", enableAudio);
window.addEventListener("click", enableAudio);
window.addEventListener("keydown", enableAudio);
