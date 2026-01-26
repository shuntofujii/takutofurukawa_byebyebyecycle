// ============================================
// ゲーム設定パラメータ（調整可能）
// ============================================
const CONFIG = {
    // キャンバスサイズ
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,

    // カメラ設定
    PLAYER_SCREEN_X: 240, // プレイヤーを画面の25%位置に配置
    CAMERA_SMOOTH: 0.1,   // カメラ追従の滑らかさ

    // プレイヤー設定
    PLAYER_WIDTH: 50,
    PLAYER_HEIGHT: 40,
    PLAYER_COLOR: '#FF6B6B',
    PLAYER_GROUND_Y: 420, // 地面からの高さ

    // 物理設定
    GRAVITY: 0.9,           // 重力加速度
    JUMP_FORCE: -20,       // ジャンプ力（負の値で上向き）
    DOUBLE_JUMP_MUL: 0.9,  // 2段ジャンプの強度倍率（初回の90%）
    MAX_FALL_SPEED: 22,    // 最大落下速度

    // ワールド速度設定（距離で加速）
    BASE_WORLD_SPEED: 3,    // 基本ワールド速度
    ACCEL_PER_METER: 0.0005,  // 1m進むごとの速度増加（さらに減速）
    MAX_WORLD_SPEED: 15,    // 最大ワールド速度

    // 自転車速度設定
    BIKE_MIN_MUL: 0.6,      // ワールド速度に対する最小倍率（減速可能範囲）
    BIKE_MAX_MUL: 2.0,      // ワールド速度に対する最大倍率
    ACCEL_GROUND: 18,       // 地上での加速度
    ACCEL_AIR: 30,          // 空中での加速度

    // プレイヤー画面内制約
    PLAYER_MIN_X: 20,       // 画面左端の最小X
    PLAYER_MAX_X: 940,      // 画面右端の最大X

    // 地面設定
    GROUND_HEIGHT: 120,      // 地面の高さ
    GROUND_COLOR: '#8B4513',
    GROUND_DARK: '#654321',
    GROUND_LIGHT: '#A0522D',
    GROUND_LINE_COLOR: '#654321',
    TILE_SIZE: 60,           // タイルサイズ

    // 障害物設定
    OBSTACLE_MIN_WIDTH: 35,
    OBSTACLE_MAX_WIDTH: 55,
    OBSTACLE_MIN_HEIGHT: 45,
    OBSTACLE_MAX_HEIGHT: 85,
    OBSTACLE_COLOR: '#FF4500',
    OBSTACLE_MIN_GAP: 250,  // 障害物間の最小間隔
    OBSTACLE_MAX_GAP: 450,  // 障害物間の最大間隔

    // 穴設定
    HOLE_MIN_WIDTH: 90,
    HOLE_MAX_WIDTH: 160,
    HOLE_MIN_GAP: 350,      // 穴間の最小間隔

    // 地形生成設定（nextSpawnXベース）
    SPAWN_MIN_SPACING: 250,  // 最小間隔（ワールド座標）
    SPAWN_MAX_SPACING: 450,  // 最大間隔（ワールド座標）
    GAP_COOLDOWN_DISTANCE: 500, // 連続穴のクールダウン距離

    // エフェクト設定
    JUMP_PARTICLES: 10,     // ジャンプ時のパーティクル数
    LAND_PARTICLES: 8,      // 着地時のパーティクル数
    HIT_PARTICLES: 15,      // ヒット時のパーティクル数
    PARTICLE_LIFE: 25,      // パーティクルの生存フレーム数

    // アイテム設定
    ITEM_RADIUS: 16,
    ITEM_MIN_GAP: 320,
    ITEM_SWAP_CHANCE: 1 / 2,
    ITEM_SLOW_CHANCE: 1 / 8,
    ITEM_FAST_CHANCE: 1 / 8,
    ITEM_GOLD_CHANCE: 1 / 10,
    ITEM_SWAP_COLOR: '#3FA7FF',
    ITEM_SLOW_COLOR: '#47D16D',
    ITEM_FAST_COLOR: '#9B59FF',
    ITEM_GOLD_COLOR: '#F5C542',
    ITEM_SWAP_DURATION: 5000,
    ITEM_SLOW_DURATION: 10000,
    ITEM_FAST_DURATION: 10000,

    // スクリーンシェイク設定
    SHAKE_DURATION: 40,     // シェイク継続フレーム数
    SHAKE_INTENSITY: 6,     // シェイク強度
    LAND_SHAKE_DURATION: 3, // 着地時のシェイク
    LAND_SHAKE_INTENSITY: 2,

    // スローモーション設定
    SLOWMO_DURATION: 150,   // スローモーション継続時間（ms）
    SLOWMO_SCALE: 0.3,      // スローモーション倍率
};

// ============================================
// ゲーム状態
// ============================================
const GAME_STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

// ============================================
// グローバル変数
// ============================================
const LEADERBOARD_API_BASE = 'https://takutofurukawa.shunto-fujii.workers.dev/api';
const LEADERBOARD_BOARD = 'global';
const MAX_LEADERBOARD = 30;
let canvas, ctx;
let gameContainer;
let isTouchDevice = false;
let headImageMain;
let headImageAlt;
let headImage;
let headImageLoaded = false;
let headImageMainLoaded = false;
let headImageAltLoaded = false;
let currentHeadKey = 'main';
let bikeColor = '#333';
let defaultBikeColor = '#333';
let gameState = GAME_STATE.TITLE;
let leaderboard = [];
let pendingScore = null;
let player;
let obstacles = [];
let holes = [];
let items = [];
let particles = [];
let backgroundLayers = [];
let nextSpawnX = 0; // 次に生成するワールド座標
let lastGapSpawnX = -1000; // 最後に穴を生成したワールド座標
let lastItemSpawnX = -1000; // 最後にアイテムを生成したワールド座標
let worldSpeed = CONFIG.BASE_WORLD_SPEED; // ワールドの流れる速度
let bikeSpeed = CONFIG.BASE_WORLD_SPEED; // 自転車の現在速度
let targetBikeSpeed = CONFIG.BASE_WORLD_SPEED; // 自転車の目標速度
let score = 0;
let distanceTraveled = 0; // cameraXと同じ値
let highScore = 0;
let lastTime = 0;
let swipeTouchId = null;
let swipeStartX = 0;
let swipeStartY = 0;
let swipeMoved = false;
let lastCanvasInputAt = 0;
let shakeOffset = { x: 0, y: 0 };
let shakeFrames = 0;
let cameraX = 0;
let inputBuffer = [];
let wasGrounded = true;
let slowmoFrames = 0;
let flashFrames = 0;
let gameStartTime = 0;
let forceSpawnDone = false;
let activeEffects = {
    headSwapUntil: 0,
    headSwapOriginalKey: "main",
    slowUntil: 0,
    fastUntil: 0,
    tripleJump: false,
    swapAt: 0,
    slowAt: 0,
    fastAt: 0,
    goldAt: 0
};
let pressedKeys = new Set(); // 押されているキーのセット

// ============================================
// プレイヤークラス
// ============================================
class Player {
    constructor() {
        this.reset();
    }

    reset() {
        // プレイヤーは画面固定位置（screenX、worldXはcameraX + screenXで更新）
        this.screenX = CONFIG.PLAYER_SCREEN_X; // 画面内での位置：240
        this.worldX = 0; // 初期値は0（updateで更新される）
        this.y = CONFIG.PLAYER_GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
        this.jumpCount = 0; // ジャンプ回数（0:地上, 1:1回目, 2:2回目）
        this.wheelRotation = 0;
        this.squash = 1;
        this.bob = 0;
        this.bobTime = 0;
        this.jumpTime = 0;
        this.landTime = 0;
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67; // 60fps基準に正規化

        // 重力適用
        this.velocityY += CONFIG.GRAVITY * dt;

        // 最大落下速度制限
        if (this.velocityY > CONFIG.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.MAX_FALL_SPEED;
        }

        // 位置更新
        this.y += this.velocityY * dt;

        // 地面との衝突判定
        const groundY = CONFIG.PLAYER_GROUND_Y;
        if (this.y >= groundY) {
            if (!this.isGrounded && wasGrounded === false) {
                // 着地
                this.landTime = 5;
                createLandEffect(this.worldX, this.y);
                startShake(CONFIG.LAND_SHAKE_DURATION, CONFIG.LAND_SHAKE_INTENSITY);
            }
            this.y = groundY;
            this.velocityY = 0;
            this.isGrounded = true;
            this.squash = 1;
            // 着地時にジャンプ回数をリセット（地上でjumpCount = 0にリセット）
            this.jumpCount = 0;
        } else {
            this.isGrounded = false;
            this.squash = 1;
        }

        // 車輪回転（速度に応じて）
        if (this.isGrounded) {
            this.wheelRotation += bikeSpeed * 0.3 * dt;
            this.bobTime += deltaTime * 0.01;
            this.bob = Math.sin(this.bobTime) * 2;
        } else {
            this.wheelRotation += bikeSpeed * 0.15 * dt; // 空中でも少し回転
        }

        // ジャンプ中の前傾
        if (!this.isGrounded && this.velocityY < 0) {
            this.jumpTime = Math.min(this.jumpTime + 1, 10);
        } else {
            this.jumpTime = Math.max(this.jumpTime - 1, 0);
        }

        // 着地時の沈み込み
        if (this.landTime > 0) {
            this.landTime--;
            this.squash = 0.85 + (this.landTime / 5) * 0.15;
        }

        wasGrounded = this.isGrounded;
    }

    tryJump() {
        const maxJumps = activeEffects.tripleJump ? 3 : 2;
        if (this.isGrounded) {
            this.jumpCount = 1;
            this.jump(CONFIG.JUMP_FORCE);
            return true;
        }
        if (this.jumpCount < maxJumps) {
            this.jumpCount += 1;
            this.jump(CONFIG.JUMP_FORCE * CONFIG.DOUBLE_JUMP_MUL);
            return true;
        }
        return false;
    }

    jump(jumpForce) {
        this.velocityY = jumpForce;
        this.isGrounded = false;
        createJumpEffect(this.worldX, this.y);
        return true;
    }

    draw(cameraX) {
        // プレイヤーは画面固定位置なので、screenXを直接使う
        const screenX = this.screenX;
        const groundY = CONFIG.PLAYER_GROUND_Y;
        const heightFromGround = groundY - this.y;

        ctx.save();
        ctx.translate(screenX, this.y);

        // 影を描画
        const shadowAlpha = Math.max(0.1, 1 - heightFromGround / 200);
        const shadowSize = 20 + heightFromGround * 0.1;
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(0, groundY - this.y + 5, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // スケール適用（squash & stretch）
        ctx.scale(1, this.squash);

        // 前傾（ジャンプ中）
        const lean = this.jumpTime * 0.05;
        ctx.rotate(lean);

        // ボブ（走行中の微振動）
        ctx.translate(0, this.bob);

        // 自転車フレーム
        ctx.strokeStyle = bikeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        // フレーム線
        ctx.moveTo(-15, -10);
        ctx.lineTo(15, -10);
        ctx.moveTo(-10, -15);
        ctx.lineTo(10, 5);
        ctx.stroke();

        // 前輪
        ctx.save();
        ctx.translate(-12, 5);
        ctx.rotate(this.wheelRotation);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();

        // 後輪
        ctx.save();
        ctx.translate(12, 5);
        ctx.rotate(this.wheelRotation);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();

        // ライダー（胴体）
        ctx.strokeStyle = bikeColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // ハンドル
        ctx.strokeStyle = bikeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, -15);
        ctx.lineTo(-15, -18);
        ctx.moveTo(5, -15);
        ctx.lineTo(15, -18);
        ctx.stroke();

        // ライダー（頭）
        const headPivotX = 0;
        const headPivotY = -16;
        const swing = Math.sin(this.bobTime * 2.2) * 0.25;
        if (headImageLoaded && headImage) {
            const maxHeadSize = 56;
            const imgW = headImage.naturalWidth || 1;
            const imgH = headImage.naturalHeight || 1;
            const scale = maxHeadSize / Math.max(imgW, imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            ctx.save();
            ctx.translate(headPivotX, headPivotY);
            ctx.rotate(swing);
            ctx.drawImage(headImage, -drawW / 2, -drawH, drawW, drawH);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(headPivotX, headPivotY);
            ctx.rotate(swing);
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(0, -14, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    getBounds(cameraX) {
        // プレイヤーは画面固定位置なので、screenXを直接使う
        const screenX = this.screenX;
        return {
            x: screenX - 15,
            y: this.y - 25,
            width: 30,
            height: 30
        };
    }
}

// ============================================
// 障害物クラス
// ============================================
class Obstacle {
    constructor(x) {
        this.worldX = x;
        this.width = CONFIG.OBSTACLE_MIN_WIDTH +
            Math.random() * (CONFIG.OBSTACLE_MAX_WIDTH - CONFIG.OBSTACLE_MIN_WIDTH);
        this.height = CONFIG.OBSTACLE_MIN_HEIGHT +
            Math.random() * (CONFIG.OBSTACLE_MAX_HEIGHT - CONFIG.OBSTACLE_MIN_HEIGHT);
        this.y = CONFIG.PLAYER_GROUND_Y - this.height;
        this.color = CONFIG.OBSTACLE_COLOR;
    }

    draw(cameraX) {
        const screenX = this.worldX - cameraX;

        // 画面外チェック（描画をスキップ）
        if (screenX + this.width < 0 || screenX > CONFIG.CANVAS_WIDTH) {
            return; // 画面外なので描画しない
        }

        // 影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, this.y + this.height + 3, this.width * 0.6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 本体
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, this.y, this.width, this.height);

        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(screenX, this.y, this.width, 8);

        // 側面の暗いライン
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(screenX, this.y, 3, this.height);
    }

    getBounds(cameraX) {
        const screenX = this.worldX - cameraX;
        return {
            x: screenX,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOffScreen(cameraX) {
        // 画面左端より左に出たかチェック（マージン付き）
        return this.worldX < cameraX - 100;
    }
}

// ============================================
// 穴クラス
// ============================================
class Hole {
    constructor(x, width) {
        this.worldX = x;
        this.width = width;
        this.y = CONFIG.PLAYER_GROUND_Y;
        this.height = CONFIG.GROUND_HEIGHT;
    }

    draw(cameraX) {
        // 穴は背景が見える部分（描画は地面描画で処理）
    }

    getBounds(cameraX) {
        const screenX = this.worldX - cameraX;
        return {
            x: screenX,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOffScreen(cameraX) {
        // 画面左端より左に出たかチェック（マージン付き）
        return this.worldX < cameraX - 100;
    }
}

// ============================================
// アイテムクラス
// ============================================
class Item {
    constructor(x, type, color) {
        this.worldX = x;
        this.type = type;
        this.radius = CONFIG.ITEM_RADIUS;
        this.y = CONFIG.PLAYER_GROUND_Y - this.radius - 6;
        this.color = color;
    }

    draw(cameraX) {
        const screenX = this.worldX - cameraX;
        if (screenX + this.radius < 0 || screenX - this.radius > CONFIG.CANVAS_WIDTH) {
            return;
        }
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(screenX, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
        ctx.restore();
    }

    isOffScreen(cameraX) {
        return this.worldX < cameraX - 100;
    }
}

// ============================================
// パーティクルクラス
// ============================================
class Particle {
    constructor(x, y, type = 'jump') {
        this.worldX = x; // 絶対座標
        this.y = y;
        this.type = type;

        if (type === 'jump') {
            this.vx = (Math.random() - 0.5) * 6 + worldSpeed * 0.5;
            this.vy = Math.random() * -4 - 3;
            this.color = [255, 215, 0];
            this.size = Math.random() * 4 + 2;
        } else if (type === 'land') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 2;
            this.color = [139, 69, 19];
            this.size = Math.random() * 3 + 2;
        } else if (type === 'hit') {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = Math.random() * -6 - 2;
            this.color = [255, 100, 100];
            this.size = Math.random() * 3 + 1;
        }

        this.life = CONFIG.PARTICLE_LIFE;
        this.maxLife = CONFIG.PARTICLE_LIFE;
    }

    update() {
        this.worldX += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life--;
    }

    draw(cameraX) {
        const screenX = this.worldX - cameraX;
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isDead(cameraX) {
        return this.life <= 0 || this.worldX < cameraX - 100;
    }
}

// ============================================
// 背景レイヤークラス
// ============================================
class BackgroundLayer {
    constructor(parallaxSpeed, color, height) {
        this.parallaxSpeed = parallaxSpeed;
        this.color = color;
        this.height = height;
        this.elements = [];
        this.generateElements();
    }

    generateElements() {
        // 雲や山などの要素を生成
        for (let i = 0; i < 10; i++) {
            this.elements.push({
                x: Math.random() * 2000,
                y: Math.random() * Math.min(this.height, CONFIG.CANVAS_HEIGHT * 0.5),
                size: Math.random() * 50 + 30
            });
        }
    }

    draw(cameraX, distanceTraveled) {
        ctx.fillStyle = this.color;
        // 背景はdistanceTraveledに基づいて左に流れる（パララックス効果）
        const parallaxOffset = distanceTraveled * this.parallaxSpeed;

        // 画面内に表示される要素を計算
        const visibleStart = parallaxOffset - 100;
        const visibleEnd = parallaxOffset + CONFIG.CANVAS_WIDTH + 100;

        this.elements.forEach(elem => {
            // 要素の絶対位置を計算
            let elemScreenX = elem.x - parallaxOffset;

            // 画面外に出たら反対側から再出現
            while (elemScreenX < -100) {
                elemScreenX += CONFIG.CANVAS_WIDTH + 200;
            }
            while (elemScreenX > CONFIG.CANVAS_WIDTH + 100) {
                elemScreenX -= CONFIG.CANVAS_WIDTH + 200;
            }

            // 画面内にある場合のみ描画
            if (elemScreenX > -100 && elemScreenX < CONFIG.CANVAS_WIDTH + 100) {
                ctx.beginPath();
                ctx.arc(elemScreenX, elem.y, elem.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

// ============================================
// エフェクト生成
// ============================================
function createJumpEffect(x, y) {
    for (let i = 0; i < CONFIG.JUMP_PARTICLES; i++) {
        particles.push(new Particle(x, y, 'jump'));
    }
}

function createLandEffect(x, y) {
    for (let i = 0; i < CONFIG.LAND_PARTICLES; i++) {
        particles.push(new Particle(x, y, 'land'));
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < CONFIG.HIT_PARTICLES; i++) {
        particles.push(new Particle(x, y, 'hit'));
    }
    flashFrames = 3;
}

// ============================================
// スクリーンシェイク
// ============================================
function startShake(duration = CONFIG.SHAKE_DURATION, intensity = CONFIG.SHAKE_INTENSITY) {
    shakeFrames = duration;
    CONFIG.SHAKE_INTENSITY = intensity;
}

function updateShake() {
    if (shakeFrames > 0) {
        shakeOffset.x = (Math.random() - 0.5) * CONFIG.SHAKE_INTENSITY;
        shakeOffset.y = (Math.random() - 0.5) * CONFIG.SHAKE_INTENSITY;
        shakeFrames--;
    } else {
        shakeOffset.x = 0;
        shakeOffset.y = 0;
    }
}

function applyItemEffect(type) {
    const now = Date.now();
    if (type === 'swap') {
        if (now > activeEffects.headSwapUntil) {
            activeEffects.headSwapOriginalKey = currentHeadKey;
        }
        currentHeadKey = currentHeadKey === 'main' ? 'alt' : 'main';
        if (currentHeadKey === 'alt') {
            headImage = headImageAlt;
            headImageLoaded = headImageAltLoaded;
        } else {
            headImage = headImageMain;
            headImageLoaded = headImageMainLoaded;
        }
        activeEffects.headSwapUntil = now + CONFIG.ITEM_SWAP_DURATION;
        activeEffects.swapAt = now;
        return;
    }
    if (type === 'slow') {
        activeEffects.slowUntil = now + CONFIG.ITEM_SLOW_DURATION;
        activeEffects.slowAt = now;
        return;
    }
    if (type === 'fast') {
        activeEffects.fastUntil = now + CONFIG.ITEM_FAST_DURATION;
        activeEffects.fastAt = now;
        return;
    }
    if (type === 'gold') {
        activeEffects.tripleJump = true;
        activeEffects.goldAt = now;
    }
}


function updateActiveEffects() {
    const now = Date.now();
    if (activeEffects.headSwapUntil > 0 && now > activeEffects.headSwapUntil) {
        currentHeadKey = activeEffects.headSwapOriginalKey || 'main';
        if (currentHeadKey === 'alt') {
            headImage = headImageAlt;
            headImageLoaded = headImageAltLoaded;
        } else {
            headImage = headImageMain;
            headImageLoaded = headImageMainLoaded;
        }
        activeEffects.headSwapUntil = 0;
    }
    if (activeEffects.slowUntil > 0 && now > activeEffects.slowUntil) {
        activeEffects.slowUntil = 0;
    }
    if (activeEffects.fastUntil > 0 && now > activeEffects.fastUntil) {
        activeEffects.fastUntil = 0;
    }

    let latestAt = 0;
    let latestColor = defaultBikeColor;
    if (activeEffects.headSwapUntil > now && activeEffects.swapAt >= latestAt) {
        latestAt = activeEffects.swapAt;
        latestColor = CONFIG.ITEM_SWAP_COLOR;
    }
    if (activeEffects.slowUntil > now && activeEffects.slowAt >= latestAt) {
        latestAt = activeEffects.slowAt;
        latestColor = CONFIG.ITEM_SLOW_COLOR;
    }
    if (activeEffects.fastUntil > now && activeEffects.fastAt >= latestAt) {
        latestAt = activeEffects.fastAt;
        latestColor = CONFIG.ITEM_FAST_COLOR;
    }
    if (activeEffects.tripleJump && activeEffects.goldAt >= latestAt) {
        latestAt = activeEffects.goldAt;
        latestColor = CONFIG.ITEM_GOLD_COLOR;
    }
    bikeColor = latestColor;
}


function getWorldSpeedMultiplier() {
    const now = Date.now();
    let mul = 1;
    if (activeEffects.slowUntil > now) {
        mul *= 0.8;
    }
    if (activeEffects.fastUntil > now) {
        mul *= 1.1;
    }
    return mul;
}

// ============================================
// 当たり判定
// ============================================
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// ============================================
// ジャンプ可能距離計算
// ============================================
function calculateJumpDistance() {
    const airTime = (2 * Math.abs(CONFIG.JUMP_FORCE)) / CONFIG.GRAVITY;
    return worldSpeed * airTime * 0.016; // フレーム単位に変換
}

// ============================================
// 地形生成（nextSpawnXベース）
// ============================================
function generateTerrain() {
    // nextSpawnXがcameraXより小さい場合は初期化
    if (nextSpawnX < cameraX) {
        nextSpawnX = cameraX + CONFIG.CANVAS_WIDTH * 1.2;
    }

    // 画面右端より先まで生成範囲を拡張（ワールド座標）
    const spawnRightEdge = cameraX + CONFIG.CANVAS_WIDTH * 2.5;

    // nextSpawnXが右端を超えるまで生成を続ける
    while (nextSpawnX < spawnRightEdge) {
        // 障害物か穴をランダムに選択（確実に何か生成）
        const canSpawnGap = (nextSpawnX - lastGapSpawnX) > CONFIG.GAP_COOLDOWN_DISTANCE;
        const spawnGap = canSpawnGap && Math.random() < 0.4; // 40%の確率で穴

        if (spawnGap) {
            // 穴を生成
            const maxHoleWidth = Math.min(calculateJumpDistance() * 0.8, CONFIG.HOLE_MAX_WIDTH);
            const holeWidth = CONFIG.HOLE_MIN_WIDTH + Math.random() * (maxHoleWidth - CONFIG.HOLE_MIN_WIDTH);
            holes.push(new Hole(nextSpawnX, holeWidth));
            lastGapSpawnX = nextSpawnX;
        } else {
            // 障害物を生成
            obstacles.push(new Obstacle(nextSpawnX));
        }

        // アイテム生成（一定確率）
        const canSpawnItem = (nextSpawnX - lastItemSpawnX) > CONFIG.ITEM_MIN_GAP;
        if (canSpawnItem) {
            const roll = Math.random();
            const swapChance = CONFIG.ITEM_SWAP_CHANCE;
            const slowChance = CONFIG.ITEM_SLOW_CHANCE;
            const fastChance = CONFIG.ITEM_FAST_CHANCE;
            const goldChance = CONFIG.ITEM_GOLD_CHANCE;
            if (roll < swapChance) {
                items.push(new Item(nextSpawnX + 60, 'swap', CONFIG.ITEM_SWAP_COLOR));
                lastItemSpawnX = nextSpawnX;
            } else if (roll < swapChance + slowChance) {
                items.push(new Item(nextSpawnX + 60, 'slow', CONFIG.ITEM_SLOW_COLOR));
                lastItemSpawnX = nextSpawnX;
            } else if (roll < swapChance + slowChance + fastChance) {
                items.push(new Item(nextSpawnX + 60, 'fast', CONFIG.ITEM_FAST_COLOR));
                lastItemSpawnX = nextSpawnX;
            } else if (roll < swapChance + slowChance + fastChance + goldChance) {
                items.push(new Item(nextSpawnX + 60, 'gold', CONFIG.ITEM_GOLD_COLOR));
                lastItemSpawnX = nextSpawnX;
            }
        }

        // nextSpawnXを前進させる
        const spacing = CONFIG.SPAWN_MIN_SPACING +
            Math.random() * (CONFIG.SPAWN_MAX_SPACING - CONFIG.SPAWN_MIN_SPACING);
        nextSpawnX += spacing;
    }
}

// ============================================
// 画面リサイズ
// ============================================
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const banner = document.getElementById('banner');
    const bannerHeight = banner ? banner.offsetHeight : 0;
    const availableWidth = window.innerWidth;
    const availableHeight = Math.max(200, window.innerHeight - bannerHeight);
    const scale = Math.min(
        availableWidth / CONFIG.CANVAS_WIDTH,
        availableHeight / CONFIG.CANVAS_HEIGHT
    );
    const displayWidth = Math.floor(CONFIG.CANVAS_WIDTH * scale);
    const displayHeight = Math.floor(CONFIG.CANVAS_HEIGHT * scale);

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    if (gameContainer) {
        gameContainer.style.width = displayWidth + 'px';
        gameContainer.style.height = displayHeight + 'px';
    }

    canvas.width = Math.floor(CONFIG.CANVAS_WIDTH * dpr);
    canvas.height = Math.floor(CONFIG.CANVAS_HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}


// ============================================
// タッチコントロール
// ============================================
function setupTouchControls() {
    const leftButton = document.getElementById('controlLeft');
    const rightButton = document.getElementById('controlRight');

    if (!leftButton || !rightButton) {
        return;
    }

    const bind = (button, key) => {
        const press = (e) => {
            e.preventDefault();
            if (button.setPointerCapture && e.pointerId != null) {
                button.setPointerCapture(e.pointerId);
            }
            pressedKeys.add(key);
            button.classList.add('pressed');
        };

        const release = (e) => {
            e.preventDefault();
            if (button.releasePointerCapture && e.pointerId != null) {
                button.releasePointerCapture(e.pointerId);
            }
            pressedKeys.delete(key);
            button.classList.remove('pressed');
        };

        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
        button.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    bind(leftButton, 'ArrowLeft');
    bind(rightButton, 'ArrowRight');
}

// ============================================
// リーダーボード
// ============================================
async function loadLeaderboard() {
    try {
        const res = await fetch(`${LEADERBOARD_API_BASE}/leaderboard?board=${encodeURIComponent(LEADERBOARD_BOARD)}`);
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.top)) {
            leaderboard = data.top
                .map(entry => ({
                    rank: Number(entry.rank) || 0,
                    name: String(entry.name || 'PLAYER').slice(0, 20),
                    score: Number(entry.score) || 0,
                    createdAt: Number(entry.createdAt) || 0
                }))
                .filter(entry => entry.score > 0)
                .slice(0, MAX_LEADERBOARD);
        } else {
            leaderboard = [];
        }
    } catch (err) {
        leaderboard = [];
    }
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) {
        return;
    }
    if (leaderboard.length === 0) {
        list.innerHTML = '<div class="leaderboard-item"><span>--</span><span>記録なし</span></div>';
        return;
    }
    list.innerHTML = leaderboard
        .slice(0, MAX_LEADERBOARD)
        .map((entry, index) => {
            const rank = entry.rank || (index + 1);
            const name = entry.name || 'PLAYER';
            const score = entry.score;
            return `<div class="leaderboard-item"><span>${String(rank).padStart(2, '0')}. ${name}</span><span>${score}m</span></div>`;
        })
        .join('');
}

function isScoreQualifying(score) {
    if (leaderboard.length < MAX_LEADERBOARD) {
        return score > 0;
    }
    const lastScore = leaderboard[leaderboard.length - 1].score;
    return score >= lastScore;
}

async function showLeaderboardScreen() {
    const title = document.getElementById('titleScreen');
    const gameOver = document.getElementById('gameOverScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const nameEntry = document.getElementById('nameEntryScreen');
    if (!leaderboardScreen) {
        return;
    }
    title?.classList.add('hidden');
    gameOver?.classList.add('hidden');
    nameEntry?.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    await loadLeaderboard();
    renderLeaderboard();
}

function closeLeaderboardScreen() {
    const title = document.getElementById('titleScreen');
    const gameOver = document.getElementById('gameOverScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    if (!leaderboardScreen) {
        return;
    }
    leaderboardScreen.classList.add('hidden');
    if (gameState === GAME_STATE.TITLE) {
        title?.classList.remove('hidden');
    } else if (gameState === GAME_STATE.GAME_OVER) {
        gameOver?.classList.remove('hidden');
    }
}

function showNameEntry(score) {
    const nameEntry = document.getElementById('nameEntryScreen');
    const gameOver = document.getElementById('gameOverScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    pendingScore = score;
    gameOver?.classList.add('hidden');
    leaderboardScreen?.classList.add('hidden');
    nameEntry?.classList.remove('hidden');
    const input = document.getElementById('nicknameInput');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function closeNameEntry() {
    const nameEntry = document.getElementById('nameEntryScreen');
    nameEntry?.classList.add('hidden');
}

async function submitScore() {
    const input = document.getElementById('nicknameInput');
    const name = (input?.value || '').trim().slice(0, 20) || 'PLAYER';
    if (pendingScore == null) {
        closeNameEntry();
        return;
    }

    try {
        const res = await fetch(`${LEADERBOARD_API_BASE}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                score: pendingScore,
                board: LEADERBOARD_BOARD
            })
        });
        await res.json().catch(() => null);
    } catch (err) {
        // ignore
    }

    pendingScore = null;
    await loadLeaderboard();
    highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    document.getElementById('bestScore').textContent = highScore;
    document.getElementById('highScore').textContent = highScore;
    closeNameEntry();
    renderLeaderboard();
    const gameOver = document.getElementById('gameOverScreen');
    gameOver?.classList.remove('hidden');
}


// ============================================
// 顔画像
// ============================================
function loadHeadImages() {
    headImageMain = new Image();
    headImageAlt = new Image();

    headImageMain.onload = () => {
        headImageMainLoaded = true;
        if (currentHeadKey == 'main') {
            headImageLoaded = true;
        }
    };
    headImageAlt.onload = () => {
        headImageAltLoaded = true;
        if (currentHeadKey == 'alt') {
            headImageLoaded = true;
        }
    };

    headImageMain.src = 'takutofurukawa.webp';
    headImageAlt.src = 'shuntofujii.webp';
}

function pickHeadImage() {
    currentHeadKey = Math.random() < 0.1 ? 'alt' : 'main';
    if (currentHeadKey == 'alt') {
        headImage = headImageAlt;
        headImageLoaded = headImageAltLoaded;
    } else {
        headImage = headImageMain;
        headImageLoaded = headImageMainLoaded;
    }
}

// ============================================
// 初期化
// ============================================
function isInteractiveElement(target) {
    if (!target || !target.closest) {
        return false;
    }
    return Boolean(target.closest('button, input, textarea, select, a'));
}

function isNameEntryVisible() {
    const nameEntryScreen = document.getElementById('nameEntryScreen');
    return Boolean(nameEntryScreen && !nameEntryScreen.classList.contains('hidden'));
}

function isOverlayBlocked() {
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const nameEntryScreen = document.getElementById('nameEntryScreen');
    if (leaderboardScreen && !leaderboardScreen.classList.contains('hidden')) {
        return true;
    }
    if (nameEntryScreen && !nameEntryScreen.classList.contains('hidden')) {
        return true;
    }
    return false;
}

function bindGlobalTap() {
    const handler = (e) => {
        if (e.pointerType === 'touch' && Date.now() - lastCanvasInputAt < 250) {
            if (e.target && e.target.closest && e.target.closest('#gameContainer')) {
                return;
            }
        }
        if (e.target && e.target.closest && e.target.closest('#banner')) {
            return;
        }
        if (isNameEntryVisible()) {
            if (e.target && e.target.closest && e.target.closest('#nameEntryScreen')) {
                return;
            }
            if (isInteractiveElement(e.target)) {
                return;
            }
            e.preventDefault();
            closeNameEntry();
            return;
        }
        if (isInteractiveElement(e.target)) {
            return;
        }
        if (isOverlayBlocked()) {
            return;
        }
        e.preventDefault();
        if (gameState === GAME_STATE.TITLE) {
            startGame();
        } else if (gameState === GAME_STATE.PLAYING) {
            player.tryJump();
        } else if (gameState === GAME_STATE.GAME_OVER) {
            resetGame();
        }
    };
    document.addEventListener('pointerup', handler, { passive: false });
}


function bindScreenTap(screenEl, handler) {
    if (!screenEl) {
        return;
    }
    const onTap = (e) => {
        if (isInteractiveElement(e.target)) {
            return;
        }
        e.preventDefault();
        handler();
    };
    screenEl.addEventListener('pointerup', onTap);
}

function setupSwipeControls() {
    const SWIPE_THRESHOLD = 24;
    const findTouch = (e) => {
        if (swipeTouchId == null) {
            return null;
        }
        for (const t of e.changedTouches) {
            if (t.identifier === swipeTouchId) {
                return t;
            }
        }
        return null;
    };

    const onStart = (e) => {
        if (gameState !== GAME_STATE.PLAYING) {
            return;
        }
        if (isOverlayBlocked() || isNameEntryVisible()) {
            return;
        }
        if (isInteractiveElement(e.target)) {
            return;
        }
        if (e.target && e.target.closest && e.target.closest('#banner')) {
            return;
        }
        const t = e.changedTouches[0];
        if (!t) {
            return;
        }
        swipeTouchId = t.identifier;
        swipeStartX = t.clientX;
        swipeStartY = t.clientY;
        swipeMoved = false;
        e.preventDefault();
    };

    const onMove = (e) => {
        const t = findTouch(e);
        if (!t) {
            return;
        }
        const dx = t.clientX - swipeStartX;
        const dy = t.clientY - swipeStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            swipeMoved = true;
            if (dx > 0) {
                pressedKeys.add('ArrowRight');
                pressedKeys.delete('ArrowLeft');
            } else {
                pressedKeys.add('ArrowLeft');
                pressedKeys.delete('ArrowRight');
            }
        }
        e.preventDefault();
    };

    const onEnd = (e) => {
        const t = findTouch(e);
        if (!t) {
            return;
        }
        if (swipeMoved) {
            pressedKeys.delete('ArrowRight');
            pressedKeys.delete('ArrowLeft');
        } else if (gameState === GAME_STATE.PLAYING) {
            player.tryJump();
        }
        lastCanvasInputAt = Date.now();
        swipeTouchId = null;
        swipeMoved = false;
        e.preventDefault();
    };

    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    canvas.addEventListener('touchcancel', onEnd, { passive: false });
}

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    gameContainer = document.getElementById('gameContainer');
    isTouchDevice = ('ontouchstart' in window) || window.matchMedia('(pointer: coarse)').matches;

    // キャンバスサイズ設定（DPR対応）
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('blur', () => pressedKeys.clear());

    // ランキング読み込み
    loadLeaderboard().then(() => {
        highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
        document.getElementById('highScore').textContent = highScore;
        document.getElementById('bestScore').textContent = highScore;
        renderLeaderboard();
    });

    // プレイヤー初期化
    player = new Player();

    // キャラクター顔画像読み込み
    loadHeadImages();
    pickHeadImage();

    // 背景レイヤー初期化
    backgroundLayers = [
        new BackgroundLayer(0.3, 'rgba(255, 255, 255, 0.2)', 150), // 遠景雲
        new BackgroundLayer(0.5, 'rgba(255, 255, 255, 0.3)', 120), // 中景雲
        new BackgroundLayer(0.7, 'rgba(255, 255, 255, 0.4)', 100),  // 近景雲
    ];

    // イベントリスナー
    document.addEventListener('keydown', handleInput);
    document.addEventListener('keyup', handleInput);
    setupTouchControls();
    setupSwipeControls();
    bindGlobalTap();

    document.getElementById('openLeaderboardTitle')?.addEventListener('click', showLeaderboardScreen);
    document.getElementById('openLeaderboardGameOver')?.addEventListener('click', showLeaderboardScreen);
    document.getElementById('closeLeaderboard')?.addEventListener('click', closeLeaderboardScreen);
    document.getElementById('saveScoreButton')?.addEventListener('click', submitScore);
    document.getElementById('nicknameInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitScore();
        }
    });

    // ゲームループ開始
    gameLoop(0);
}

// ============================================
// 入力処理
// ============================================
function handleInput(e) {
    // SpaceキーまたはArrowUpキーでジャンプ
    const isJumpKey = e.type === 'keydown' && (e.code === 'Space' || e.code === 'ArrowUp');
    const isClickOrTouch = e.type === 'click' || e.type === 'touchstart';
    const isBikeControlKey = e.code === 'ArrowLeft' || e.code === 'ArrowRight';

    // 自転車加減速キーの処理（押下状態を記録）
    if (isBikeControlKey) {
        if (e.type === 'keydown') {
            pressedKeys.add(e.code);
        } else if (e.type === 'keyup') {
            pressedKeys.delete(e.code);
        }
        e.preventDefault();
        return;
    }

    // ジャンプキーの処理
    if (e.type === 'keydown' && !isJumpKey) {
        return;
    }

    if (isJumpKey || isClickOrTouch) {
        e.preventDefault();
    }

    if (gameState === GAME_STATE.TITLE) {
        if (isJumpKey || isClickOrTouch) {
            startGame();
        }
    } else if (gameState === GAME_STATE.PLAYING) {
        if (isJumpKey || isClickOrTouch) {
            player.tryJump();
        }
    } else if (gameState === GAME_STATE.GAME_OVER) {
        if (isJumpKey || isClickOrTouch) {
            resetGame();
        }
    }
}

// ============================================
// ゲーム開始
// ============================================
function startGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    resetGame();
}

// ============================================
// ゲームリセット
// ============================================
function resetGame() {
    gameState = GAME_STATE.PLAYING;
    player.reset();
    obstacles = [];
    holes = [];
    items = [];
    particles = [];
    // nextSpawnXを初期化（cameraX基準で画面右端の1.2倍の位置から開始）
    cameraX = 0;
    nextSpawnX = cameraX + CONFIG.CANVAS_WIDTH * 1.2;
    lastGapSpawnX = -1000;
    lastItemSpawnX = -1000;
    gameStartTime = Date.now();
    forceSpawnDone = false;
    activeEffects.headSwapUntil = 0;
    activeEffects.slowUntil = 0;
    activeEffects.fastUntil = 0;
    activeEffects.tripleJump = false;
    activeEffects.swapAt = 0;
    activeEffects.slowAt = 0;
    activeEffects.fastAt = 0;
    activeEffects.goldAt = 0;
    bikeColor = defaultBikeColor;
    pressedKeys.clear();
    pickHeadImage();
    activeEffects.headSwapOriginalKey = currentHeadKey;
    worldSpeed = CONFIG.BASE_WORLD_SPEED;
    bikeSpeed = CONFIG.BASE_WORLD_SPEED;
    targetBikeSpeed = CONFIG.BASE_WORLD_SPEED;
    score = 0;
    distanceTraveled = 0;
    shakeFrames = 0;
    shakeOffset = { x: 0, y: 0 };
    inputBuffer = [];
    wasGrounded = true;
    slowmoFrames = 0;
    flashFrames = 0;
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('leaderboardScreen')?.classList.add('hidden');
    document.getElementById('nameEntryScreen')?.classList.add('hidden');
    document.getElementById('score').textContent = 0;
}

// ============================================
// ゲームオーバー
// ============================================
function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    slowmoFrames = Math.floor(CONFIG.SLOWMO_DURATION / 16.67);

    document.getElementById('finalScore').textContent = score;

    if (isScoreQualifying(score)) {
        showNameEntry(score);
    } else {
        document.getElementById('highScore').textContent = highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    startShake(CONFIG.SHAKE_DURATION, CONFIG.SHAKE_INTENSITY);
}

// ============================================
// 更新処理（update順に従って実装）
// ============================================
function update(deltaTime) {
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }

    // スローモーション処理
    let actualDeltaTime = deltaTime;
    if (slowmoFrames > 0) {
        actualDeltaTime = deltaTime * CONFIG.SLOWMO_SCALE;
        slowmoFrames--;
    }

    const dt = actualDeltaTime / 16.67; // 60fps基準に正規化

    // ============================================
    // 1) worldSpeed を distance から計算（上限あり）
    // ============================================
    updateActiveEffects();
    const speedMul = getWorldSpeedMultiplier();
    worldSpeed = CONFIG.BASE_WORLD_SPEED + CONFIG.ACCEL_PER_METER * distanceTraveled;
    worldSpeed = Math.min(worldSpeed, CONFIG.MAX_WORLD_SPEED);
    worldSpeed *= speedMul;

    // ============================================
    // 2) cameraX += worldSpeed * dt
    // ============================================
    cameraX += worldSpeed * dt;

    // ============================================
    // 3) 入力から targetBikeSpeed を更新（加速度ベース）
    // ============================================
    const bikeMinSpeed = worldSpeed * CONFIG.BIKE_MIN_MUL;
    const bikeMaxSpeed = worldSpeed * CONFIG.BIKE_MAX_MUL;
    const accel = player.isGrounded ? CONFIG.ACCEL_GROUND : CONFIG.ACCEL_AIR;

    if (pressedKeys.has('ArrowRight')) {
        // 右キー：加速
        targetBikeSpeed += accel * dt;
        targetBikeSpeed = Math.min(targetBikeSpeed, bikeMaxSpeed);
    } else if (pressedKeys.has('ArrowLeft')) {
        // 左キー：減速
        targetBikeSpeed -= accel * dt;
        targetBikeSpeed = Math.max(targetBikeSpeed, bikeMinSpeed);
    } else {
        // 無入力：worldSpeedに戻る
        const diff = worldSpeed - targetBikeSpeed;
        if (Math.abs(diff) > 0.1) {
            const returnAccel = accel * 0.5; // 戻り速度は少し遅め
            targetBikeSpeed += Math.sign(diff) * returnAccel * dt;
            targetBikeSpeed = Math.max(bikeMinSpeed, Math.min(bikeMaxSpeed, targetBikeSpeed));
        } else {
            targetBikeSpeed = worldSpeed;
        }
    }

    // 画面左端での制約：左端にいる時だけworldSpeed未満を禁止
    if (player.screenX <= CONFIG.PLAYER_MIN_X) {
        // 左端：worldSpeed未満にしない（= worldに置いていかれない）
        targetBikeSpeed = Math.max(targetBikeSpeed, worldSpeed);
    }

    // targetBikeSpeedを許容範囲内にクランプ
    targetBikeSpeed = Math.max(bikeMinSpeed, Math.min(bikeMaxSpeed, targetBikeSpeed));

    // ============================================
    // 4) 加速度で bikeSpeed を targetBikeSpeed に近づける
    //    a = isGrounded ? accelGround : accelAir
    // ============================================
    const diff = targetBikeSpeed - bikeSpeed;
    if (Math.abs(diff) > 0.1) {
        const sign = diff > 0 ? 1 : -1;
        bikeSpeed += sign * accel * dt;
        // 行き過ぎ防止
        if ((diff > 0 && bikeSpeed > targetBikeSpeed) || (diff < 0 && bikeSpeed < targetBikeSpeed)) {
            bikeSpeed = targetBikeSpeed;
        }
    } else {
        bikeSpeed = targetBikeSpeed;
    }

    // 画面左端での制約：左端にいる時だけworldSpeed未満を禁止
    if (player.screenX <= CONFIG.PLAYER_MIN_X) {
        bikeSpeed = Math.max(bikeSpeed, worldSpeed);
    }

    // ============================================
    // 5) player.screenX += (bikeSpeed - worldSpeed) * dt
    //    ここが肝：worldSpeedとの差分が画面内での前後移動になる
    // ============================================
    player.screenX += (bikeSpeed - worldSpeed) * dt;

    // ============================================
    // 6) player.screenX を clamp(minX, maxX)
    //    clampしたら必要に応じて bikeSpeed/targetBikeSpeed も境界条件に合わせて補正
    // ============================================
    const oldScreenX = player.screenX;
    player.screenX = Math.max(CONFIG.PLAYER_MIN_X, Math.min(CONFIG.PLAYER_MAX_X, player.screenX));

    // 境界での速度制約
    if (player.screenX >= CONFIG.PLAYER_MAX_X) {
        // 右端：worldSpeed*2超にしない（= 上限）
        if (targetBikeSpeed > bikeMaxSpeed) {
            targetBikeSpeed = bikeMaxSpeed;
        }
        if (bikeSpeed > bikeMaxSpeed) {
            bikeSpeed = bikeMaxSpeed;
        }
    }

    // ============================================
    // 7) player.worldX = cameraX + player.screenX
    // ============================================
    player.worldX = cameraX + player.screenX;

    // ============================================
    // 8) 縦方向物理（重力、接地、穴なら落下）
    // ============================================
    player.update(dt * 16.67); // deltaTimeを渡す

    // 穴の上では地面がない
    let isOnHole = false;
    for (let hole of holes) {
        if (player.worldX + 15 > hole.worldX && player.worldX - 15 < hole.worldX + hole.width) {
            isOnHole = true;
            // 地面より下に落ちた場合
            if (player.y + 5 > CONFIG.PLAYER_GROUND_Y) {
                gameOver();
                return;
            }
        }
    }

    // 穴の上にいる場合は、地面との衝突判定を無効化
    if (isOnHole && player.isGrounded) {
        // 穴の上では地面がないので、isGroundedをfalseにする
        player.isGrounded = false;
    }

    // 強制配置（開始から1秒後）
    if (!forceSpawnDone && Date.now() - gameStartTime > 1000) {
        const forceSpawnX = player.worldX + 600;
        obstacles.push(new Obstacle(forceSpawnX));
        forceSpawnDone = true;
    }

    // 地形生成
    generateTerrain();

    // 障害物更新（画面外のものを削除）
    obstacles = obstacles.filter(obs => !obs.isOffScreen(cameraX));

    // 穴更新
    holes = holes.filter(hole => !hole.isOffScreen(cameraX));
    // アイテム更新
    items = items.filter(item => !item.isOffScreen(cameraX));


    // パーティクル更新
    particles.forEach(p => {
        p.update();
    });
    particles = particles.filter(p => !p.isDead(cameraX));

    // ============================================
    // 9) 当たり判定（障害物）は player.worldX / player.y を基準に world座標で判定
    // ============================================
    const playerWorldBounds = {
        x: player.worldX - 15,
        y: player.y - 25,
        width: 30,
        height: 30
    };

    // アイテム取得判定
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = player.worldX - item.worldX;
        const dy = (player.y - 10) - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < item.radius + 18) {
            applyItemEffect(item.type);
            items.splice(i, 1);
        }
    }

    // 障害物との衝突（world座標で判定）
    for (let obs of obstacles) {
        const obsWorldBounds = {
            x: obs.worldX,
            y: obs.y,
            width: obs.width,
            height: obs.height
        };
        if (checkCollision(playerWorldBounds, obsWorldBounds)) {
            createHitEffect(obs.worldX, obs.y + obs.height / 2);
            gameOver();
            return;
        }
    }

    // スコア更新（distanceTraveled = cameraX）
    distanceTraveled = cameraX;
    score = Math.floor(distanceTraveled / 10);
    document.getElementById('score').textContent = score;

    // ベストスコア更新
    if (score > highScore) {
        highScore = score;
        document.getElementById('bestScore').textContent = highScore;
    }

    // スクリーンシェイク更新
    updateShake();

    // フラッシュ更新
    if (flashFrames > 0) {
        flashFrames--;
    }
}

// ============================================
// 描画処理
// ============================================
function draw() {
    // キャンバスクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // シェイクオフセット適用
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // 背景グラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8C8');
    gradient.addColorStop(1, '#6B8E23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // パララックス背景（左に流れる）
    backgroundLayers.forEach(layer => layer.draw(cameraX, distanceTraveled));

    // 地面描画
    drawGround();

    // 障害物描画
    obstacles.forEach(obs => obs.draw(cameraX));

    // アイテム描画
    items.forEach(item => item.draw(cameraX));

    // パーティクル描画
    particles.forEach(p => p.draw(cameraX));

    // プレイヤー描画
    player.draw(cameraX);

    // フラッシュエフェクト
    if (flashFrames > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashFrames / 3 * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // UI描画（Canvas上）
    drawUI();

    // デバッグ表示
    drawDebugInfo();

    ctx.restore();
}

// ============================================
// デバッグ情報描画
// ============================================
function drawDebugInfo() {
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }

    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const debugY = CONFIG.CANVAS_HEIGHT - 20;
    let line = 0;

    const bikeMinSpeed = worldSpeed * CONFIG.BIKE_MIN_MUL;
    ctx.fillText(`worldSpeed: ${worldSpeed.toFixed(2)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`bikeSpeed: ${bikeSpeed.toFixed(2)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`targetBikeSpeed: ${targetBikeSpeed.toFixed(2)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`bikeMinSpeed: ${bikeMinSpeed.toFixed(2)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`player.screenX: ${player.screenX.toFixed(1)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`player.worldX: ${player.worldX.toFixed(1)}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`isGrounded: ${player.isGrounded}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`jumpCount: ${player.jumpCount}`, 10, debugY - line * 18);
    line++;
    ctx.fillText(`cameraX: ${cameraX.toFixed(1)}`, 10, debugY - line * 18);
    line++;

    // 最も近い障害物の情報を表示
    if (obstacles.length > 0) {
        const nearestObstacle = obstacles.reduce((nearest, obs) => {
            return (obs.worldX < nearest.worldX) ? obs : nearest;
        }, obstacles[0]);
        const nearestScreenX = nearestObstacle.worldX - cameraX;
        const dxWorld = nearestObstacle.worldX - player.worldX;
        const dxScreen = nearestScreenX - player.screenX;

        ctx.fillText(`nearest.worldX: ${nearestObstacle.worldX.toFixed(1)}`, 10, debugY - line * 18);
        line++;
        ctx.fillText(`nearest.screenX: ${nearestScreenX.toFixed(1)}`, 10, debugY - line * 18);
        line++;
        ctx.fillText(`dxWorld: ${dxWorld.toFixed(1)}`, 10, debugY - line * 18);
        line++;
        ctx.fillText(`dxScreen: ${dxScreen.toFixed(1)}`, 10, debugY - line * 18);
    }

    ctx.shadowBlur = 0;
}

// ============================================
// 地面描画
// ============================================
function drawGround() {
    const groundY = CONFIG.PLAYER_GROUND_Y;
    const groundHeight = CONFIG.GROUND_HEIGHT;

    // 背景グラデーション（穴用）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.5, '#98D8C8');
    bgGradient.addColorStop(1, '#6B8E23');

    // 地面の矩形
    ctx.fillStyle = CONFIG.GROUND_COLOR;
    ctx.fillRect(0, groundY, canvas.width, groundHeight);

    // タイルパターン（ランダム差分、cameraX基準）
    const tileWorldStart = Math.floor(cameraX / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
    const tileWorldEnd = cameraX + CONFIG.CANVAS_WIDTH + CONFIG.TILE_SIZE;

    for (let worldX = tileWorldStart; worldX < tileWorldEnd; worldX += CONFIG.TILE_SIZE) {
        const screenX = worldX - cameraX;
        const tileSeed = Math.floor(worldX / CONFIG.TILE_SIZE);
        const isDark = (tileSeed % 3) === 0;

        // タイルの色
        ctx.fillStyle = isDark ? CONFIG.GROUND_DARK : CONFIG.GROUND_LIGHT;
        ctx.fillRect(screenX, groundY, CONFIG.TILE_SIZE, groundHeight);

        // タイルの境界線
        ctx.strokeStyle = CONFIG.GROUND_LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, groundY, CONFIG.TILE_SIZE, groundHeight);
    }

    // 地面上端の明るいライン
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // 速度感のハイライトライン（流れる、cameraX基準）
    const lineWorldStart = Math.floor(cameraX / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
    const lineWorldEnd = cameraX + CONFIG.CANVAS_WIDTH + CONFIG.TILE_SIZE;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let worldX = lineWorldStart; worldX < lineWorldEnd; worldX += CONFIG.TILE_SIZE) {
        const screenX = worldX - cameraX;
        ctx.beginPath();
        ctx.moveTo(screenX, groundY);
        ctx.lineTo(screenX, groundY + 5);
        ctx.stroke();
    }

    // 穴の部分を背景色で塗りつぶし
    holes.forEach(hole => {
        const screenX = hole.worldX - cameraX;
        if (screenX + hole.width > 0 && screenX < canvas.width) {
            ctx.fillStyle = bgGradient;
            ctx.fillRect(screenX, hole.y, hole.width, hole.height);
        }
    });
}

// ============================================
// UI描画
// ============================================
function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const centerX = CONFIG.CANVAS_WIDTH / 2;
    const centerY = CONFIG.CANVAS_HEIGHT / 2;

    if (gameState === GAME_STATE.TITLE) {
        const startText = isTouchDevice ? 'タップでスタート' : 'Space / クリックでスタート';
        ctx.fillText(startText, centerX - (isTouchDevice ? 80 : 150), centerY + 80);
        ctx.font = '18px Arial';
        const helpText = isTouchDevice
            ? '操作方法：左右ボタンで加減速 / タップでジャンプ'
            : '操作方法：←→加減速 / Spaceジャンプ / 空中でも1回追加ジャンプ可能';
        ctx.fillText(helpText, centerX - (isTouchDevice ? 190 : 250), centerY + 110);
    } else if (gameState === GAME_STATE.GAME_OVER) {
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Game Over', centerX - 80, centerY - 40);
        const retryText = isTouchDevice ? 'タップでリトライ' : 'Space / クリックでリトライ';
        ctx.fillText(retryText, centerX - (isTouchDevice ? 80 : 150), centerY + 100);
    } else if (gameState === GAME_STATE.PLAYING) {
        // プレイ中に操作方法を表示（小さく、右上）
        const hintText = isTouchDevice ? 'タップ:ジャンプ / 左右:加減速' : '←→:加減速 / Space:ジャンプ(2段可)';
        ctx.font = isTouchDevice ? '12px Arial' : '14px Arial';
        ctx.shadowBlur = 2;
        const hintX = CONFIG.CANVAS_WIDTH - (isTouchDevice ? 260 : 350);
        ctx.fillText(hintText, hintX, 30);
    }

    ctx.shadowBlur = 0;
}

// ============================================
// ゲームループ
// ============================================
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime || 16.67;
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// ============================================
// ゲーム開始
// ============================================
init();
