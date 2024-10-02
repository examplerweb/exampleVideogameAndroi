const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'phaser-container', // Asegúrate de tener un div con este ID en tu HTML
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: 0,
            debug: false
        }
    },
    input: {
        gamepad: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


const game = new Phaser.Game(config);

let playerName = '';
let player;
let cursors;
let enemies;
let bullets;
let fireButton;
let scoreText;
let score = 0;
let time = 0; 
const bulletTime = 200;
let enemiesAdded = 7;
let enemySpeedIncrease = 1.5;
let gamepad; // Variable para almacenar el gamepad

function preload() {
    this.load.image('sky', window.assetPaths.sky);
    this.load.image('ship', window.assetPaths.ship);
    this.load.image('enemy', window.assetPaths.enemy);
    this.load.image('bullet', window.assetPaths.bullet);
    this.load.audio('backgroundMusic', 'assets/music.mp3');
    this.load.audio('laserSound', 'assets/laser.wav');
}

function create() {
    this.music = this.sound.add('backgroundMusic', { loop: true });
    this.music.play();
    this.add.image(400, 300, 'sky');

    this.laserSound = this.sound.add('laserSound');

    const introText = this.add.text(400, 200, 'Ingresa tu nombre:', { fontSize: '24px', fill: '#fff' });
    introText.setOrigin(0.5);

    const input = document.createElement('input');
    input.type = 'text';
    input.style = 'font-size: 24px; text-align: center; width: 200px; position:absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            playerName = input.value;
            input.remove();
            startGame.call(this);
        }
    });
    this.game.canvas.parentElement.appendChild(input);

     player = this.physics.add.image(400, 500, 'ship').setOrigin(0.5, 0.5).setScale(0.5);
    player.setCollideWorldBounds(true);

    this.tweens.add({
        targets: player,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
	
	
	const leftButton = this.add.rectangle(100, 500, 100, 50, 0x00ff00).setInteractive();
const rightButton = this.add.rectangle(700, 500, 100, 50, 0x00ff00).setInteractive();
const fireButton = this.add.rectangle(400, 500, 100, 50, 0xff0000).setInteractive();

leftButton.on('pointerdown', () => {
    player.setVelocityX(-300);
});
leftButton.on('pointerup', () => {
    player.setVelocityX(0);
});

rightButton.on('pointerdown', () => {
    player.setVelocityX(300);
});
rightButton.on('pointerup', () => {
    player.setVelocityX(0);
});

fireButton.on('pointerdown', () => {
    fireBullet.call(this);
});


enemies = this.physics.add.group({
    key: 'enemy',
    repeat: 0,
    setXY: { x: 12, y: 0, stepX: 70 }
});

enemies.children.iterate((enemy) => {
    enemy.setScale(0.5);
});


enemies.children.iterate((enemy) => {
    enemy.setScale(0.5);
});

	
}

function startGame() {
    this.cameras.main.fadeOut(500);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        initializeGame.call(this);
        this.cameras.main.resetFX();
    });
}

function initializeGame() {
    this.physics.resume();
    this.add.image(400, 300, 'sky');

    const playerNameText = this.add.text(10, 40, 'Player: ', { fontSize: '24px', fill: '#fff' });
    playerNameText.setOrigin(0);
    playerNameText.setText('Player: ' + playerName);

    player = this.physics.add.sprite(400, 500, 'ship');
    player.setCollideWorldBounds(true);

    enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 0,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    respawnEnemies.call(this);
    bullets = this.physics.add.group();

    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(player, enemies, hitPlayer, null, this);

    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '24px', fill: '#fff' });
    score = 0;

    // Agregar botones táctiles
    createTouchControls.call(this);

    const welcomeText = this.add.text(400, 200, '¡Bienvenido, ' + playerName + '!', { fontSize: '48px', fill: '#fff', fontFamily: 'Arial', fontStyle: 'bold' });
    welcomeText.setOrigin(0.5);
    welcomeText.setStroke('#00ff00', 5);
    welcomeText.setShadow(2, 2, '#00ff00', 2, true, true);

    setTimeout(() => {
        welcomeText.destroy();
    }, 3000);
}

function createTouchControls() {
    const leftButton = this.add.rectangle(100, 500, 100, 50, 0x00ff00).setInteractive();
    const rightButton = this.add.rectangle(700, 500, 100, 50, 0x00ff00).setInteractive();
    const fireButton = this.add.rectangle(400, 500, 100, 50, 0xff0000).setInteractive();

    leftButton.on('pointerdown', () => {
        player.setVelocityX(-300);
    });
    leftButton.on('pointerup', () => {
        player.setVelocityX(0);
    });

    rightButton.on('pointerdown', () => {
        player.setVelocityX(300);
    });
    rightButton.on('pointerup', () => {
        player.setVelocityX(0);
    });

    fireButton.on('pointerdown', () => {
        fireBullet.call(this);
    });
}

function update(timeElapsed, delta) {
    if (playerName !== '') {
        time += delta / 1000;

        // Verificar si hay un gamepad conectado
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            gamepad = this.input.gamepad.getPad(0);
        }

        // Manejar input del teclado
        handleKeyboardInput.call(this);

        // Manejar input del gamepad si está disponible
        if (gamepad) {
            handleGamepadInput.call(this, gamepad);
        }

        // Verifica y respawnea enemigos
        if (enemies) {
            respawnEnemies.call(this);
        }

        // Actualizar partículas
        updateParticles.call(this);
    }
}

function handleKeyboardInput() {
    if (cursors && player) {
        let moveX = 0;

        if (cursors.left.isDown) {
            moveX = -300;
            emitParticles.call(this, player.x, player.y);
        } else if (cursors.right.isDown) {
            moveX = 300;
            emitParticles.call(this, player.x, player.y);
        }

        player.setVelocityX(moveX);

        if (fireButton.isDown) {
            fireBullet.call(this);
        }
    }
}

function handleGamepadInput(gamepad) {
    if (gamepad.axes) {
        let moveX = 0;

        // Verifica el movimiento en el eje horizontal (eje 0)
        if (gamepad.axes[0].getValue() < -0.5) {
            moveX = -300; // Mover a la izquierda
            emitParticles.call(this, player.x, player.y);
        } else if (gamepad.axes[0].getValue() > 0.5) {
            moveX = 300; // Mover a la derecha
            emitParticles.call(this, player.x, player.y);
        }

        player.setVelocityX(moveX); // Actualiza la velocidad

        // Verifica si el botón de disparo (por ejemplo, el botón 0) está presionado
        if (gamepad.buttons[0].pressed) {
            fireBullet.call(this);
        }
    }
}

function emitParticles(x, y) {
    const particle = this.add.graphics({ x: x, y: y + 24 });
    particle.fillStyle(0xFFFF00, 1);
    particle.fillCircle(0, 0, 3);

    this.tweens.add({
        targets: particle,
        alpha: { start: 1, to: 0 },
        y: y + 60,
        duration: 500,
        onComplete: () => {
            particle.destroy();
        }
    });
}

function fireBullet() {
    const bullet = bullets.create(player.x, player.y - 20, 'bullet');
    bullet.setVelocityY(-300);
    this.laserSound.play();
    this.tweens.add({
        targets: bullet,
        tint: 0xff0000,
        duration: 200,
        yoyo: true,
        repeat: -1
    });
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    this.tweens.add({
        targets: enemy,
        alpha: 0,
        duration: 100,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
            enemy.destroy();
        }
    });
    score += 10;
    scoreText.setText('Score: ' + score);
}

function hitPlayer(player, enemy) {
    gameOver.call(this);
}

const MAX_ENEMIES = 20;

function respawnEnemies() {
    let livingEnemies = enemies.getChildren().filter(enemy => enemy.active).length;

    if (livingEnemies < MAX_ENEMIES) {
        for (let i = 0; i < enemiesAdded; i++) {
            if (livingEnemies >= MAX_ENEMIES) break;

            let enemy = enemies.create(Phaser.Math.Between(0, 800), Phaser.Math.Between(-100, -50), 'enemy');
            enemy.setBounce(1);
            enemy.setVelocity(Phaser.Math.FloatBetween(-200, 200) * enemySpeedIncrease, 20 * enemySpeedIncrease);
            enemy.setCollideWorldBounds(true);

            this.tweens.add({
                targets: enemy,
                angle: 360,
                duration: 16000,
                ease: 'Linear',
                repeat: -1
            });
        }

        enemiesAdded += 3;
        enemySpeedIncrease *= 1.2;
    }
}


function gameOver() {
    this.physics.pause();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    const gameOverText = this.add.text(400, 200, 'Game Over', { fontSize: '48px', fill: '#fff' });
    gameOverText.setOrigin(0.5);
    gameOverText.setAlpha(0);

    this.tweens.add({
        targets: gameOverText,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2',
    });

    const finalScoreText = this.add.text(400, 250, 'Score: ' + score, { fontSize: '24px', fill: '#fff' });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setAlpha(0);

    this.tweens.add({
        targets: finalScoreText,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2'
    });

    const playerNameTextGameOver = this.add.text(400, 300, 'Player: ' + playerName, { fontSize: '24px', fill: '#fff' });
    playerNameTextGameOver.setOrigin(0.5);
    playerNameTextGameOver.setAlpha(0);

    this.tweens.add({
        targets: playerNameTextGameOver,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2'
    });

    const timeText = this.add.text(400, 350, 'Time: ' + Math.floor(time) + 's', { fontSize: '24px', fill: '#fff' });
    timeText.setOrigin(0.5);
    timeText.setAlpha(0);

    this.tweens.add({
        targets: timeText,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2'
    });

    const restartText = this.add.text(400, 400, 'Presiona SPACE o el botón de disparo para reiniciar', { fontSize: '24px', fill: '#fff' });
    restartText.setOrigin(0.5);
    restartText.setAlpha(0);

    this.tweens.add({
        targets: restartText,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2'
    });

    scoreText.setVisible(false);

    // Escuchar el evento de tecla para reiniciar
    this.input.keyboard.once('keydown-SPACE', function () {
        resetGame.call(this);
    });

    // Escuchar el evento del gamepad para reiniciar
    if (gamepad) {
        this.input.gamepad.once('down', (pad, button) => {
            if (button.index === 0 || button.index === 7) { // 0 para disparar, 7 para start
                resetGame.call(this);
            }
        });
    }
}

function resetGame() {
    window.location.reload();
}

function updateParticles() {
    // Puedes agregar lógica aquí si necesitas actualizar partículas.
    // Actualmente está vacía.
}
