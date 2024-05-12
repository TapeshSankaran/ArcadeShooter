class Laser extends Phaser.Physics.Arcade.Sprite
{
	constructor(scene, x, y) {
		super(scene, x, y, 'laser');
	}

	fire(x, y) {
		this.body.reset(x, y);

		this.setActive(true);
		this.setVisible(true);

		this.setVelocityY(-900);

	}

	kill() {
		this.body.reset(-10, -10);

		this.setActive(false);
		this.setVisible(false);

		this.setVelocityY(0);

	}
}

class LaserGroup extends Phaser.Physics.Arcade.Group
{
	constructor(scene) {
		super(scene.physics.world, scene);

		this.createMultiple({
			frameQuantity: 3000,
			key: 'laser',
			active: false,
			visible: false,
			classType: Laser
		});
	}

	fireBullet(x, y) {
		const laser = this.getFirstDead(false);

		if(laser) {
			laser.fire(x, y);
		}
	}
}

class SpaceScene extends Phaser.Scene
{
	constructor() {
		super('SpaceScene');

		this.ship;
		this.laserGroup;
		this.inputKeys;
		this.highScore = 0;
		this.score = 0;
		this.wave = 1;
		this.timeLeft = 120000;
		this.scrollSpeed = 0;
		this.scrollTotal = 0;
		this.canMove = true;
		this.over = false;
		this.shipX = -1;
		this.shootTime = 500;
		this.speed = 10;

        this.canShoot = true;
        this.numUFOS = 0;

        a: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
        enter: Phaser.Input.Keyboard.Key;
	}

	preload() {
        this.load.setPath('./assets/')
		this.load.image('laser', 'SHIP/PNG/Lasers/laserBlue04.png');
		this.load.image('ship', 'SHIP/PNG/playerShip1_red.png');
		this.load.image('bar', 'SHIP/PNG/Effects/shield3.png');
		this.load.image('spawn', 'SHIP/PNG/Lasers/laserRed08.png');
		this.load.image('background', 'SHIP/Backgrounds/darkPurple.png');
		this.load.image('ufob', 'UFO/PNG/shipBeige_manned.png');
		this.load.image('ufop', 'UFO/PNG/shipPink_manned.png');
		this.load.image('ufobl', 'UFO/PNG/shipBlue_manned.png');
		this.load.image('ufog', 'UFO/PNG/shipGreen_manned.png');
		this.load.image('ufoy', 'UFO/PNG/shipYellow_manned.png');
		this.load.image('ufod', 'UFO/PNG/laserBlue_burst.png');
		this.load.image('red', 'red.png');
		this.load.audio('bgmusic', ['finalMusic.mp3']);
		this.load.audio('shot', ['shot.mp3']);
		this.load.audio('wave', ['wave.mp3']);
		this.load.audio('boom', ['explosion.mp3']);
	}

	create() {
		this.sound.pauseOnBlur = false;

		if (this.shipX < 0)
			this.cameras.main.fadeIn(1000, 0, 0, 0);
	
		this.bg = this.add.tileSprite(0, -16, 1200, 2600, 'background');
		this.emerScreen = this.add.tileSprite(0, -16, 1200, 2600, 'red');
		this.emerScreen.alpha = 0;
		this.bg.tilePositionY += this.scrollTotal;
		
		//reset highscore
		//this.saveHighscore(0);

		this.highScore = this.loadHighscore();

		this.music = this.sound.add('bgmusic');
		this.shootSound = this.sound.add('shot', {volume: 0.2});
		this.waveSound = this.sound.add('wave', {volume: 1});
		this.boomSound = this.sound.add('boom', {volume: 1});
		this.music.play()
		this.laserGroup = new LaserGroup(this);

		this.waveText = this.add.text(275, 30, 'Wave 1', {
			fontSize: 32, 
			color: '#FFCD3D', 
			align: 'center'
		}).setOrigin(0.5, 0.5);

		this.scoreText = this.add.text(275, 70, 'Score 0', {
			fontSize: 40, 
			color: '#FFCD3D', 
			align: 'center'
		}).setOrigin(0.5, 0.5);

		this.timeText = this.add.text(275, 110, 'time', {
			fontSize: 32, 
			color: '#FFCD3D', 
			align: 'center'
		}).setOrigin(0.5, 0.5);

		this.enterText = this.add.text(275, 600, '[Press Enter to Restart]', {
			fontSize: 24, 
			color: '#FFCD3D', 
			align: 'center'
		}).setOrigin(0.5, 0.5);

		this.enterText.visible = false;

		this.barrier = this.add.image(275, 70, 'bar');
		this.barrier.scale *= 1.4
		this.barrier.rotation = 3.1415926535;
		this.barrier.alpha = 0.5
        //this.waveText.setTint(0xffcd3d, 0xcaae5a, 0xffcd3d, 0xcaae5a);

		this.reinitialize();

		this.addShip();
		this.addEvents();
        
        this.ufos = this.physics.add.group();
        this.spawnUFO();
	}

	saveHighscore(score) {
		localStorage.setItem('highscore', score);
	}
	  
	loadHighscore() {
		const highscore = localStorage.getItem('highscore');
		return highscore ? parseInt(highscore) : 0; 
	}

	reinitialize() {
		this.score = 0;
		this.wave = 1;
		this.timeLeft = 120000;
		this.canMove = true;
		this.over = false;
		this.midPoint = false;
		this.shootTime = 500;
		this.speed = 10;

        this.canShoot = true;
        this.numUFOS = 0;
		this.timeBuf = this.game.getTime() + 64170;
	}

	addShip() {

		let centerX = this.shipX;
		if (centerX == -1) {
			centerX = this.cameras.main.width / 2;
		}
		const bottom = this.cameras.main.height;
		this.ship = this.add.image(centerX, bottom - 90, 'ship');
	}

	addEvents() {
		this.inputKeys = [
			this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
		];

        this.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

		this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
	}

    spawnUFO() {
		this.stringarray = ["ufob", "ufobl", "ufop", "ufog", "ufoy"];
		let num = Phaser.Math.Between(4, 10);
        for (let i = 0; i < num; i++) {
			this.addTwine(this.stringarray[i % 5]);
		}

        this.numUFOS += num;
    }

    addTwine(color) {
        this.origin = [Phaser.Math.Between(10, 540), Phaser.Math.Between(10, 540)]
        this.dec = [this.origin[0] > 270 ? Phaser.Math.Between(-270, -10) : Phaser.Math.Between(10, 270), this.origin[1] > 270 ? Phaser.Math.Between(-270, -10) : Phaser.Math.Between(10, 270)]
        this.p1 = [this.origin[0]+this.dec[0], this.origin[1]+this.dec[1]]; 
        this.dec = [this.p1[0] > 270 ? Phaser.Math.Between(-270, -10) : Phaser.Math.Between(10, 270), this.p1[1] > 270 ? Phaser.Math.Between(-270, -10) : Phaser.Math.Between(10, 270)]
        this.p2 = [this.p1[0]+this.dec[0], this.p1[1]+this.dec[1]]; 
        this.points = [
			this.origin[0], this.origin[1],
			this.p1[0], this.p1[1],
			this.p2[0], this.p2[1],
        ];
		this.delay = Phaser.Math.Between(2000, 4000);
        this.curve = new Phaser.Curves.Spline(this.points);
		this.alien = this.add.follower(this.curve, this.origin[0], this.origin[1], color);
		this.spawner = this.add.image(this.alien.x, this.alien.y, 'spawn');
		this.spawner.scale *= 1.5;
		this.spawner.rotation += Phaser.Math.Between(40, 60);
		this.tweens.add({
			targets: this.spawner,
			alpha: { from: 1, to: 0},
			rotation: {from: 0, to: 90},
			ease: 'Sine.easeInOut',
			//repeat: 2,
			duration: 500
		});

		this.tweens.add({
			targets: this.alien,
			alpha: { from: 0, to: 1},
			ease: 'Sine.easeIn',
			duration: 500
			
		});
		this.alien.scale *= 0.4;
		this.alien.startFollow({
			from: 0,
			to: 1,
			delay: 0,
			duration: this.delay,
			ease: 'Sine.easeInOut',
			repeat: -1,
			yoyo: true,
			rotateToPath: false,
			rotationOffset: -90
		});

        this.physics.add.existing(this.alien);
        this.ufos.add(this.alien);
    }

	fireBullet() {
		this.laserGroup.fireBullet(this.ship.x, this.ship.y - 20);
	}

    handleCollision(laser, ufo) {
		if (laser != null) {

			this.score += 100;
			laser.kill();
        	ufo.destroy();
		} else {
			ufo.active = false;
			ufo.visible = false;
			this.over = true;
		}
		this.boomSound.play();
		this.boom = this.add.image(ufo.x, ufo.y, 'ufod');
		this.boom.scale *= 0.75
		this.boom.rotation += Phaser.Math.Between(45, 135);
		this.tweens.add({
			targets: this.boom,
			alpha: { from: 1, to: 0},
			ease: 'Sine.easeOut',
			duration: 500
			
		});
		if (laser != null) {
        	this.numUFOS--;
			if (this.numUFOS == 0) {
				this.waveSound.play();
				this.score += 500 * (0.5 * this.wave);
				this.wave++;
				const text = "Wave " + this.wave;
				this.waveText.setText(text);
				this.spawnUFO();
			}
		}
    }

	update() {
        if (this.d.isDown && this.ship.x < 540 && this.canMove){
            this.ship.x += 7;
        }
        
        if (this.a.isDown && this.ship.x > 10 && this.canMove){
            this.ship.x -= 7;
        }

        if (this.enter.isDown && this.ship.x > 10 && this.over){
			this.scene.restart();
        }

		if (this.timeLeft < 25000) {
			this.shootTime = 250;
			this.speed = 20;
			if (this.emerScreen.alpha < 0.1 && this.canMove) {
				this.emerScreen.alpha += 0.01;
			}
		}

		// Loop over all keys
		this.inputKeys.forEach(key => {
			// Check if the key was just pressed, and if so -> fire the bullet
			if(this.canShoot && key.isDown && this.canMove) {
				this.score -= 20 * (0.25 * this.wave);
				this.shootSound.play();
				this.fireBullet();
                this.canShoot = false;
                this.time.delayedCall(this.shootTime, () => {
                    this.canShoot = true;
                });
			}
		});

        this.laserGroup.children.iterate(laser => {
            this.ufos.children.iterate(ufo => {
				//console.log(laser)
                if (this.physics.overlap(laser, ufo)) {
                    this.handleCollision(laser, ufo);
                }
            });
        });



		if (this.timeLeft >= 0) 
			this.timeLeft = this.timeBuf - this.game.getTime();
		
		if (!this.over)
			this.timeText.setText(Math.trunc(this.timeLeft / 1000));

		this.scoreText.setText("Score " + this.score);

		if (this.scrollSpeed < this.speed && this.timeLeft > 0) this.scrollSpeed += 0.1;

        this.bg.tilePositionY -= this.scrollSpeed;

		if (this.timeLeft <= 1000) {
			if (this.emerScreen.alpha > 0) {
				this.emerScreen.alpha -= 0.001;
			}
			this.canMove = false;
			if (this.scrollSpeed >= 0.2)
				this.scrollSpeed -= 0.1;
			else {
				this.time.delayedCall(1000, () => {
					if (!this.over) {
						this.ufos.children.iterate(ufo => {
							this.handleCollision(null, ufo);
						});
					}
					this.barrier.visible = false;
					this.scoreText.y = 475;
					this.waveText.y = 435;
					this.timeText.y = 515;
					if (this.highScore < this.score) {
						this.highScore = this.score;
						this.saveHighscore(this.highScore);
					}
					this.timeText.setText("High Score " + this.highScore);
					this.enterText.visible = true;
					this.scrollTotal = this.bg.tilePositionY;
					this.shipX = this.ship.x;

				});
			}
		}
	}
}

class StartScreen extends Phaser.Scene {
    constructor() {
        super({key: 'StartScreen'});
        
        space: Phaser.Input.Keyboard.Key;
    }

    preload () {
        this.load.setPath("./assets/");
        this.load.image('background', 'SHIP/Backgrounds/purple.png');
		this.load.audio('bg', 'bgmusic.mp3');
		this.load.image('ship', 'SHIP/PNG/playerShip1_red.png');
		this.load.image('ufob', 'UFO/PNG/shipBeige_manned.png');
		this.load.image('laser', 'SHIP/PNG/Lasers/laserBlue04.png');
    }

    create () {
		this.sound.pauseOnBlur = false;
        this.background = this.add.tileSprite(-16, -16, 1200, 2600, 'background');
		this.bgm = this.sound.add('bg');
		this.bgm.play({loop: -1});
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		
		this.waveText = this.add.text(275, -300, 'XESpace Shooter', {
			//fontFamily: 'Arial',
			fontSize: 60, 
			color: '#FFCD3D', 
			align: 'center',
		}).setOrigin(0.5, 0.5);

		this.spaceStart = this.add.text(275, 700, '[Press Space to Start]', {
			//fontFamily: 'Arial',
			fontSize: 32, 
			color: '#FFCD3D', 
			align: 'center',
		}).setOrigin(0.5, 0.5);

		this.controls = this.add.text(275, 600, '↑\nSpace:\n← D: left  | Shoot | right :A →', {
			//fontFamily: 'Arial',
			fontSize: 24, 
			color: '#FFCD3D', 
			align: 'center',
		}).setOrigin(0.5, 0.5);
		
		this.controls.visible = false;
		this.spaceStart.visible = false;

		this.tweens.add({
			targets: this.waveText,
			y: {from: -300, to: 300},
			//ease: 'Sine.easeOut',
			duration: 8900
		});

		this.ufo = this.add.image(275, 150, 'ufob');
		this.ufo.scale *= 0.4;

		this.points = [
			-100, -100,
			800, 800,
			300, 900,
			275, 500
		];

		this.curve = new Phaser.Curves.Spline(this.points);
		this.ship = this.add.follower(this.curve, -100, -100, 'ship');

		this.curve2 = new Phaser.Curves.Spline([
			275, 450,
			275, 200
		]);

		this.laser = this.add.follower(this.curve2, 275, 450, 'laser');
		this.laser.visible = false;
		
		this.ship.startFollow({
			from: 0,
			to: 1,
			delay: 0,
			duration: 4000,
			ease: 'Sine.easeIn',
			//repeat: -1,
			//yoyo: true,
			rotateToPath: true,
			rotationOffset: 90,
			onComplete: () => {
				this.laser.visible = true;
				this.controls.visible = true;
			}
		});
		
		this.laser.startFollow({
			from: 0,
			to: 1,
			delay: 4000,
			duration: 2000,
			ease: 'Sine.easeOut',
			//repeat: -1,
			//yoyo: true,
			rotateToPath: true,
			rotationOffset: 90
		});

		this.time.delayedCall(9000, () => {
			this.spaceStart.visible = true;
			this.tweens.add({
				targets: this.spaceStart,
				alpha: {from: 0.1, to: 1},
				ease: 'Sine.easeInOut',
				repeat: -1,
				yoyo: true,
				duration: 1000
			});
		});

		this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
			this.bgm.stop();
			this.scene.start('SpaceScene');
		})
	}

    update () {
		if (Phaser.Input.Keyboard.JustDown(this.space)) {
			this.cameras.main.fadeOut(1000, 0, 0, 0);
		}
		this.background.tilePositionY -= 1;
    }
}

const config = {
	type: Phaser.AUTO,
	width: 550,
	height: 950,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: { y: 0 }
		}
	},
	scene: [
		StartScreen,
		SpaceScene
	]
};

const game = new Phaser.Game(config);
