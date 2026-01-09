// العناصر الرئيسية
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// عناصر التحكم
const jumpBtn = document.getElementById('jump-btn');
const slideBtn = document.getElementById('slide-btn');

// عناصر عرض المعلومات
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const obstaclesPassedElement = document.getElementById('obstacles-passed');

// متغيرات اللعبة
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lives = 3;
let gameSpeed = 1;
let obstaclesPassed = 0;
let animationId;

// تعريف الشخصية
const character = {
    x: 100,
    y: 300,
    width: 60,
    height: 90,
    velocityY: 0,
    gravity: 0.8,
    jumpForce: -15,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    
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
    
    // الصور (سيتم تحميلها لاحقاً)
    images: {
        idle: null,
        run1: null,
        run2: null,
        jump: null,
        slide: null
    }
};

// تعريف العوائق
const obstacles = [];
const obstacleTypes = [
    { width: 40, height: 60, color: '#b21f1f', type: 'jump' }, // يحتاج لقفز
    { width: 80, height: 40, color: '#1a2a6c', type: 'slide' } // يحتاج لتزحلق
];

// تعريف الخلفية
const background = {
    x: 0,
    speed: 2
};

// تحميل الصور
function loadImages() {
    // إذا كانت الصور غير موجودة، سنستخدم أشكالاً مرسومة
    character.images.idle = new Image();
    character.images.idle.src = 'assets/character.png';
    
    character.images.run1 = new Image();
    character.images.run1.src = 'assets/run1.png';
    
    character.images.run2 = new Image();
    character.images.run2.src = 'assets/run2.png';
    
    character.images.jump = new Image();
    character.images.jump.src = 'assets/jump.png';
    
    character.images.slide = new Image();
    character.images.slide.src = 'assets/slide.png';
    
    // إذا فشل تحميل الصور، نستخدم رسومات بديلة
    Object.values(character.images).forEach(img => {
        img.onerror = function() {
            // سنستخدم الرسومات الافتراضية بدلاً من الصور
            console.log("فشل تحميل الصورة، سيتم استخدام الرسومات الافتراضية");
        };
    });
}

// تهيئة اللعبة
function initGame() {
    // إعادة تعيين القيم
    score = 0;
    lives = 3;
    gameSpeed = 1;
    obstaclesPassed = 0;
    
    // إعادة تعيين الشخصية
    character.x = 100;
    character.y = 300;
    character.velocityY = 0;
    character.isJumping = false;
    character.isSliding = false;
    character.currentState = character.states.RUNNING;
    
    // تفريغ العوائق
    obstacles.length = 0;
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // الانتقال إلى شاشة اللعبة
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    endScreen.classList.remove('active');
    
    gameRunning = true;
    
    // بدء حلقة اللعبة
    gameLoop();
}

// تحديث واجهة المستخدم
function updateUI() {
    scoreElement.textContent = score;
    speedElement.textContent = `${gameSpeed.toFixed(1)}x`;
    livesElement.textContent = lives;
    highScoreElement.textContent = highScore;
}

// رسم الخلفية
function drawBackground() {
    // خلفية متدرجة
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a2a6c');
    gradient.addColorStop(0.5, '#0a0e29');
    gradient.addColorStop(1, '#1a2a6c');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // رسم أرضية اللعبة
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // خط النهاية
    ctx.fillStyle = '#fdbb2d';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 3);
    
    // رسم نجوم في الخلفية
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 40 + background.x) % canvas.width;
        const y = (i * 13) % (canvas.height - 100);
        const size = Math.random() * 2 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // تحريك الخلفية
    background.x -= background.speed * gameSpeed;
}

// رسم الشخصية
function drawCharacter() {
    let charImg = null;
    
    // تحديد الصورة المناسبة بناءً على حالة الشخصية
    switch (character.currentState) {
        case character.states.RUNNING:
            // تبديل بين إطارين للركض
            character.runFrameCounter++;
            if (character.runFrameCounter >= character.runAnimationSpeed) {
                character.runFrame = character.runFrame === 0 ? 1 : 0;
                character.runFrameCounter = 0;
            }
            
            charImg = character.runFrame === 0 ? character.images.run1 : character.images.run2;
            break;
            
        case character.states.JUMPING:
            charImg = character.images.jump;
            break;
            
        case character.states.SLIDING:
            charImg = character.images.slide;
            break;
    }
    
    // إذا فشل تحميل الصور، استخدم الرسومات الافتراضية
    if (!charImg || !charImg.complete || charImg.naturalWidth === 0) {
        drawDefaultCharacter();
        return;
    }
    
    // حساب أبعاد الشخصية بناءً على حالتها
    let drawWidth = character.width;
    let drawHeight = character.height;
    let drawY = character.y;
    
    if (character.currentState === character.states.SLIDING) {
        drawHeight = character.height * 0.6;
        drawY = character.y + (character.height - drawHeight);
    }
    
    // رسم الصورة
    ctx.drawImage(charImg, character.x, drawY, drawWidth, drawHeight);
}

// رسم شخصية افتراضية (إذا لم تتحمّل الصور)
function drawDefaultCharacter() {
    ctx.save();
    
    // تغيير لون الشخصية حسب حالتها
    let color = '#fdbb2d'; // لون أساسي
    if (character.currentState === character.states.JUMPING) color = '#1a2a6c';
    if (character.currentState === character.states.SLIDING) color = '#b21f1f';
    
    // جسم الشخصية
    ctx.fillStyle = color;
    
    let drawHeight = character.height;
    let drawY = character.y;
    
    if (character.currentState === character.states.SLIDING) {
        drawHeight = character.height * 0.6;
        drawY = character.y + (character.height - drawHeight);
    }
    
    ctx.fillRect(character.x, drawY, character.width, drawHeight);
    
    // رسم العيون
    ctx.fillStyle = 'white';
    ctx.fillRect(character.x + 10, drawY + 15, 10, 10);
    ctx.fillRect(character.x + character.width - 20, drawY + 15, 10, 10);
    
    // رسم الحدود
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(character.x, drawY, character.width, drawHeight);
    
    // إضافة اسم للحالة
    ctx.fillStyle = '#fff';
    ctx.font = '12px Cairo';
    let stateText = '';
    if (character.currentState === character.states.RUNNING) stateText = 'يجري';
    if (character.currentState === character.states.JUMPING) stateText = 'يقفز';
    if (character.currentState === character.states.SLIDING) stateText = 'يتزحلق';
    
    ctx.fillText(stateText, character.x, drawY - 5);
    
    ctx.restore();
}

// إنشاء عائق جديد
function createObstacle() {
    const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const obstacle = {
        x: canvas.width,
        y: canvas.height - 20 - obstacleType.height,
        width: obstacleType.width,
        height: obstacleType.height,
        color: obstacleType.color,
        type: obstacleType.type,
        passed: false
    };
    
    obstacles.push(obstacle);
}

// رسم العوائق
function drawObstacles() {
    obstacles.forEach(obstacle => {
        // إذا فشل تحميل الصور، استخدم الرسومات الافتراضية
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // إضافة حدود للعائق
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // إضافة أيقونة نوع العائق
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        
        let icon = '';
        if (obstacle.type === 'jump') icon = '⬆️';
        if (obstacle.type === 'slide') icon = '⬇️';
        
        ctx.fillText(icon, obstacle.x + obstacle.width/2 - 10, obstacle.y - 10);
    });
}

// تحديث العوائق
function updateObstacles() {
    // تحريك العوائق
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 5 * gameSpeed;
        
        // إذا تجاوز العائق اللاعب ولم يتم احتسابه بعد
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < character.x) {
            obstacles[i].passed = true;
            score += 5;
            obstaclesPassed++;
            
            // زيادة السرعة كل 10 نقاط
            if (score % 50 === 0) {
                gameSpeed += 0.2;
            }
            
            updateUI();
        }
        
        // إذا خرج العائق من الشاشة، قم بإزالته
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // إنشاء عوائق جديدة
    if (Math.random() < 0.02 * gameSpeed) {
        createObstacle();
    }
}

// التحقق من التصادم
function checkCollision() {
    // حدود الشخصية بناءً على حالتها
    let charHeight = character.height;
    let charY = character.y;
    
    if (character.currentState === character.states.SLIDING) {
        charHeight = character.height * 0.6;
        charY = character.y + (character.height - charHeight);
    }
    
    const charBounds = {
        x: character.x + 10, // تقليل عرض الشخصية قليلاً للتصادم
        y: charY + 10, // تقليل ارتفاع الشخصية قليلاً للتصادم
        width: character.width - 20,
        height: charHeight - 20
    };
    
    // التحقق من تصادم مع كل عائق
    for (const obstacle of obstacles) {
        const obstacleBounds = {
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.width,
            height: obstacle.height
        };
        
        // التحقق من التداخل
        if (charBounds.x < obstacleBounds.x + obstacleBounds.width &&
            charBounds.x + charBounds.width > obstacleBounds.x &&
            charBounds.y < obstacleBounds.y + obstacleBounds.height &&
            charBounds.y + charBounds.height > obstacleBounds.y) {
            
            // التحقق من إمكانية تجاوز العائق
            let canPass = false;
            
            if (obstacle.type === 'jump' && character.currentState === character.states.JUMPING) {
                canPass = true;
            }
            
            if (obstacle.type === 'slide' && character.currentState === character.states.SLIDING) {
                canPass = true;
            }
            
            // إذا لم يتمكن اللاعب من تجاوز العائق، فقد حياة
            if (!canPass) {
                return true;
            }
        }
    }
    
    return false;
}

// تحديث الشخصية
function updateCharacter() {
    // تطبيق الجاذبية
    if (character.isJumping) {
        character.velocityY += character.gravity;
        character.y += character.velocityY;
        
        // التحقق من وصول الشخصية للأرض
        if (character.y >= 300) {
            character.y = 300;
            character.isJumping = false;
            character.currentState = character.states.RUNNING;
            character.velocityY = 0;
        }
    }
    
    // تحديث حالة التزحلق
    if (character.isSliding) {
        character.slideTimer++;
        character.currentState = character.states.SLIDING;
        
        // إنهاء التزحلق بعد فترة
        if (character.slideTimer > 30) {
            character.isSliding = false;
            character.slideTimer = 0;
            character.currentState = character.isJumping ? character.states.JUMPING : character.states.RUNNING;
        }
    } else if (character.isJumping) {
        character.currentState = character.states.JUMPING;
    } else {
        character.currentState = character.states.RUNNING;
    }
}

// القفز
function jump() {
    if (!character.isJumping) {
        character.isJumping = true;
        character.velocityY = character.jumpForce;
        character.currentState = character.states.JUMPING;
    }
}

// التزحلق
function slide() {
    if (!character.isSliding && !character.isJumping) {
        character.isSliding = true;
        character.slideTimer = 0;
        character.currentState = character.states.SLIDING;
    }
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    if (!gameRunning) return;
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم المكونات
    drawBackground();
    drawCharacter();
    drawObstacles();
    
    // تحديث المكونات
    updateCharacter();
    updateObstacles();
    
    // التحقق من التصادم
    if (checkCollision()) {
        lives--;
        updateUI();
        
        // إزالة العائق الذي تسبب في التصادم
        if (obstacles.length > 0) {
            obstacles.shift();
        }
        
        // إذا نفذت الأرواح، انتهت اللعبة
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
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // تحديث شاشة النهاية
    finalScoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    obstaclesPassedElement.textContent = obstaclesPassed;
    
    // الانتقال إلى شاشة النهاية
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    // إلغاء طلب الرسم المتحرك
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}

// إضافة مستمعي الأحداث
startBtn.addEventListener('click', () => {
    initGame();
});

restartBtn.addEventListener('click', () => {
    initGame();
});

jumpBtn.addEventListener('click', jump);
slideBtn.addEventListener('click', slide);

// إضافة التحكم باللمس
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // القفز عند النقر في النصف العلوي من الشاشة
    if (e.touches[0].clientY < window.innerHeight / 2) {
        jump();
    } 
    // التزحلق عند النقر في النصف السفلي من الشاشة
    else {
        slide();
    }
});

// إضافة التحكم بلوحة المفاتيح
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    } else if (e.code === 'ArrowDown') {
        slide();
    }
});

// بدء تحميل الصور
loadImages();

// عرض أفضل نتيجة محفوظة
highScoreElement.textContent = highScore;

// إضافة تأثير عند تحميل الصفحة
window.addEventListener('load', () => {
    console.log("تم تحميل اللعبة بنجاح!");
    
    // عرض رسالة ترحيب
    setTimeout(() => {
        alert("مرحباً بك في لعبة العدّاء! اضغط على 'ابدأ اللعب' للبدء.");
    }, 500);
});
