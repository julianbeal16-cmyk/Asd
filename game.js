// ============================================
// SUBWAY RUNNER 3D - نسخة مصححة 100%
// ============================================

// عناصر DOM الأساسية
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ضبط أبعاد Canvas
canvas.width = 800;
canvas.height = 400;

// عناصر التحكم
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const jumpBtn = document.getElementById('jump-btn');
const slideBtn = document.getElementById('slide-btn');

// عناصر الإحصائيات
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const speedElement = document.getElementById('speed');
const livesElement = document.getElementById('lives');
const finalDistanceElement = document.getElementById('final-distance');
const finalCoinsElement = document.getElementById('final-coins');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');

// متغيرات اللعبة
let gameRunning = false;
let distance = 0;
let coins = 0;
let lives = 3;
let gameSpeed = 1;
let highScore = localStorage.getItem('subwayRunnerHighScore') || 0;
let animationId;
let lastTime = 0;

// إعدادات العالم
const WORLD = {
    ROAD_WIDTH: 600,
    LANES: 3,
    LANE_WIDTH: 200,
    FOV: 1000
};

// اللاعب
const player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    lane: 1, // 0=يسار, 1=وسط, 2=يمين
    width: 50,
    height: 80,
    isJumping: false,
    isSliding: false,
    velocityY: 0,
    gravity: 0.8,
    jumpForce: -16,
    slideTimer: 0,
    
    // حالات اللاعب
    state: 'running', // running, jumping, sliding
    
    // إطارات الركض
    runFrame: 0,
    runCounter: 0,
    runSpeed: 5
};

// المسارات
const lanes = [
    canvas.width * 0.25,  // يسار
    canvas.width * 0.5,   // وسط
    canvas.width * 0.75   // يمين
];

// العوائق
const obstacles = [];
const coinsArray = [];

// ============================================
// وظائف اللعبة
// ============================================

// تهيئة اللعبة
function initGame() {
    console.log("🎮 بدء اللعبة...");
    
    // إعادة تعيين القيم
    distance = 0;
    coins = 0;
    lives = 3;
    gameSpeed = 1;
    
    // إعادة تعيين اللاعب
    player.x = lanes[1];
    player.y = canvas.height - 150;
    player.lane = 1;
    player.isJumping = false;
    player.isSliding = false;
    player.state = 'running';
    player.velocityY = 0;
    player.slideTimer = 0;
    
    // تفريغ المصفوفات
    obstacles.length = 0;
    coinsArray.length = 0;
    
    // تحديث الواجهة
    updateUI();
    
    // تبديل الشاشات
    switchScreen('game');
    
    // بدء حلقة اللعبة
    gameRunning = true;
    lastTime = performance.now();
    gameLoop();
}

// تبديل الشاشات
function switchScreen(screenName) {
    // إخفاء جميع الشاشات
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    endScreen.classList.remove('active');
    
    // إظهار الشاشة المطلوبة
    if (screenName === 'start') {
        startScreen.classList.add('active');
    } else if (screenName === 'game') {
        gameScreen.classList.add('active');
    } else if (screenName === 'end') {
        endScreen.classList.add('active');
    }
}

// تحديث الواجهة
function updateUI() {
    distanceElement.textContent = Math.floor(distance) + 'م';
    coinsElement.textContent = coins;
    speedElement.textContent = gameSpeed.toFixed(1) + 'x';
    livesElement.textContent = lives;
    highScoreElement.textContent = highScore;
}

// رسم الخلفية
function drawBackground() {
    // السماء
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGradient.addColorStop(0, '#0a1429');
    skyGradient.addColorStop(1, '#1a3a5f');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // الطريق
    ctx.fillStyle = '#2a5a8c';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // خطوط الطريق
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 3;
    
    // خط الوسط
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height - 100);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // خطوط المسارات
    ctx.setLineDash([20, 10]);
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(lanes[i], canvas.height - 100);
        ctx.lineTo(lanes[i], canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // تأثير الحركة على الخطوط
    const offset = (Date.now() * 0.02) % 40;
    ctx.fillStyle = '#4cc9f0';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(lanes[i] - 5, canvas.height - 50 + offset, 10, 20);
    }
}

// رسم اللاعب
function drawPlayer() {
    ctx.save();
    
    // حساب أبعاد الرسم حسب الحالة
    let drawY = player.y;
    let drawHeight = player.height;
    
    if (player.isSliding) {
        drawHeight = player.height * 0.6;
        drawY = player.y + (player.height - drawHeight);
    }
    
    // تأثير الركض
    if (player.state === 'running') {
        player.runCounter++;
        if (player.runCounter >= player.runSpeed) {
            player.runFrame = player.runFrame === 0 ? 1 : 0;
            player.runCounter = 0;
        }
        
        // تمايل بسيط
        const bounce = Math.sin(Date.now() * 0.01) * 3;
        drawY += bounce;
    }
    
    // الجسم
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(player.x - player.width/2, drawY - drawHeight, player.width, drawHeight);
    
    // الرأس
    ctx.fillStyle = '#1a3a5f';
    ctx.fillRect(player.x - player.width/2 + 10, drawY - drawHeight + 10, player.width - 20, 30);
    
    // العيون
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - 15, drawY - drawHeight + 20, 10, 10);
    ctx.fillRect(player.x + 5, drawY - drawHeight + 20, 10, 10);
    
    // تأثير القفز
    if (player.isJumping) {
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, drawY - drawHeight, player.width, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // ظل
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y, player.width/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// إنشاء عائق
function createObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.5 ? 'train' : 'barrier';
    
    obstacles.push({
        x: lanes[lane],
        y: -100,
        width: type === 'train' ? 120 : 80,
        height: type === 'train' ? 80 : 60,
        speed: 5 + gameSpeed,
        type: type,
        lane: lane,
        passed: false
    });
}

// إنشاء عملة
function createCoin() {
    const lane = Math.floor(Math.random() * 3);
    
    coinsArray.push({
        x: lanes[lane],
        y: -50,
        radius: 15,
        speed: 5 + gameSpeed,
        collected: false,
        lane: lane,
        rotation: 0
    });
}

// رسم العوائق
function drawObstacles() {
    obstacles.forEach(obstacle => {
        // الجسم الرئيسي
        ctx.fillStyle = obstacle.type === 'train' ? '#e63946' : '#f4a261';
        ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y, obstacle.width, obstacle.height);
        
        // التفاصيل
        ctx.fillStyle = '#333';
        if (obstacle.type === 'train') {
            // نوافذ القطار
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    obstacle.x - obstacle.width/2 + 20 + i * 30,
                    obstacle.y + 15,
                    20,
                    20
                );
            }
        } else {
            // الحاجز
            ctx.fillRect(obstacle.x - 5, obstacle.y, 10, obstacle.height);
            ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y + obstacle.height - 10, obstacle.width, 10);
        }
        
        // ظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y + obstacle.height, obstacle.width, 10);
    });
}

// رسم العملات
function drawCoins() {
    coinsArray.forEach(coin => {
        if (!coin.collected) {
            coin.rotation += 0.1;
            
            ctx.save();
            ctx.translate(coin.x, coin.y);
            ctx.rotate(coin.rotation);
            
            // عملة ذهبية
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // رمز الدولار
            ctx.fillStyle = '#DAA520';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            
            // تأثير الوميض
            if (Math.sin(coin.rotation * 2) > 0.8) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, coin.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            ctx.restore();
        }
    });
}

// تحديث اللاعب
function updatePlayer() {
    // الحركة للمسار المطلوب
    const targetX = lanes[player.lane];
    player.x += (targetX - player.x) * 0.2;
    
    // القفز
    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        player.state = 'jumping';
        
        // العودة للأرض
        if (player.y >= canvas.height - 150) {
            player.y = canvas.height - 150;
            player.isJumping = false;
            player.velocityY = 0;
            player.state = 'running';
        }
    }
    
    // التزحلق
    if (player.isSliding) {
        player.slideTimer++;
        player.state = 'sliding';
        
        // إنهاء التزحلق بعد فترة
        if (player.slideTimer > 40) {
            player.isSliding = false;
            player.slideTimer = 0;
            player.state = player.isJumping ? 'jumping' : 'running';
        }
    }
}

// تحديث العوائق والعملات
function updateObjects(deltaTime) {
    // تحديث العوائق
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.y += obstacle.speed * deltaTime;
        
        // إذا تجاوز العائق اللاعب
        if (!obstacle.passed && obstacle.y > player.y) {
            obstacle.passed = true;
            distance += 10;
            updateUI();
        }
        
        // إزالة العوائق البعيدة
        if (obstacle.y > canvas.height + 100) {
            obstacles.splice(i, 1);
        }
    }
    
    // تحديث العملات
    for (let i = coinsArray.length - 1; i >= 0; i--) {
        const coin = coinsArray[i];
        coin.y += coin.speed * deltaTime;
        
        // جمع العملة
        if (!coin.collected && 
            coin.lane === player.lane &&
            Math.abs(coin.y - player.y) < 50 &&
            Math.abs(coin.x - player.x) < 50) {
            
            coin.collected = true;
            coins += 1;
            updateUI();
        }
        
        // إزالة العملات البعيدة
        if (coin.y > canvas.height + 100) {
            coinsArray.splice(i, 1);
        }
    }
    
    // إنشاء عوائق وعملات جديدة
    if (Math.random() < 0.02 * gameSpeed) {
        createObstacle();
    }
    
    if (Math.random() < 0.03 * gameSpeed) {
        createCoin();
    }
    
    // زيادة السرعة مع المسافة
    if (distance % 500 < 10 && distance > 100) {
        gameSpeed = Math.min(gameSpeed + 0.1, 3);
        updateUI();
    }
}

// التحقق من التصادم
function checkCollision() {
    for (const obstacle of obstacles) {
        // التحقق من نفس المسار والقرب
        if (obstacle.lane === player.lane) {
            const verticalDistance = Math.abs(obstacle.y + obstacle.height - player.y);
            
            // إذا كان قريباً عمودياً
            if (verticalDistance < 50) {
                let canPass = false;
                
                // القطار يحتاج قفز
                if (obstacle.type === 'train' && player.isJumping) {
                    canPass = true;
                }
                
                // الحاجز يحتاج تزحلق
                if (obstacle.type === 'barrier' && player.isSliding) {
                    canPass = true;
                }
                
                // إذا لم يتمكن من التجاوز
                if (!canPass) {
                    return true;
                }
            }
        }
    }
    return false;
}

// حلقة اللعبة الرئيسية
function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    // حساب deltaTime لتجانس الحركة
    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
    lastTime = currentTime;
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // الرسم
    drawBackground();
    drawObstacles();
    drawCoins();
    drawPlayer();
    
    // التحديث
    updatePlayer();
    updateObjects(deltaTime);
    
    // زيادة المسافة
    distance += gameSpeed * deltaTime;
    
    // التحقق من التصادم
    if (checkCollision()) {
        lives--;
        updateUI();
        
        // إزالة العائق المتصادم
        if (obstacles.length > 0) {
            obstacles.shift();
        }
        
        // انتهاء اللعبة إذا نفذت الأرواح
        if (lives <= 0) {
            endGame();
            return;
        }
    }
    
    // الاستمرار
    animationId = requestAnimationFrame(gameLoop);
}

// انتهاء اللعبة
function endGame() {
    gameRunning = false;
    
    // حساب النتيجة النهائية
    const totalScore = Math.floor(distance) + coins * 100;
    
    // تحديث أفضل نتيجة
    if (totalScore > highScore) {
        highScore = totalScore;
        localStorage.setItem('subwayRunnerHighScore', highScore);
    }
    
    // تحديث شاشة النهاية
    finalDistanceElement.textContent = Math.floor(distance);
    finalCoinsElement.textContent = coins;
    finalScoreElement.textContent = totalScore;
    highScoreElement.textContent = highScore;
    
    // تبديل الشاشة
    switchScreen('end');
    
    // إيقاف الأنيميشن
    cancelAnimationFrame(animationId);
}

// ============================================
// التحكم
// ============================================

function moveLeft() {
    if (player.lane > 0) {
        player.lane--;
    }
}

function moveRight() {
    if (player.lane < 2) {
        player.lane++;
    }
}

function jump() {
    if (!player.isJumping) {
        player.isJumping = true;
        player.velocityY = player.jumpForce;
        player.state = 'jumping';
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = 0;
        player.state = 'sliding';
    }
}

// ============================================
// مستمعي الأحداث
// ============================================

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// أزرار التحكم
leftBtn.addEventListener('click', moveLeft);
rightBtn.addEventListener('click', moveRight);
jumpBtn.addEventListener('click', jump);
slideBtn.addEventListener('click', slide);

// التحكم بلوحة المفاتيح
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft();
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight();
            break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
            jump();
            break;
        case 'ArrowDown':
        case 'KeyS':
            slide();
            break;
    }
});

// التحكم باللمس (للهواتف)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    
    // حركة أفقية
    if (Math.abs(diffX) > 20) {
        if (diffX > 0) moveRight();
        else moveLeft();
        touchStartX = touch.clientX;
    }
    
    // حركة عمودية
    if (Math.abs(diffY) > 20) {
        if (diffY < 0) jump();
        else slide();
        touchStartY = touch.clientY;
    }
});

// ============================================
// التهيئة عند التحميل
// ============================================

window.addEventListener('load', () => {
    console.log("✅ Subway Runner 3D جاهز!");
    console.log("🎮 اضغط على 'ابدأ اللعب' للبدء");
    
    // تحديث أفضل نتيجة
    highScoreElement.textContent = highScore;
    
    // تأكد من أن الشاشة الأولى ظاهرة
    switchScreen('start');
    
    // اختبار بسيط للتأكد من عمل الكونسول
    setTimeout(() => {
        console.log("🎯 اللعبة تستخدم رسومات افتراضية - لا تحتاج صوراً");
        console.log("⬅️  ➡️  حركة يمين/يسار");
        console.log("⬆️  القفز فوق القطارات");
        console.log("⬇️  التزحلق تحت الحواجز");
    }, 500);
});
