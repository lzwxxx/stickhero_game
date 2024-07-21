let game;
let gameOptions = {
    platformGapRange: [200, 400],
    platformWidthRange: [50, 150],
    platformHeight: 600,
    playerWidth: 32,
    playerHeight: 64,
    poleWidth: 8,
    growTime: 500,
    rotateTime: 500,
    walkTime: 3,
    fallTime: 500,
    scroll: 250
}
const idle = 0;
const wait = 1;
const grow = 2;
const walk = 3;

class stickHero extends Phaser.Scene{
    constructor(){
        super("stickHero");
    }
    
    addPlatforms(){
        this.mainPlatform = 0;
        this.platforms = [];
        this.platforms.push(this.addPlatform(0));
        this.platforms.push(this.addPlatform(game.config.width));
        this.tweenPlatform();
    }
    addPlatform(posX){
        let platform = this.add.sprite(posX, game.config.height - gameOptions.platformHeight, "tile");
        platform.displayWidth = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;
        platform.displayHeight = gameOptions.platformHeight;
        platform.alpha = 0.7;
        platform.setOrigin(0, 0);
        return platform
    }
    addCoin(){
        this.coin = this.add.sprite(0, game.config.height - gameOptions.platformHeight + gameOptions.playerHeight / 2, "coin");
        this.coin.visible = false;
    }
    placeCoin(){
        this.coin.x = Phaser.Math.Between(this.platforms[this.mainPlatform].getBounds().right + 10, this.platforms[1 - this.mainPlatform ].getBounds().left - 10);
        this.coin.visible = true;
    }
    tweenPlatform(){
        let destination = this.platforms[this.mainPlatform].displayWidth + Phaser.Math.Between(gameOptions.platformGapRange[0], gameOptions.platformGapRange[1]);
        let size = Phaser.Math.Between(gameOptions.platformWidthRange[0], gameOptions.platformWidthRange[1]);
        this.tweens.add({
            targets: [this.platforms[1 - this.mainPlatform]],
            x: destination,
            displayWidth: size,
            duration: gameOptions.scroll,
            callbackScope: this,
            onComplete: function(){
                this.gameMode = wait;
                this.placeCoin();
            }
        })
    }
    addPlayer(){
        this.player = this.add.sprite(this.platforms[this.mainPlatform].displayWidth - gameOptions.poleWidth, game.config.height - gameOptions.platformHeight, "player");
        this.player.setOrigin(1, 1)
    }
    addPole(){
        this.pole = this.add.sprite(this.platforms[this.mainPlatform].displayWidth, game.config.height - gameOptions.platformHeight, "tile");
        this.pole.setOrigin(1, 1);
        this.pole.displayWidth = gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.playerHeight / 4;
    }
    grow(){
        if(this.gameMode == wait){
            this.gameMode = grow;
            this.growTween = this.tweens.add({
                targets: [this.pole],
                displayHeight: gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1],
                duration: gameOptions.growTime
            });
        }
        if(this.gameMode == walk){
            if(this.player.flipY){
                this.player.flipY = false;
                this.player.y = game.config.height - gameOptions.platformHeight;
            }
            else{
                this.player.flipY = true;
                this.player.y = game.config.height - gameOptions.platformHeight + gameOptions.playerHeight - gameOptions.poleWidth;
                let playerBound = this.player.getBounds();
                let platformBound = this.platforms[1 - this.mainPlatform].getBounds();
                if(Phaser.Geom.Rectangle.Intersection(playerBound, platformBound).width != 0){
                    this.player.flipY = false;
                    this.player.y = game.config.height - gameOptions.platformHeight;
                }
            }
        }
    }
    stop(){
        if(this.gameMode == grow){
            this.gameMode = idle;
            this.growTween.stop();
            if(this.pole.displayHeight > this.platforms[1 - this.mainPlatform].x - this.pole.x){
                this.tweens.add({
                    targets: [this.pole],
                    angle: 90,
                    duration: gameOptions.rotateTime,
                    ease: "Bounce.easeOut",
                    callbackScope: this,
                    onComplete: function(){
                        this.gameMode = walk;
                        if(this.pole.displayHeight < this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.x){
                            this.walkTween = this.tweens.add({
                                targets: [this.player],
                                x: this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.displayWidth,
                                duration: gameOptions.walkTime * this.pole.displayHeight,
                                callbackScope: this,
                                onComplete: function(){
                                    this.coin.visible = false;
                                    this.tweens.add({
                                        targets: [this.player, this.pole, this.platforms[1 - this.mainPlatform], this.platforms[this.mainPlatform]],
                                        props: {
                                            x: {
                                                value: "-= " +  this.platforms[1 - this.mainPlatform].x
                                            }
                                        },
                                        duration: gameOptions.scroll,
                                        callbackScope: this,
                                        onComplete: function(){
                                            this.prepareNextMove();
                                        }
                                    })
                                }
                            })
                        }
                        else{
                            this.platformTooLong();
                        }
                    }
                })
            }
            else{
                this.platformTooShort();
            }
        }
    }
    // game over
    platformTooLong(){
        this.walkTween = this.tweens.add({
            targets: [this.player],
            x: this.pole.x + this.pole.displayHeight + this.player.displayWidth,
            duration: gameOptions.walkTime * this.pole.displayHeight,
            callbackScope: this,
            onComplete: function(){
                this.fallAndDie();
            }
        })
    }
    // game over
    platformTooShort(){
        this.tweens.add({
            targets: [this.pole],
            angle: 90,
            duration: gameOptions.rotateTime,
            ease: "Cubic.easeIn",
            callbackScope: this,
            onComplete: function(){
                this.gameMode = walk;
                this.tweens.add({
                    targets: [this.player],
                    x: this.pole.x + this.pole.displayHeight,
                    duration: gameOptions.walkTime * this.pole.displayHeight,
                    callbackScope: this,
                    onComplete: function(){
                        this.tweens.add({
                            targets: [this.pole],
                            angle: 180,
                            duration: gameOptions.rotateTime,
                            ease: "Cubic.easeIn"
                        })
                        this.fallAndDie();
                    }
                })
            }
        })
    }

    // game over 
    fallAndDie(){
        this.gameMode = idle;
        this.tweens.add({
            targets: [this.player],
            y: game.config.height + this.player.displayHeight * 2,
            duration: gameOptions.fallTime,
            ease: "Cubic.easeIn",
            callbackScope: this,
            onComplete: function(){
                this.shakeAndRestart();
            }
        })
    }


    prepareNextMove(){
        this.gameMode = idle;
        this.platforms[this.mainPlatform].x = game.config.width;
        this.mainPlatform = 1 - this.mainPlatform;
        this.tweenPlatform();
        this.pole.angle = 0;
        this.pole.x = this.platforms[this.mainPlatform].displayWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
    }

    // after game over 
    shakeAndRestart(){
        this.cameras.main.shake(800, 0.01);
        this.time.addEvent({
            delay: 2000,
            callbackScope: this,
            callback: function(){
                this.scene.start("stickHero");
            }
        })
    }
    
    resize(){
        let canvas = document.querySelector("canvas");
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let windowRatio = windowWidth / windowHeight;
        let gameRatio = game.config.width / game.config.height;
        if(windowRatio < gameRatio){
            canvas.style.width = windowWidth + "px";
            canvas.style.height = (windowWidth / gameRatio) + "px";
        }
        else{
            canvas.style.width = (windowHeight * gameRatio) + "px";
            canvas.style.height = windowHeight + "px";
        }
    }

    preload(){
        this.load.image("tile", "asset/tile.png");
        this.load.image("coin", "asset/coin1.png");
        this.load.image("player", "asset/player.png");
    }
    create(){
       this.scale.on('resize', this.resize, this); 
        this.addCoin();
        this.addPlatforms();
        this.addPlayer();
        this.addPole();
        this.input.on("pointerdown", this.grow, this);
        this.input.on("pointerup", this.stop, this);
    }
    update(){
        if(this.player.flipY){
            let playerBound = this.player.getBounds();
            let coinBound = this.coin.getBounds();
            let platformBound = this.platforms[1 - this.mainPlatform].getBounds();
            if(Phaser.Geom.Rectangle.Intersection(playerBound, platformBound).width != 0){
                this.walkTween.stop();
                this.gameMode = idle;
                this.shakeAndRestart();
            }
            if(this.coin.visible && Phaser.Geom.Rectangle.Intersection(playerBound, coinBound).width != 0){
                this.coin.visible = false;
            }
        }
    }
};



const gameConfig = {
    type: Phaser.AUTO,
   width: 750,
    height: 1334,
    scene: [stickHero],
    backgroundColor: 0x0c88c7,
    mode: Phaser.Scale.FIT,
    physics: {
        default: 'matter',
        matter: {
            debug:false,
            gravity:{y:0}
        }
    },
    // using phasermattercollisionplugin for eventhandling
    plugins: {
        scene:[
            {
                plugin: PhaserMatterCollisionPlugin,
                key: "matterCollision",
                mapping: "matterCollision"
            }
        ]
    }
}
game = new Phaser.Game(gameConfig);