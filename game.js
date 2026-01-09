// ============================================
// SUBWAY RUNNER PRO - Ultimate 3D Edition
// إصدار نهائي مع دعم الصور و3D خارقة
// ============================================

// نظام إدارة الصور الذكي
class ImageManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.callbacks = [];
        this.loadingProgress = 0;
    }

    loadImages(imageList) {
        this.totalCount = Object.keys(imageList).length;
        
        Object.entries(imageList).forEach(([key, path]) => {
            const img = new Image();
            img.src = path;
            
            img.onload = () => {
                this.loadedCount++;
                this.images[key] = img;
                this.updateProgress();
                
                if (this.loadedCount === this.totalCount) {
                    console.log(`✅ تم تحميل ${this.loadedCount} صور بنجاح`);
                    this.callbacks.forEach(callback => callback(true));
                }
            };
            
            img.onerror = () => {
                console.warn(`⚠️ فشل تحميل الصورة: ${path}`);
                this.loadedCount++;
                this.images[key] = this.createFallbackImage(key);
                this.updateProgress();
                
                if (this.loadedCount === this.totalCount) {
                    console.log(`✅ تم تحميل ${this.loadedCount} صور (باستخدام بدائل)`);
                    this.callbacks.forEach(callback => callback(true));
                }
            };
        });
    }

    updateProgress() {
        this.loadingProgress = (this.loadedCount / this.totalCount) * 100;
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = `تحميل الصور: ${Math.round(this.loadingProgress)}%`;
        }
    }

    createFallbackImage(type) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        
        switch(type) {
            case 'character':
                this.drawCharacterFallback(ctx, 50, 50, 40);
                break;
            case 'run1':
                this.drawRunningFallback(ctx, 50, 50, 40, 'frame1');
                break;
            case 'run2':
                this.drawRunningFallback(ctx, 50, 50, 40, 'frame2');
                break;
            case 'jump':
                this.drawJumpFallback(ctx, 50, 50, 40);
                break;
            case 'slide':
                this.drawSlideFallback(ctx, 50, 50, 40);
                break;
            default:
                this.drawGenericFallback(ctx, 50, 50, 40, type);
        }
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    drawCharacterFallback(ctx, x, y, size) {
        ctx.fillStyle = '#4cc9f0';
        ctx.fillRect(x - size/2, y - size, size, size * 1.5);
        
        // الرأس
        ctx.fillStyle = '#1a3a5f';
        ctx.fillRect(x - size/2 + 10, y - size + 10, size - 20, 30);
        
        // العيون
        ctx.fillStyle = 'white';
        ctx.fillRect(x - 15, y - size + 20, 10, 10);
        ctx.fillRect(x + 5, y - size + 20, 10, 10);
    }

    drawRunningFallback(ctx, x, y, size, frame) {
        const legOffset = frame === 'frame1' ? 10 : -10;
        
        ctx.fillStyle = '#4361ee';
        ctx.fillRect(x - size/2, y - size, size, size * 1.5);
        
        // الرجل المتحركة
        ctx.fillStyle = '#3a0ca3';
        ctx.fillRect(x - size/4 + legOffset, y, size/2, size/2);
    }

    drawJumpFallback(ctx, x, y, size) {
        ctx.fillStyle = '#f72585';
        ctx.beginPath();
        ctx.arc(x, y - size, size, 0, Math.PI * 2);
        ctx.fill();
        
        // تأثير القفز
        ctx.strokeStyle = '#b5179e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y - size, size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSlideFallback(ctx, x, y, size) {
        ctx.fillStyle = '#f8961e';
        ctx.fillRect(x - size/2, y - size/2, size, size);
        
        // تأثير الحركة
        ctx.strokeStyle = '#f3722c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - size, y - size/2);
        ctx.lineTo(x + size, y - size/2);
        ctx.stroke();
    }

    drawGenericFallback(ctx, x, y, size, type) {
        ctx.fillStyle = '#2a5a8c';
        ctx.fillRect(x - size/2, y - size/2, size, size);
        
        ctx.fillStyle = '#4cc9f0';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.charAt(0).toUpperCase(), x, y);
    }

    getImage(key) {
        return this.images[key] || this.createFallbackImage(key);
    }

    onLoad(callback) {
        if (this.loadedCount === this.totalCount && this.totalCount > 0) {
            callback(true);
        } else {
            this.callbacks.push(callback);
        }
    }
}

// العناصر الرئيسية
const imageManager = new ImageManager();
const gameContainer = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const pauseMenu = document.getElementById('pause-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartPauseBtn = document.getElementById('restart-pause-btn');
const homePauseBtn = document.getElementById('home-pause-btn');

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ضبط أبعاد Canvas لتناسب الشاشة
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // تحديث إعدادات 3D بناءً على الحجم الجديد
    if (world3D) {
        world3D.updateViewport(canvas.width, canvas.height);
    }
}

// عناصر التحكم
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const jumpBtn = document.getElementById('jump-btn');
const slideBtn = document.getElementById('slide-btn');

// عناصر الإحصائيات
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const speedElement = document.getElementById('speed');
const livesElement = document.getElementById('lives');
const speedFill = document.getElementById('speed-fill');
const finalDistanceElement = document.getElementById('final-distance');
const finalCoinsElement = document.getElementById('final-coins');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');

// متغيرات اللعبة
let gameRunning = false;
let gamePaused = false;
let distance = 0;
let coins = 0;
let lives = 3;
let gameSpeed = 1;
let highScore = localStorage.getItem('subwayRunnerProHighScore') || 0;
let animationId;
let lastTime = 0;
let world3D = null;

// ============================================
// نظام 3D المتقدم
// ============================================

class World3D {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // إعدادات الكاميرا
        this.camera = {
            x: 0,
            y: 200,
            z: 500,
            fov: 1000,
            near: 100,
            far: 3000,
            tilt: 0.2 // ميل الكاميرا
        };
        
        // الطريق
        this.road = {
            width: 400,
            length: 5000,
            segments: [],
            segmentLength: 200,
            curve: 0,
            curveTarget: 0
        };
        
        // المسارات
        this.lanes = [
            { x: -150, color: '#2a5a8c' },
            { x: 0, color: '#1a3a5f' },
            { x: 150, color: '#2a5a8c' }
        ];
        
        // الإضاءة
        this.lights = {
            ambient: 0.3,
            directional: {
                x: -1,
                y: -1,
                z: -1,
                intensity: 0.7
            }
        };
        
        // تهيئة الطريق
        this.initRoad();
        
        // ألوان
        this.colors = {
            skyTop: '#0a1429',
            skyBottom: '#1a3a5f',
            road: '#14213d',
            roadLine: '#4cc9f0',
            obstacleTrain: '#e63946',
            obstacleBarrier: '#f4a261',
            coin: '#FFD700',
            coinGlow: '#FFA500'
        };
    }
    
    initRoad() {
        this.road.segments = [];
        const numSegments = Math.ceil(this.road.length / this.road.segmentLength);
        
        for (let i = 0; i < numSegments; i++) {
            this.road.segments.push({
                z: i * this.road.segmentLength,
                curve: Math.sin(i * 0.05) * 50,
                color: i % 2 === 0 ? this.colors.road : '#1a2436'
            });
        }
    }
    
    updateViewport(width, height) {
        this.width = width;
        this.height = height;
    }
    
    project3D(x, y, z) {
        const scale = this.camera.fov / (z - this.camera.z + this.camera.fov);
        const screenX = this.width / 2 + (x - this.camera.x) * scale;
        const screenY = this.height / 2 - (y - this.camera.y) * scale * (1 - this.camera.tilt);
        
        return {
            x: screenX,
            y: screenY,
            scale: scale,
            visible: z > this.camera.near && z < this.camera.far
        };
    }
    
    drawSky(ctx) {
        // خلفية متدرجة
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        gradient.addColorStop(0, this.colors.skyTop);
        gradient.addColorStop(1, this.colors.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height * 0.6);
        
        // النجوم
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 13) % (this.height * 0.6);
            const size = Math.random() * 1.5 + 0.5;
            const alpha = Math.random() * 0.5 + 0.5;
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // القمر
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.width * 0.8, this.height * 0.2, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawRoad(ctx, cameraZ) {
        // رسم مقاطع الطريق
        for (let i = this.road.segments.length - 1; i >= 0; i--) {
            const segment = this.road.segments[i];
            const segmentZ = segment.z - cameraZ;
            
            if (segmentZ > -this.road.segmentLength && segmentZ < this.camera.fov) {
                const start = this.project3D(segment.curve, 0, segment.z);
                const end = this.project3D(segment.curve, 0, segment.z + this.road.segmentLength);
                
                if (start.visible && end.visible) {
                    // الطريق
                    ctx.fillStyle = segment.color;
                    ctx.beginPath();
                    ctx.moveTo(start.x - this.road.width * start.scale / 2, start.y);
                    ctx.lineTo(start.x + this.road.width * start.scale / 2, start.y);
                    ctx.lineTo(end.x + this.road.width * end.scale / 2, end.y);
                    ctx.lineTo(end.x - this.road.width * end.scale / 2, end.y);
                    ctx.closePath();
                    ctx.fill();
                    
                    // خطوط الطريق
                    this.drawRoadLines(ctx, start, end, segmentZ);
                }
            }
        }
    }
    
    drawRoadLines(ctx, start, end, segmentZ) {
        // الخط الأوسط
        ctx.strokeStyle = this.colors.roadLine;
        ctx.lineWidth = 4 * start.scale;
        ctx.setLineDash([30 * start.scale, 20 * start.scale]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // خطوط المسارات
        ctx.lineWidth = 2 * start.scale;
        ctx.setLineDash([20 * start.scale, 15 * start.scale]);
        
        this.lanes.forEach((lane, index) => {
            if (index > 0) { // لا نرسم الخط الأول
                const laneStartX = start.x + lane.x * start.scale;
                const laneEndX = end.x + lane.x * end.scale;
                
                ctx.beginPath();
                ctx.moveTo(laneStartX, start.y);
                ctx.lineTo(laneEndX, end.y);
                ctx.stroke();
            }
        });
        
        ctx.setLineDash([]);
    }
    
    update(deltaTime, gameSpeed) {
        // تحديث منحنى الطريق
        this.road.curve += (this.road.curveTarget - this.road.curve) * 0.01 * deltaTime;
        
        // تغيير المنحنى بشكل عشوائي
        if (Math.random() < 0.005 * deltaTime) {
            this.road.curveTarget = (Math.random() - 0.5) * 100;
        }
        
        // تحديث مقاطع الطريق
        this.road.segments.forEach((segment, i) => {
            segment.curve = Math.sin((segment.z + this.camera.z) * 0.001 + i * 0.1) * 50 + this.road.curve;
        });
    }
    
    getLanePosition(laneIndex) {
        return this.lanes[laneIndex].x;
    }
}

// ============================================
// نظام اللاعب المتقدم
// ============================================

class Player3D {
    constructor(imageManager) {
        this.imageManager = imageManager;
        
        // الموقع
        this.lane = 1; // 0=يسار, 1=وسط, 2=يمين
        this.x = 0;
        this.y = 50;
        this.z = 200;
        this.targetX = 0;
        
        // الخصائص الفيزيائية
        this.width = 40;
        this.height = 80;
        this.isJumping = false;
        this.isSliding = false;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpForce = -16;
        this.slideTimer = 0;
        this.moveSpeed = 0;
        
        // الحالات والأنيميشن
        this.state = 'running'; // running, jumping, sliding
        this.runFrame = 0;
        this.runCounter = 0;
        this.runSpeed = 5;
        this.animationTime = 0;
        
        // تأثيرات خاصة
        this.trail = [];
        this.maxTrail = 10;
    }
    
    update(deltaTime) {
        // الحركة للمسار المطلوب
        const laneX = world3D.getLanePosition(this.lane);
        this.x += (laneX - this.x) * 0.2 * deltaTime;
        
        // الفيزياء
        if (this.isJumping) {
            this.velocityY += this.gravity * deltaTime;
            this.y += this.velocityY * deltaTime;
            this.state = 'jumping';
            
            if (this.y >= 50) {
                this.y = 50;
                this.isJumping = false;
                this.velocityY = 0;
                this.state = 'running';
            }
        }
        
        if (this.isSliding) {
            this.slideTimer += deltaTime;
            this.state = 'sliding';
            
            if (this.slideTimer > 40) {
                this.isSliding = false;
                this.slideTimer = 0;
                this.state = this.isJumping ? 'jumping' : 'running';
            }
        }
        
        // تحديث الأنيميشن
        this.animationTime += deltaTime;
        
        if (this.state === 'running') {
            this.runCounter += deltaTime;
            if (this.runCounter >= this.runSpeed) {
                this.runFrame = this.runFrame === 0 ? 1 : 0;
                this.runCounter = 0;
            }
        }
        
        // تحديث الأثر
        this.trail.push({ x: this.x, y: this.y, z: this.z, time: 0 });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        
        this.trail.forEach(point => point.time += deltaTime);
        this.trail = this.trail.filter(point => point.time < 20);
    }
    
    draw(ctx, world) {
        // رسم الأثر
        this.drawTrail(ctx, world);
        
        // إسقاط موقع اللاعب
        const proj = world.project3D(this.x, this.y, this.z);
        
        if (!proj.visible) return;
        
        // حساب أبعاد الرسم
        const width = this.width * proj.scale;
        let height = this.height * proj.scale;
        let drawY = proj.y - height;
        
        // تعديلات حسب الحالة
        if (this.isSliding) {
            height *= 0.6;
            drawY = proj.y - height + (this.height * proj.scale * 0.4);
        }
        
        ctx.save();
        ctx.translate(proj.x, drawY + height / 2);
        
        // تأثير الحركة
        if (this.state === 'running') {
            const bounce = Math.sin(this.animationTime * 0.01) * 3;
            ctx.translate(0, bounce);
        }
        
        // رسم اللاعب
        let imageKey = 'character';
        switch(this.state) {
            case 'running':
                imageKey = this.runFrame === 0 ? 'run1' : 'run2';
                break;
            case 'jumping':
                imageKey = 'jump';
                break;
            case 'sliding':
                imageKey = 'slide';
                break;
        }
        
        const playerImage = this.imageManager.getImage(imageKey);
        
        if (playerImage.complete && playerImage.naturalWidth > 0) {
            // حساب حجم الرسم مع الحفاظ على نسبة الأبعاد
            const aspectRatio = playerImage.width / playerImage.height;
            const drawWidth = width;
            const drawHeight = drawWidth / aspectRatio;
            
            // تعديل الارتفاع إذا كان مختلفاً
            const finalHeight = Math.min(drawHeight, height);
            const finalWidth = finalHeight * aspectRatio;
            
            ctx.drawImage(
                playerImage,
                -finalWidth / 2,
                -finalHeight / 2,
                finalWidth,
                finalHeight
            );
        } else {
            // رسم بديل
            this.drawFallback(ctx, width, height);
        }
        
        // تأثيرات خاصة
        if (this.isJumping) {
            ctx.strokeStyle = 'rgba(76, 201, 240, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, width * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // ظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, height / 2, width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawTrail(ctx, world) {
        this.trail.forEach((point, index) => {
            const alpha = 1 - (point.time / 20);
            const proj = world.project3D(point.x, point.y, point.z);
            
            if (proj.visible) {
                ctx.fillStyle = `rgba(76, 201, 240, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 10 * proj.scale * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    drawFallback(ctx, width, height) {
        // جسم اللاعب
        ctx.fillStyle = '#4cc9f0';
        ctx.fillRect(-width/2, -height/2, width, height);
        
        // التفاصيل حسب الحالة
        switch(this.state) {
            case 'running':
                ctx.fillStyle = '#4361ee';
                ctx.fillRect(-width/4, height/4, width/2, height/4);
                break;
            case 'jumping':
                ctx.fillStyle = '#f72585';
                ctx.beginPath();
                ctx.arc(0, -height/4, width/3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'sliding':
                ctx.fillStyle = '#f8961e';
                ctx.fillRect(-width/2, -height/4, width, height/2);
                break;
        }
        
        // الرأس
        ctx.fillStyle = '#1a3a5f';
        ctx.fillRect(-width/2 + 10, -height/2 + 10, width - 20, 30);
        
        // العيون
        ctx.fillStyle = 'white';
        ctx.fillRect(-width/4, -height/2 + 20, width/8, width/8);
        ctx.fillRect(width/8, -height/2 + 20, width/8, width/8);
    }
    
    moveLeft() {
        if (this.lane > 0) {
            this.lane--;
            this.moveSpeed = -5;
        }
    }
    
    moveRight() {
        if (this.lane < 2) {
            this.lane++;
            this.moveSpeed = 5;
        }
    }
    
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = this.jumpForce;
            this.state = 'jumping';
        }
    }
    
    slide() {
        if (!this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.slideTimer = 0;
            this.state = 'sliding';
        }
    }
    
    reset() {
        this.lane = 1;
        this.x = 0;
        this.y = 50;
        this.isJumping = false;
        this.isSliding = false;
        this.state = 'running';
        this.velocityY = 0;
        this.slideTimer = 0;
        this.trail = [];
    }
}

// ============================================
// نظام العوائق والعملات
// ============================================

class ObjectManager {
    constructor() {
        this.obstacles = [];
        this.coins = [];
        this.nextObstacleTime = 0;
        this.nextCoinTime = 0;
    }
    
    update(deltaTime, gameSpeed, playerZ) {
        // تحديث العوائق
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.z -= 8 * gameSpeed * deltaTime;
            
            // إزالة العوائق البعيدة
            if (obstacle.z < playerZ - 500) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // تحديث العملات
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.z -= 8 * gameSpeed * deltaTime;
            coin.rotation += 0.1 * deltaTime;
            
            // إزالة العملات البعيدة
            if (coin.z < playerZ - 500) {
                this.coins.splice(i, 1);
            }
        }
        
        // إنشاء عوائق جديدة
        this.nextObstacleTime -= deltaTime;
        if (this.nextObstacleTime <= 0) {
            this.createObstacle(playerZ);
            this.nextObstacleTime = 100 + Math.random() * 200 / gameSpeed;
        }
        
        // إنشاء عملات جديدة
        this.nextCoinTime -= deltaTime;
        if (this.nextCoinTime <= 0) {
            this.createCoin(playerZ);
            this.nextCoinTime = 50 + Math.random() * 150 / gameSpeed;
        }
    }
    
    createObstacle(playerZ) {
        const lane = Math.floor(Math.random() * 3);
        const type = Math.random() > 0.5 ? 'train' : 'barrier';
        const size = type === 'train' ? 120 : 60;
        
        this.obstacles.push({
            lane: lane,
            x: world3D.getLanePosition(lane),
            y: 30,
            z: playerZ + 1500,
            width: type === 'train' ? 180 : 80,
            height: size,
            type: type,
            color: type === 'train' ? '#e63946' : '#f4a261',
            passed: false
        });
    }
    
    createCoin(playerZ) {
        const lane = Math.floor(Math.random() * 3);
        
        this.coins.push({
            lane: lane,
            x: world3D.getLanePosition(lane),
            y: 80,
            z: playerZ + 1200,
            radius: 15,
            collected: false,
            rotation: 0
        });
    }
    
    draw(ctx, world) {
        // رسم العوائق
        this.obstacles.forEach(obstacle => {
            const proj = world.project3D(obstacle.x, obstacle.y, obstacle.z);
            
            if (proj.visible && proj.scale > 0) {
                const width = obstacle.width * proj.scale;
                const height = obstacle.height * proj.scale;
                
                // الجسم
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(proj.x - width/2, proj.y - height, width, height);
                
                // التفاصيل
                ctx.fillStyle = '#333';
                if (obstacle.type === 'train') {
                    // نوافذ القطار
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(
                            proj.x - width/2 + 20 * proj.scale + i * 40 * proj.scale,
                            proj.y - height + 20 * proj.scale,
                            30 * proj.scale,
                            30 * proj.scale
                        );
                    }
                } else {
                    // تفاصيل الحاجز
                    ctx.fillRect(proj.x - 5 * proj.scale, proj.y - height, 10 * proj.scale, height);
                    ctx.fillRect(proj.x - width/2, proj.y - 10 * proj.scale, width, 10 * proj.scale);
                }
                
                // ظل
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(proj.x - width/2, proj.y, width, 10 * proj.scale);
            }
        });
        
        // رسم العملات
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const proj = world.project3D(coin.x, coin.y, coin.z);
                
                if (proj.visible && proj.scale > 0) {
                    const radius = coin.radius * proj.scale;
                    
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
                    
                    // رمز الدولار
                    ctx.fillStyle = '#DAA520';
                    ctx.font = `${14 * proj.scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', 0, 0);
                    
                    // تأثير الوميض
                    if (Math.sin(coin.rotation * 2) > 0.8) {
                        ctx.shadowColor = '#FFD700';
                        ctx.shadowBlur = 20 * proj.scale;
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                    
                    ctx.restore();
                }
            }
        });
    }
    
    checkCollisions(player) {
        let collision = false;
        let coinCollected = false;
        
        // التحقق من تصادم مع العوائق
        for (const obstacle of this.obstacles) {
            if (!obstacle.passed && 
                obstacle.lane === player.lane &&
                Math.abs(obstacle.z - player.z) < 150) {
                
                let canPass = false;
                
                if (obstacle.type === 'train' && player.isJumping) {
                    canPass = true;
                }
                
                if (obstacle.type === 'barrier' && player.isSliding) {
                    canPass = true;
                }
                
                if (!canPass) {
                    collision = true;
                    obstacle.passed = true;
                }
            }
        }
        
        // التحقق من جمع العملات
        for (const coin of this.coins) {
            if (!coin.collected && 
                coin.lane === player.lane &&
                Math.abs(coin.z - player.z) < 100) {
                
                coin.collected = true;
                coinCollected = true;
            }
        }
        
        return { collision, coinCollected };
    }
    
    reset() {
        this.obstacles = [];
        this.coins = [];
        this.nextObstacleTime = 0;
        this.nextCoinTime = 0;
    }
}

// ============================================
// تهيئة اللعبة
// ============================================

let player = null;
let objectManager = null;

// قائمة الصور المطلوبة
const imageList = {
    character: 'assets/character.png',
    run1: 'assets/run1.png',
    run2: 'assets/run2.png',
    jump: 'assets/jump.png',
    slide: 'assets/slide.png',
    // يمكنك إضافة المزيد من الصور هنا
};

// تحميل الصور
imageManager.loadImages(imageList);

imageManager.onLoad((success) => {
    // إخفاء شاشة التحميل
    loadingScreen.classList.add('hidden');
    
    // إظهار اللعبة
    setTimeout(() => {
        gameContainer.classList.add('loaded');
        loadingScreen.style.display = 'none';
        
        // تهيئة Canvas
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // تهيئة عالم 3D
        world3D = new World3D(canvas.width, canvas.height);
        
        // تهيئة اللاعب
        player = new Player3D(imageManager);
        
        // تهيئة مدير العوائق
        objectManager = new ObjectManager();
        
        // تحديث أفضل نتيجة
        highScoreElement.textContent = highScore;
        
        console.log('🎮 اللعبة جاهزة للعب!');
    }, 500);
});

// تحديث واجهة المستخدم
function updateUI() {
    distanceElement.textContent = Math.floor(distance) + ' م';
    coinsElement.textContent = coins;
    speedElement.textContent = gameSpeed.toFixed(1) + 'x';
    livesElement.textContent = lives;
    
    // تحديث عداد السرعة
    const speedPercent = (gameSpeed - 1) / 2 * 100;
    speedFill.style.width = Math.min(speedPercent, 100) + '%';
    
    // تحديث القلوب
    const hearts = document.querySelectorAll('.hearts i');
    hearts.forEach((heart, index) => {
        if (index < lives) {
            heart.style.opacity = '1';
        } else {
            heart.style.opacity = '0.3';
        }
    });
}

// تبديل الشاشات
function switchScreen(screenName) {
    // إخفاء جميع الشاشات
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    endScreen.classList.remove('active');
    pauseMenu.classList.remove('active');
    
    // إظهار الشاشة المطلوبة
    if (screenName === 'start') {
        startScreen.classList.add('active');
    } else if (screenName === 'game') {
        gameScreen.classList.add('active');
    } else if (screenName === 'end') {
        endScreen.classList.add('active');
    } else if (screenName === 'pause') {
        pauseMenu.classList.add('active');
    }
}

// بدء اللعبة
function startGame() {
    // إعادة تعيين القيم
    distance = 0;
    coins = 0;
    lives = 3;
    gameSpeed = 1;
    gameRunning = true;
    gamePaused = false;
    lastTime = performance.now();
    
    // إعادة تعيين الكائنات
    if (player) player.reset();
    if (objectManager) objectManager.reset();
    if (world3D) world3D.initRoad();
    
    // تحديث الواجهة
    updateUI();
    
    // تبديل الشاشة
    switchScreen('game');
    
    // بدء حلقة اللعبة
    gameLoop();
}

// إيقاف/متابعة اللعبة
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        switchScreen('pause');
    } else {
        switchScreen('game');
        lastTime = performance.now();
        gameLoop();
    }
}

// انتهاء اللعبة
function endGame() {
    gameRunning = false;
    
    // حساب النتيجة النهائية
    const totalScore = Math.floor(distance) + coins * 100;
    
    // تحديث أفضل نتيجة
    if (totalScore > highScore) {
        highScore = totalScore;
        localStorage.setItem('subwayRunnerProHighScore', highScore);
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

// حلقة اللعبة الرئيسية
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    // حساب الوقت المنقضي
    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
    lastTime = currentTime;
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // الرسم
    world3D.drawSky(ctx);
    world3D.drawRoad(ctx, player.z);
    objectManager.draw(ctx, world3D);
    player.draw(ctx, world3D);
    
    // التحديث
    world3D.update(deltaTime, gameSpeed);
    player.update(deltaTime);
    objectManager.update(deltaTime, gameSpeed, player.z);
    
    // زيادة المسافة والسرعة
    distance += gameSpeed * deltaTime * 10;
    
    if (distance % 500 < 10 && distance > 100) {
        gameSpeed = Math.min(gameSpeed + 0.05, 3);
    }
    
    // التحقق من التصادم وجمع العملات
    const collisions = objectManager.checkCollisions(player);
    
    if (collisions.coinCollected) {
        coins += 1;
    }
    
    if (collisions.collision) {
        lives -= 1;
        
        if (lives <= 0) {
            endGame();
            return;
        }
    }
    
    // تحديث الواجهة
    updateUI();
    
    // الاستمرار
    animationId = requestAnimationFrame(gameLoop);
}

// ============================================
// التحكم
// ============================================

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', () => switchScreen('start'));

pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
restartPauseBtn.addEventListener('click', () => {
    togglePause();
    setTimeout(startGame, 100);
});
homePauseBtn.addEventListener('click', () => {
    togglePause();
    setTimeout(() => switchScreen('start'), 100);
});

// أزرار التحكم
leftBtn.addEventListener('click', () => player && player.moveLeft());
rightBtn.addEventListener('click', () => player && player.moveRight());
jumpBtn.addEventListener('click', () => player && player.jump());
slideBtn.addEventListener('click', () => player && player.slide());
upBtn.addEventListener('click', () => player && player.jump());
downBtn.addEventListener('click', () => player && player.slide());

// التحكم بلوحة المفاتيح
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused || !player) return;
    
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            player.moveLeft();
            break;
        case 'ArrowRight':
        case 'KeyD':
            player.moveRight();
            break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
            player.jump();
            break;
        case 'ArrowDown':
        case 'KeyS':
            player.slide();
            break;
        case 'Escape':
        case 'KeyP':
            togglePause();
            break;
    }
});

// التحكم باللمس (للأجهزة المحمولة)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused || !player) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused || !player) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    
    if (Math.abs(diffX) > 20) {
        if (diffX > 0) player.moveRight();
        else player.moveLeft();
        touchStartX = touch.clientX;
    }
    
    if (Math.abs(diffY) > 20) {
        if (diffY < 0) player.jump();
        else player.slide();
        touchStartY = touch.clientY;
    }
});

// مسك النقر الطويل للتزحلق
let slideTimeout = null;
slideBtn.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused || !player) return;
    
    e.preventDefault();
    player.slide();
    
    // مسك طويل للتزحلق المستمر
    slideTimeout = setTimeout(() => {
        if (!player.isSliding && !player.isJumping) {
            player.slide();
        }
    }, 500);
});

slideBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (slideTimeout) {
        clearTimeout(slideTimeout);
        slideTimeout = null;
    }
});

// ============================================
// التهيئة النهائية
// ============================================

// عند تحميل الصفحة
window.addEventListener('load', () => {
    console.log('🚀 Subway Runner Pro - Ultimate 3D Edition');
    console.log('📱 نسخة متوافقة مع الهاتف');
    console.log('🎮 نظام تحميل الصور الذكي');
    console.log('✨ 3D خارقة مع تأثيرات واقعية');
});

// إظهار رسالة ترحيب
setTimeout(() => {
    if (loadingScreen.style.display !== 'none') {
        console.log('⏳ جاري تحميل الصور...');
    }
}, 1000);
