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
        character: null, // صورتك الأصلية
        run1: null,
        run2: null,
        jump: null,
        slide: null
    },
    
    // للإشارة إلى ما إذا تم تحميل الصور بنجاح
    imagesLoaded: false
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
    let loadedCount = 0;
    const totalImages = 5;
    
    // دالة للتحقق من تحميل جميع الصور
    function checkAllLoaded() {
        loadedCount++;
        if (loadedCount === totalImages) {
            character.imagesLoaded = true;
            console.log("✅ تم تحميل جميع الصور بنجاح!");
        }
    }
    
    // 1. تحميل صورتك الأصلية - ستستخدم لكل الحالات
    character.images.character = new Image();
    character.images.character.src = 'assets/character.png';
    character.images.character.onload = function() {
        console.log("✅ تم تحميل character.png");
        checkAllLoaded();
    };
    character.images.character.onerror = function() {
        console.log("❌ فشل تحميل character.png - سيتم استخدام الرسم الافتراضي");
        checkAllLoaded();
    };
    
    // 2. صور الركض (سيتم استخدام صورتك مع تعديل بسيط)
    character.images.run1 = new Image();
    character.images.run1.src = 'assets/character.png'; // نفس الصورة ولكن سنعدلها برمجياً
    character.images.run1.onload = function() {
        console.log("✅ تم تحميل run1.png (باستخدام character.png)");
        checkAllLoaded();
    };
    
    character.images.run2 = new Image();
    character.images.run2.src = 'assets/character.png'; // نفس الصورة ولكن سنعدلها برمجياً
    character.images.run2.onload = function() {
        console.log("✅ تم تحميل run2.png (باستخدام character.png)");
        checkAllLoaded();
    };
    
    // 3. صورة القفز
    character.images.jump = new Image();
    character.images.jump.src = 'assets/character.png'; // نفس الصورة
    character.images.jump.onload = function() {
        console.log("✅ تم تحميل jump.png (باستخدام character.png)");
        checkAllLoaded();
    };
    
    // 4. صورة التزحلق
    character.images.slide = new Image();
    character.images.slide.src = 'assets/character.png'; // نفس الصورة ولكن سنعدلها برمجياً
    character.images.slide.onload = function() {
        console.log("✅ تم تحميل slide.png (باستخدام character.png)");
        checkAllLoaded();
    };
    
    // إذا فشل تحميل الصورة الأصلية، نستخدم نسخة احتياطية
    setTimeout(() => {
        if (!character.imagesLoaded && loadedCount < totalImages) {
            console.log("⚠️  بعض الصور لم تحمل، سيتم استخدام البدائل");
            character.imagesLoaded = true;
        }
    }, 3000);
}

// إنشاء نسخة من الصورة مع تأثيرات مختلفة
function createImageEffect(baseImage, effectType) {
    // إنشاء عنصر canvas مؤقت
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = baseImage.width || character.width;
    tempCanvas.height = baseImage.height || character.height;
    
    // رسم الصورة الأصلية
    tempCtx.drawImage(baseImage, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // تطبيق التأثيرات حسب الحالة
    if (effectType === 'run1') {
        // تأثير الركض 1: إمالة بسيطة للأمام
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.save();
        tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
        tempCtx.rotate(0.05); // إمالة بسيطة
        tempCtx.drawImage(baseImage, -tempCanvas.width/2, -tempCanvas.height/2, tempCanvas.width, tempCanvas.height);
        tempCtx.restore();
    }
    else if (effectType === 'run2') {
        // تأثير الركض 2: إمالة معكوسة
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.save();
        tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
        tempCtx.rotate(-0.05); // إمالة عكسية
        tempCtx.drawImage(baseImage, -tempCanvas.width/2, -tempCanvas.height/2, tempCanvas.width, tempCanvas.height);
        tempCtx.restore();
    }
    else if (effectType === 'jump') {
        // تأثير القفز: الصورة طبيعية (بدون تغيير)
        // يمكن إضافة تأثير ظل إذا أردت
        tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        tempCtx.shadowBlur = 10;
        tempCtx.shadowOffsetY = 5;
        tempCtx.drawImage(baseImage, 0, 0, tempCanvas.width, tempCanvas.height);
    }
    else if (effectType === 'slide') {
        // تأثير التزحلق: تصغير وإمالة
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        const slideHeight = tempCanvas.height * 0.7;
        const offsetY = tempCanvas.height - slideHeight;
        
        tempCtx.save();
        // قص الجزء العلوي للتزحلق
        tempCtx.drawImage(
            baseImage, 
            0, offsetY/2, // بداية القص من منتصف الصورة
            tempCanvas.width, slideHeight, // حجم القص
            0, offsetY, // مكان الرسم
            tempCanvas.width, slideHeight // حجم الرسم
        );
        tempCtx.restore();
    }
    
    // تحويل Canvas إلى Image
    const resultImage = new Image();
    resultImage.src = tempCanvas.toDataURL();
    return resultImage;
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
    // إذا لم يتم تحميل الصور بعد، استخدم الرسم الافتراضي
    if (!character.imagesLoaded || !character.images.character.complete) {
        drawDefaultCharacter();
        return;
    }
    
    let charImg = character.images.character; // الصورة الأساسية
    
    // حساب أبعاد الرسم بناءً على الحالة
    let drawWidth = character.width;
    let drawHeight = character.height;
    let drawY = character.y;
    let rotation = 0;
    
    switch (character.currentState) {
        case character.states.RUNNING:
            // تأثير الركض: تمايل بسيط
            character.runFrameCounter++;
            if (character.runFrameCounter >= character.runAnimationSpeed) {
                character.runFrame = character.runFrame === 0 ? 1 : 0;
                character.runFrameCounter = 0;
            }
            // تمايل بسيط أثناء الركض
            rotation = character.runFrame === 0 ? 0.05 : -0.05;
            break;
            
        case character.states.JUMPING:
            // القفز: بدون دوران
            rotation = 0;
            break;
            
        case character.states.SLIDING:
            // التزحلق: تصغير وإمالة
            drawHeight = character.height * 0.7;
            drawY = character.y + (character.height - drawHeight);
            rotation = 0.3; // إمالة للأمام
            break;
    }
    
    // تطبيق التحويلات
    ctx.save();
    ctx.translate(character.x + drawWidth/2, drawY + drawHeight/2);
    ctx.rotate(rotation);
    
    // رسم الصورة
    if (charImg.complete && charImg.naturalWidth > 0) {
        ctx.drawImage(charImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        
        // إضافة تأثير ظل للقفز
        if (character.currentState === character.states.JUMPING) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;
            ctx.drawImage(charImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        }
    } else {
        // إذا فشل رسم الصورة، ارسم الشكل الافتراضي
        drawDefaultCharacterAtPosition(-drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
    }
    
    ctx.restore();
    
    // إضافة نص الحالة للتتبع (يمكن إزالته لاحقاً)
    ctx.fillStyle = '#fff';
    ctx.font = '12px Cairo';
    let stateText = '';
    if (character.currentState === character.states.RUNNING) stateText = 'يجري';
    if (character.currentState === character.states.JUMPING) stateText = 'يقفز';
    if (character.currentState === character.states.SLIDING) stateText = 'يتزحلق';
    
    ctx.fillText(stateText, character.x, character.y - 10);
}

// رسم شخصية افتراضية في موقع محدد
function drawDefaultCharacterAtPosition(x, y, width, height) {
    ctx.fillStyle = '#fdbb2d';
    ctx.fillRect(x, y, width, height);
    
    // رسم العيون
    ctx.fillStyle = 'white';
    ctx.fillRect(x + 10, y + 15, 10, 10);
    ctx.fillRect(x + width - 20, y + 15, 10, 10);
    
    // رسم الحدود
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

// رسم شخصية افتراضية (النسخة الأصلية)
function drawDefaultCharacter() {
    drawDefaultCharacterAtPosition(character.x, character.y, character.width, character.height);
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
            
            // زيادة السرعة كل 50 نقطة
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
        charHeight = character.height * 0.7;
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
    console.log("🎮 تم تحميل اللعبة بنجاح!");
    console.log("💡 نصائح:");
    console.log("- تأكد من وجود ملف character.png في مجلد assets");
    console.log("- يمكنك النقر على الشاشة للقفز (النصف العلوي) أو التزحلق (النصف السفلي)");
    
    // عرض رسالة ترحيب
    setTimeout(() => {
        alert("🎯 مرحباً بك في لعبة العدّاء!\n\n✅ الصورة الشخصية جاهزة\n✅ أنيميشين الركض جاهزة\n✅ القفز يعمل\n✅ التزحلق يعمل\n\nاضغط على 'ابدأ اللعب' للبدء!");
    }, 500);
});
