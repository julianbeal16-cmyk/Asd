// ============================================
// SUBWAY RUNNER - لعبة 3D مثل Subway Surfers
// ============================================

// العناصر الرئيسية
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// عناصر التحكم
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const jumpBtn = document.getElementById('jump-btn');

// عناصر عرض المعلومات
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const speedElement = document.getElementById('speed');
const livesElement = document.getElementById('lives');
const distanceTraveledElement = document.getElementById('distance-traveled');
const coinsCollectedElement = document.getElementById('coins-collected');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');

// متغيرات اللعبة
let gameRunning = false;
let distance = 0;
let coins = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lives = 3;
let gameSpeed = 1;
let animationId;
let lastTime = 0;

// إعدادات العالم 3D
const WORLD = {
    ROAD_WIDTH: 600,
    ROAD_LENGTH: 2000,
    LANES: 3,
    LANE_WIDTH: 200,
    FOV: 800, // مجال الرؤية
    CAMERA_HEIGHT: 150
};

// تعريف الشخصية (اللاعب)
const player = {
    x: WORLD.ROAD_WIDTH / 2,
    y: 300,
    z: 500, // البعد عن الكاميرا
    lane: 1, // المسار الأوسط (0=يسار, 1=وسط, 2=يمين)
    width: 60,
    height: 90,
    velocityY: 0,
    gravity: 0.8,
    jumpForce: -18,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    moveSpeed: 0,
    targetX: WORLD.ROAD_WIDTH / 2,
    
    // حالات الشخصية
    states: {
        RUNNING: 'running',
        JUMPING: 'jumping',
        SLIDING: 'sliding'
    },
    
    currentState: 'running',
    
    // إطارات الركض
    runFrame: 0,
    runAnimationSpeed: 5,
    runFrameCounter: 0,
    
    // الصور
    image: null,
    imagesLoaded: false
};

// تعريف الطريق
const road = {
    segments: [],
    segmentLength: 200,
    currentZ: 0
};

// تعريف العوائق
const obstacles = [];
const coinsArray = [];

// تعريف الكاميرا
const camera = {
    z: 0,
    speed: 8,
    height: WORLD.CAMERA_HEIGHT
};

// تحميل الصور
function loadImages() {
    player.image = new Image();
    player.image.src = 'assets/character.png';
    
    player.image.onload = function() {
        player.imagesLoaded = true;
        console.log("✅ تم تحميل صورة الشخصية");
    };
    
    player.image.onerror = function() {
        console.log("❌ فشل تحميل صورة الشخصية - سيتم استخدام الرسم الافتراضي");
        player.imagesLoaded = false;
    };
}

// تهيئة الطريق
function initRoad() {
    road.segments = [];
    const numSegments = Math.ceil(WORLD.ROAD_LENGTH / road.segmentLength);
    
    for (let i = 0; i < numSegments; i++) {
        road.segments.push({
            z: i * road.segmentLength,
            curve: Math.sin(i * 0.1) * 50, // منحنى بسيط للطريق
            color: i % 2 === 0 ? '#2a5a8c' : '#1a3a5f'
        });
    }
}

// إنشاء عائق جديد
function createObstacle() {
    const lane = Math.floor(Math.random() * WORLD.LANES);
    const type = Math.random() > 0.5 ? 'train' : 'barrier';
    const size = type === 'train' ? 120 : 60;
    
    obstacles.push({
        lane: lane,
        z: camera.z + 2000, // يبدأ من بعيد
        width: type === 'train' ? 180 : 80,
        height: size,
        type: type,
        color: type === 'train' ? '#e63946' : '#f4a261',
        passed: false
    });
}

// إنشاء عملة جديدة
function createCoin() {
    const lane = Math.floor(Math.random() * WORLD.LANES);
    
    coinsArray.push({
        lane: lane,
        z: camera.z + 1500,
        collected: false,
        rotation: 0
    });
}

// تحويل إحداثيات 3D إلى 2D (المنظور)
function project3DTo2D(x, y, z) {
    const scale = WORLD.FOV / (z - camera.z + WORLD.FOV);
    const screenX = canvas.width / 2 + (x - WORLD.ROAD_WIDTH / 2) * scale;
    const screenY = canvas.height / 2 - (y - camera.height) * scale;
    
    return {
        x: screenX,
        y: screenY,
        scale: scale
    };
}

// رسم الطريق
function drawRoad() {
    // السماء
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGradient.addColorStop(0, '#0a1429');
    skyGradient.addColorStop(1, '#1a3a5f');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // رسم مقاطع الطريق
    for (let i = road.segments.length - 1; i >= 0; i--) {
        const segment = road.segments[i];
        const segmentScreenZ = segment.z - camera.z;
        
        if (segmentScreenZ > -100 && segmentScreenZ < WORLD.FOV) {
            const projStart = project3DTo2D(0, 0, segment.z);
            const projEnd = project3DTo2D(0, 0, segment.z + road.segmentLength);
            
            // الطريق
            ctx.fillStyle = segment.color;
            ctx.beginPath();
            ctx.moveTo(projStart.x - WORLD.ROAD_WIDTH * projStart.scale / 2, projStart.y);
            ctx.lineTo(projStart.x + WORLD.ROAD_WIDTH * projStart.scale / 2, projStart.y);
            ctx.lineTo(projEnd.x + WORLD.ROAD_WIDTH * projEnd.scale / 2, projEnd.y);
            ctx.lineTo(projEnd.x - WORLD.ROAD_WIDTH * projEnd.scale / 2, projEnd.y);
            ctx.closePath();
            ctx.fill();
            
            // خطوط الطريق
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 3 * projStart.scale;
            
            // الخط الأوسط
            ctx.beginPath();
            ctx.moveTo(projStart.x, projStart.y);
            ctx.lineTo(projEnd.x, projEnd.y);
            ctx.stroke();
            
            // خطوط المسارات
            for (let l = 1; l < WORLD.LANES; l++) {
                const laneOffset = (l * WORLD.LANE_WIDTH - WORLD.ROAD_WIDTH / 2) * projStart.scale;
                
                ctx.setLineDash([20 * projStart.scale, 10 * projStart.scale]);
                ctx.beginPath();
                ctx.moveTo(projStart.x + laneOffset, projStart.y);
                ctx.lineTo(projEnd.x + laneOffset, projEnd.y);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }
    }
}

// رسم العوائق
function drawObstacles() {
    for (const obstacle of obstacles) {
        const obstacleZ = obstacle.z - camera.z;
        
        if (obstacleZ > -100 && obstacleZ < WORLD.FOV) {
            const laneX = obstacle.lane * WORLD.LANE_WIDTH + WORLD.LANE_WIDTH / 2;
            const proj = project3DTo2D(laneX, 50, obstacle.z);
            
            if (proj.scale > 0) {
                const width = obstacle.width * proj.scale;
                const height = obstacle.height * proj.scale;
                
                // جسم العائق
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(proj.x - width / 2, proj.y - height, width, height);
                
                // تفاصيل العائق
                ctx.fillStyle = '#333';
                if (obstacle.type === 'train') {
                    // نوافذ القطار
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(
                            proj.x - width / 2 + 20 * proj.scale + i * 40 * proj.scale,
                            proj.y - height + 20 * proj.scale,
                            30 * proj.scale,
                            30 * proj.scale
                        );
                    }
                } else {
                    // تفاصيل الحاجز
                    ctx.fillRect(proj.x - 5 * proj.scale, proj.y - height, 10 * proj.scale, height);
                    ctx.fillRect(proj.x - width / 2, proj.y - 10 * proj.scale, width, 10 * proj.scale);
                }
                
                // ظل
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(proj.x - width / 2, proj.y, width, 10 * proj.scale);
            }
        }
    }
}

// رسم العملات
function drawCoins() {
    for (const coin of coinsArray) {
        const coinZ = coin.z - camera.z;
        
        if (coinZ > -50 && coinZ < WORLD.FOV) {
            const laneX = coin.lane * WORLD.LANE_WIDTH + WORLD.LANE_WIDTH / 2;
            const proj = project3DTo2D(laneX, 100, coin.z);
            
            if (proj.scale > 0) {
                coin.rotation += 0.1;
                const radius = 20 * proj.scale;
                
                ctx.save();
                ctx.translate(proj.x, proj.y);
                ctx.rotate(coin.rotation);
                
                // عملة ذهبية
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(1, '#FFA500');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // تفاصيل العملة
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFD700';
                ctx.font = `${14 * proj.scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 0);
                
                ctx.restore();
                
                // تأثير بريق
                if (Math.sin(coin.rotation * 2) > 0.8) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, radius * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }
}

// رسم الشخصية
function drawPlayer() {
    const playerZ = player.z - camera.z;
    const proj = project3DTo2D(player.x, player.y, player.z);
    
    if (proj.scale > 0) {
        let width = player.width * proj.scale;
        let height = player.height * proj.scale;
        let drawY = proj.y - height;
        
        // تعديل الحجم حسب الحالة
        if (player.currentState === player.states.SLIDING) {
            height *= 0.7;
            drawY = proj.y - height + (player.height * proj.scale * 0.3);
        }
        
        ctx.save();
        ctx.translate(proj.x, drawY + height / 2);
        
        // تأثير الركض
        if (player.currentState === player.states.RUNNING) {
            player.runFrameCounter++;
            if (player.runFrameCounter >= player.runAnimationSpeed) {
                player.runFrame = player.runFrame === 0 ? 1 : 0;
                player.runFrameCounter = 0;
            }
            
            // تمايل بسيط أثناء الركض
            const bounce = Math.sin(Date.now() * 0.01) * 3;
            ctx.translate(0, bounce);
        }
        
        // رسم الصورة أو الرسم الافتراضي
        if (player.imagesLoaded && player.image.complete) {
            // قلب الصورة حسب الاتجاه
            if (player.moveSpeed < 0) {
                ctx.scale(-1, 1);
                ctx.drawImage(player.image, -width / 2, -height / 2, width, height);
            } else {
                ctx.drawImage(player.image, -width / 2, -height / 2, width, height);
            }
        } else {
            // رسم افتراضي
            drawDefaultPlayer(width, height);
        }
        
        // ظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, height / 2, width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // تأثير حالة
        if (player.currentState === player.states.JUMPING) {
            ctx.fillStyle = 'rgba(76, 201, 240, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, width * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// رسم شخصية افتراضية
function drawDefaultPlayer(width, height) {
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    // وجه
    ctx.fillStyle = '#1a3a5f';
    ctx.fillRect(-width / 4, -height / 3, width / 2, height / 4);
    
    // عيون
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-width / 6, -height / 4, width / 10, 0, Math.PI * 2);
    ctx.arc(width / 6, -height / 4, width / 10, 0, Math.PI * 2);
    ctx.fill();
    
    // فم
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -height / 6, width / 8, 0, Math.PI);
    ctx.stroke();
}

// تحديث الشخصية
function updatePlayer() {
    // الحركة الأفقية
    const targetX = player.lane * WORLD.LANE_WIDTH + WORLD.LANE_WIDTH / 2;
    player.x += (targetX - player.x) * 0.1;
    
    // الحركة العمودية (القفز)
    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        
        if (player.y >= 300) {
            player.y = 300;
            player.isJumping = false;
            player.currentState = player.states.RUNNING;
            player.velocityY = 0;
        }
    }
    
    // التزحلق
    if (player.isSliding) {
        player.slideTimer++;
        player.currentState = player.states.SLIDING;
        
        if (player.slideTimer > 40) {
            player.isSliding = false;
            player.slideTimer = 0;
            player.currentState = player.isJumping ? player.states.JUMPING : player.states.RUNNING;
        }
    } else if (player.isJumping) {
        player.currentState = player.states.JUMPING;
    } else {
        player.currentState = player.states.RUNNING;
    }
}

// تحديث العوائق والعملات
function updateObjects() {
    // تحديث وإزالة العوائق
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].z -= camera.speed * gameSpeed;
        
        // التحقق من التجاوز
        if (!obstacles[i].passed && obstacles[i].z < player.z) {
            obstacles[i].passed = true;
            distance += 10;
            updateUI();
        }
        
        // إزالة العوائق البعيدة
        if (obstacles[i].z < camera.z - 500) {
            obstacles.splice(i, 1);
        }
    }
    
    // تحديث وإزالة العملات
    for (let i = coinsArray.length - 1; i >= 0; i--) {
        coinsArray[i].z -= camera.speed * gameSpeed;
        
        // التحقق من جمع العملة
        if (!coinsArray[i].collected && 
            coinsArray[i].lane === player.lane &&
            Math.abs(coinsArray[i].z - player.z) < 100) {
            
            coinsArray[i].collected = true;
            coins += 1;
            updateUI();
        }
        
        // إزالة العملات البعيدة
        if (coinsArray[i].z < camera.z - 500) {
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
}

// التحقق من التصادم
function checkCollision() {
    for (const obstacle of obstacles) {
        // التحقق من نفس المسار والقرب
        if (obstacle.lane === player.lane && 
            Math.abs(obstacle.z - player.z) < 150 &&
            !obstacle.passed) {
            
            // التحقق من إمكانية التجاوز
            let canPass = false;
            
            if (obstacle.type === 'train' && player.currentState === player.states.JUMPING) {
                canPass = true; // القطار يحتاج قفز
            } else if (obstacle.type === 'barrier' && player.currentState === player.states.SLIDING) {
                canPass = true; // الحاجز يحتاج تزحلق
            }
            
            if (!canPass) {
                return true;
            }
        }
    }
    return false;
}

// تحريك الكاميرا (الطريق)
function updateCamera() {
    camera.z += camera.speed * gameSpeed;
    distance += camera.speed * 0.1;
    
    // تحديث شريط العمق
    const depthBar = document.querySelector('.depth-bar');
    const depthPercent = (camera.z % 1000) / 10;
    depthBar.style.width = `${depthPercent}%`;
    
    // زيادة السرعة كل 500 متر
    if (distance % 500 < 1 && distance > 100) {
        gameSpeed = Math.min(gameSpeed + 0.1, 3);
        updateUI();
    }
}

// تحديث واجهة المستخدم
function updateUI() {
    distanceElement.textContent = `${Math.floor(distance)} م`;
    coinsElement.textContent = coins;
    speedElement.textContent = `${gameSpeed.toFixed(1)}x`;
    livesElement.textContent = lives;
    highScoreElement.textContent = highScore;
}

// تهيئة اللعبة
function initGame() {
    // إعادة تعيين القيم
    distance = 0;
    coins = 0;
    lives = 3;
    gameSpeed = 1;
    
    // إعادة تعيين الشخصية
    player.lane = 1;
    player.x = WORLD.ROAD_WIDTH / 2;
    player.y = 300;
    player.z = 500;
    player.isJumping = false;
    player.isSliding = false;
    player.currentState = player.states.RUNNING;
    
    // إعادة تعيين الكاميرا
    camera.z = 0;
    
    // تفريغ المصفوفات
    obstacles.length = 0;
    coinsArray.length = 0;
    
    // تهيئة الطريق
    initRoad();
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // الانتقال إلى شاشة اللعبة
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    endScreen.classList.remove('active');
    
    gameRunning = true;
    lastTime = performance.now();
    
    // بدء حلقة اللعبة
    gameLoop();
}

// حلقة اللعبة الرئيسية
function gameLoop(currentTime = 0) {
    if (!gameRunning) return;
    
    const deltaTime = (currentTime - lastTime) / 16.67; // تجانس الحركة
    lastTime = currentTime;
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم وتحديث المكونات
    drawRoad();
    drawObstacles();
    drawCoins();
    drawPlayer();
    
    updatePlayer();
    updateObjects();
    updateCamera();
    
    // التحقق من التصادم
    if (checkCollision()) {
        lives--;
        updateUI();
        
        // إزالة العائق المتصادم
        if (obstacles.length > 0) {
            obstacles.shift();
        }
        
        if (lives <= 0) {
            endGame();
            return;
        }
    }
    
    // استمرار اللعبة
    animationId = requestAnimationFrame(gameLoop);
}

// انتهاء اللعبة
function endGame() {
    gameRunning = false;
    
    // تحديث أفضل نتيجة
    const totalScore = Math.floor(distance) + coins * 100;
    if (totalScore > highScore) {
        highScore = totalScore;
        localStorage.setItem('highScore', highScore);
    }
    
    // تحديث شاشة النهاية
    distanceTraveledElement.textContent = Math.floor(distance);
    coinsCollectedElement.textContent = coins;
    finalScoreElement.textContent = totalScore;
    highScoreElement.textContent = highScore;
    
    // الانتقال إلى شاشة النهاية
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    // إلغاء طلب الرسم المتحرك
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}

// التحكم في الحركة
function moveLeft() {
    if (player.lane > 0) {
        player.lane--;
        player.moveSpeed = -5;
    }
}

function moveRight() {
    if (player.lane < WORLD.LANES - 1) {
        player.lane++;
        player.moveSpeed = 5;
    }
}

function jump() {
    if (!player.isJumping) {
        player.isJumping = true;
        player.velocityY = player.jumpForce;
        player.currentState = player.states.JUMPING;
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = 0;
        player.currentState = player.states.SLIDING;
    }
}

// إضافة مستمعي الأحداث
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// مستمعي أزرار التحكم
leftBtn.addEventListener('click', moveLeft);
rightBtn.addEventListener('click', moveRight);
upBtn.addEventListener('click', jump);
downBtn.addEventListener('click', slide);
jumpBtn.addEventListener('click', jump);

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

// التحكم باللمس (سحب)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    
    // تحريك أفقي
    if (Math.abs(diffX) > 20) {
        if (diffX > 0) moveRight();
        else moveLeft();
        touchStartX = touchX;
    }
    
    // تحريك عمودي
    if (Math.abs(diffY) > 20) {
        if (diffY < 0) jump();
        else slide();
        touchStartY = touchY;
    }
});

// بدء تحميل الصور
loadImages();

// عرض أفضل نتيجة محفوظة
highScoreElement.textContent = highScore;

// إضافة تأثير عند تحميل الصفحة
window.addEventListener('load', () => {
    console.log("🎮 Subway Runner 3D جاهز!");
    console.log("🎯 حرك الشخصية يمين/يسار لتجنب العوائق");
    console.log("⬆️  اضغط للقفز فوق القطارات");
    console.log("⬇️  اضغط للتزحلق تحت الحواجز");
    
    setTimeout(() => {
        alert("🎮 مرحباً بك في Subway Runner 3D!\n\nمثل Subway Surfers:\n• حرك يمين/يسار\n• القفز فوق القطارات\n• التزحلق تحت الحواجز\n• جمع العملات\n\nابدأ الركض!");
    }, 500);
});
