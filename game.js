// CONSOLE
(function() {
  if (!console) {
    console = {};
  }
  let old = console.log;
  let logger = document.querySelector("#logger > ul");
  console.log = function consoleLog(message) {
    if (typeof message == "object") {
      logger.innerHTML +=
        "<li>" +
        (JSON && JSON.stringify ? JSON.stringify(message) : String(message)) +
        "</li>";
    } else {
      logger.innerHTML += "<li>" + message + "</li>";
    }
  };
})();

// CANVAS
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// GLOBALS
let interval;
let images = {
  // Background
  bgOne: "./assets/bg/1.png",
  bgTwo: "./assets/bg/2.png",
  cover: "./assets/obstacles/intro.jpg",
  //Ships
  shipOne: "./assets/ship/redfighter0005.png",
  shipOneL: "./assets/ship/redfighter0001.png",
  shipOneR: "./assets/ship/redfighter0009.png",
  shipTwo: "./assets/ship/redfighternormal0005.png",
  shipTwoL: "./assets/ship/redfighternormal0001.png",
  shipTwoR: "./assets/ship/redfighternormal0009.png",
  attackTwo: "./assets/obstacles/attack2.png",
  //Obstacles
  asteroidOne: "./assets/obstacles/asteroid1.png",
  asteroidTwo: "./assets/obstacles/asteroid2.png",
  asteroidThree: "./assets/obstacles/asteroid3.png",
  // Effects
  explosionOne: "./assets/obstacles/explosion1.png",
  explosionTwo: "./assets/obstacles/explosion.png",
  flame: "./assets/obstacles/flame.png",
  // Enemies
  enemyOne: "./assets/obstacles/blueship1.png",
  enemyTwo: "./assets/obstacles/blueship2.png",
  enemyThree: "./assets/obstacles/redship4.png",
  attackOne: "./assets/obstacles/bullet.png",
  // Boss
  bossOne: "./assets/obstacles/boss1.png",
  bossAttack: "./assets/obstacles/eye.png"
};
let sound = {
  enemies: "./assets/enemies.mp3",
  laser: "./assets/laser.mp3",
  explosion: "./assets/explosion.mp3",
  grind: "./assets/grind.mp3",
  gameOver: "./assets/gameover.mp3",
  boss: "./assets/boss.mp3",
  win: "./assets/win.mp3",
  bg: "./assets/bg.mp3"
};
let frames = 0;
let gameOn = false;
let asteroids = [];
let enemies = [];
let attacks = [];
let explosions = [];
let kills = 0;
let score = 0;

// CLASSES
function Board() {
  this.x = 0;
  this.y = 0;
  this.width = canvas.width;
  this.height = canvas.height * 2;
  this.image = new Image();
  this.image.src = images.bgOne;
  this.draw = function() {
    if (this.y > this.height) this.y = 0;
    this.y += 3;
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.x,
      this.y - this.height,
      this.width,
      this.height
    );
  };
  this.image.onload = this.draw.bind(this);
}
class Ship {
  constructor(img, x = 200, hp = 100, damage = 3) {
    this.x = x;
    this.y = 100;
    this.width = 50;
    this.height = 70;
    this.velY = 0;
    this.hp = hp;
    this.damage = damage;
    this.image = new Image();
    this.image.onload = this.draw.bind(this);
    this.image.src = img;
    this.flame = new Image();
    this.flame.onload = this.moveForward.bind(this);
    this.flame.src = images.flame;
  }
  draw() {
    if (frames < 600 && this.y < 400) this.y += 0.5;
    if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    if (this.x < 0) this.x = 0;
    if (this.y > canvas.height - this.height)
      this.y = canvas.height - this.height;
    if (this.y < 0) this.y = 0;
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  checkIfTouch(obstacle) {
    return (
      this.x < obstacle.x + obstacle.width &&
      this.x + this.width > obstacle.x &&
      this.y < obstacle.y + obstacle.height &&
      this.y + this.height > obstacle.y
    );
  }
  moveForward() {
    ctx.drawImage(this.flame, this.x + 20, this.y + this.height, 10, 12);
  }
}
class Asteroid {
  constructor(x = 100, width = 100, src = 1, toRight = true) {
    this.x = x;
    this.y = -width;
    this.width = width;
    this.height = width;
    this.sx = 0;
    this.sy = 0;
    this.hp = width / 15;
    this.toRight = toRight;
    this.type = src;
    this.image = new Image();
    this.image.onload = this.draw.bind(this);
    this.image.src =
      src === 1
        ? images.asteroidOne
        : src === 2
        ? images.asteroidTwo
        : images.asteroidThree;
  }
  draw() {
    this.y++;
    this.toRight ? this.x++ : this.x--;
    if (frames % 8 === 0) this.sx += 200;
    if (this.type === 1 && this.sx === 3600) this.sx = 0;
    if (this.type === 2 && this.sx === 4800) this.sx = 0;
    if (this.type === 3 && this.sx === 3800) this.sx = 0;
    ctx.drawImage(
      this.image,
      this.sx,
      this.sy,
      200,
      200,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
class Enemy {
  constructor(x = 100, toRight = true, src = 1) {
    this.x = x;
    this.y = -40;
    this.width = 50;
    this.height = 70;
    this.hp = 15;
    this.damage = 3;
    this.toRight = true;
    this.image = new Image();
    this.image.onload = this.draw.bind(this);
    this.image.src =
      src === 1
        ? images.enemyOne
        : src === 2
        ? images.enemyTwo
        : images.enemyThree;
  }
  attack() {
    if (frames % 45 === 0)
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height,
        this.damage,
        true,
        "yellow",
        "regular"
      );
    if (frames % 200 === 0) {
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height,
        this.damage,
        true,
        "yellow",
        "special",
        "left"
      );
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height,
        this.damage,
        true,
        "yellow",
        "special",
        "center"
      );
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height,
        this.damage,
        true,
        "yellow",
        "special",
        "right"
      );
    }
  }
  draw() {
    this.y > 20 ? (this.y += 0.3) : this.y++;
    this.toRight ? this.x++ : this.x--;
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    if (frames % this.x === 0)
      this.toRight ? (this.toRight = false) : (this.toRight = true);
  }
}

class Boss {
  constructor() {
    this.x = 150;
    this.y = -250;
    this.width = 300;
    this.height = 200;
    this.sx = 0;
    this.sy = 0;
    this.hp = 200;
    this.damage = 2;
    this.toRight = true;
    this.image = new Image();
    this.image.onload = this.draw.bind(this);
    this.image.src = images.bossOne;
  }
  attack() {
    if (frames % 20 === 0)
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height,
        this.damage,
        true,
        "cyan",
        "regular"
      );
    if (frames % 100 === 0)
      generateAttack(
        this.x + this.width / 2,
        this.y + this.height / 2 + 100,
        this.damage,
        true,
        "yellow",
        "boss2"
      );
  }
  draw() {
    if (this.y < 20) this.y += 0.5;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    if (frames % 12 === 0) this.sx += 264;
    if (this.sx === 792) this.sx = 0;
    ctx.drawImage(
      this.image,
      this.sx,
      this.sy,
      264,
      190,
      this.x,
      this.y,
      this.width,
      this.height
    );
    this.toRight ? this.x++ : this.x--;
    if (frames % 150 === 0)
      this.toRight ? (this.toRight = false) : (this.toRight = true);
  }
}

class Explosion extends Enemy {
  constructor(x, y, width, isBoss = false) {
    super();
    this.x = x;
    this.y = y;
    this.sx = 0;
    this.sy = 0;
    this.width = width;
    this.height = width;
    this.isBoss = isBoss;
    this.image.src = isBoss ? images.explosionTwo : images.explosionOne;
  }
  draw() {
    if (this.isBoss) {
      if (frames % 6 === 0) this.sx += 96;
      if (this.sx === 1152) this.sx = 0;
      ctx.drawImage(
        this.image,
        this.sx,
        this.sy,
        96,
        96,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
}
// function explosion(x,y,width) {
//   ctx.drawImage(images.explosionOne, x, y, width, width)
// }

class Attack {
  constructor(
    x,
    y,
    damage = 2,
    isEnemy = false,
    color = "white",
    attackType,
    direction = "center"
  ) {
    this.x = x;
    this.y = y;
    this.width = 2;
    this.height = 7;
    this.sx = 0;
    this.sy = 0;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.attackType = attackType;
    this.direction = direction;
    this.color = color;
    this.image = new Image();
    this.image.onload = this.draw.bind(this);
    this.image.src =
      this.attackType === "special"
        ? images.attackOne
        : this.attackType === "power"
        ? images.attackTwo
        : images.bossAttack;
  }
  draw() {
    this.isEnemy ? (this.y += 4) : (this.y -= 4);
    if (this.attackType === "power") {
      this.width = 20;
      this.height = 60;
      if (frames % 12 === 0) this.sx += 83;
      if (this.sx === 830) this.sx = 0;
      ctx.drawImage(
        this.image,
        this.sx,
        this.sy,
        83,
        136,
        this.x,
        this.y,
        this.width,
        this.height
      );
      this.y -= 4;
    } else if (this.attackType === "special") {
      this.width = 15;
      this.height = 15;
      this.direction === "left"
        ? (this.x -= 2)
        : this.direction === "right"
        ? (this.x += 2)
        : this.x;
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else if (this.attackType === "boss2") {
      this.y -= 2;
      this.width = 60;
      this.height = 100;
      if (frames % 12 === 0) this.sx += 145;
      if (this.sx === 580) this.sx = 0;
      ctx.drawImage(
        this.image,
        this.sx,
        this.sy,
        145,
        383,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  checkIfTouch(obstacle) {
    return (
      this.x < obstacle.x + obstacle.width &&
      this.x + this.width > obstacle.x &&
      this.y < obstacle.y + obstacle.height &&
      this.y + this.height > obstacle.y
    );
  }
}

// INSTANCES
let board = new Board();
let ship1 = new Ship(images.shipOne, 150);
let ship2 = new Ship(images.shipTwo, 350);
let boss = new Boss();

//First screen
window.onload = () => {
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "cyan";
  ctx.fillText("SPACE ATTACK", 140, 50);
  ctx.font = "15px 'Press Start 2P'";
  ctx.fillText("Space bar to start", 130, 450);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "cyan";
  //Ship 1
  ctx.strokeRect(150, 225, 45, 45);
  ctx.fillText("W", 165, 255);
  ctx.strokeRect(105, 270, 45, 45);
  ctx.fillText("A", 120, 300);
  ctx.strokeRect(150, 270, 45, 45);
  ctx.fillText("S", 165, 300);
  ctx.strokeRect(195, 270, 45, 45);
  ctx.fillText("D", 210, 300);
  ctx.strokeRect(105, 350, 135, 45);
  ctx.fillText("SPACE", 135, 380);
  // Ship 2
  ctx.strokeRect(350, 225, 45, 45);
  ctx.fillText("↑", 365, 255);
  ctx.strokeRect(305, 270, 45, 45);
  ctx.fillText("←", 320, 300);
  ctx.strokeRect(350, 270, 45, 45);
  ctx.fillText("↓", 365, 300);
  ctx.strokeRect(395, 270, 45, 45);
  ctx.fillText("→", 410, 300);
  ctx.strokeRect(305, 350, 135, 45);
  ctx.fillText("RETURN", 330, 380);
};

// MAIN FUNCTIONS

function start() {
  interval = 0;
  gameOn = true;
  asteroids = [];
  enemies = [];
  attacks = [];
  explosions = [];
  frames = 0;
  kills = 0;
  score = 0;
  ship1.hp = 100;
  ship1.x = 150;
  ship2.x = 350;
  ship2.hp = 100;
  boss.hp = 200;
  document.querySelector("#logger > ul").innerHTML = "";
  interval = setInterval(update, 1000 / 60);
  soundBg.play();
}

function update() {
  frames++;
  board.draw();
  if (ship1.hp > 0) ship1.draw();
  if (ship2.hp > 0) ship2.draw();
  if (frames === 10) console.log("Welcome back! It's good to have you here!");
  if (frames === 400)
    console.log("Some of our allies have been attacked by Eyegull.");
  if (frames === 600) {
    console.log("Your mission is to destroy them. They are approaching!");
    soundEnemiesApr.play();
  }
  if (kills < 5) {
    generateAsteroids();
    generateEnemies();
  }
  if (kills >= 5) {
    boss.draw();
    boss.attack();
    bossStats();
    soundBg.pause();
    soundBoss.play();
  }
  updateAsteroid();
  updateEnemy();
  generateAttack();
  updateAttack();
  updateExplosion();
  checkCollision();
  gameScore();
}
function gameOver() {
  gameOn = false;
  soundGameOver.play();
  soundBoss.pause();
  soundBg.pause();
  clearInterval(interval);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "cyan";
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillText("SPACE ATTACK", 140, 50);
  ctx.font = "40px 'Press Start 2P'";
  ctx.fillStyle = "red";
  ctx.fillText("GAME OVER", 80, 200);
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "cyan";
  ctx.fillText("Your score: " + score, 120, 240);
  ctx.font = "15px 'Press Start 2P'";
  ctx.fillText("Space bar to start again", 100, 280);
}
function win() {
  gameOn = false;
  soundBoss.pause();
  soundBg.pause();
  soundWin.play();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  clearInterval(interval);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "cyan";
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillText("SPACE ATTACK", 140, 50);
  ctx.font = "30px 'Press Start 2P'";
  ctx.fillStyle = "red";
  ctx.fillText("YOU HAVE WON!", 80, 200);
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "cyan";
  ctx.fillText("Your score: " + score, 120, 240);
  ctx.font = "15px 'Press Start 2P'";
  ctx.fillText("Space bar to start again", 100, 280);
}

// AUX FUNCTIONS

//Sound
let soundEnemiesApr = new Audio();
soundEnemiesApr.src = sound.enemies;
soundEnemiesApr.loop = false;
soundEnemiesApr.currentTime = 0;

let soundLaser = new Audio();
soundLaser.src = sound.laser;
soundLaser.loop = false;

let soundExplosion = new Audio();
soundExplosion.src = sound.explosion;
soundExplosion.loop = false;

let soundExplosion2 = new Audio();
soundExplosion2.src = sound.explosion2;
soundExplosion2.loop = false;

let soundGrind = new Audio();
soundGrind.src = sound.grind;
soundGrind.loop = false;

let soundBoss = new Audio();
soundBoss.src = sound.boss;
soundBoss.loop = true;

let soundWin = new Audio();
soundWin.src = sound.win;
soundWin.loop = false;

let soundBg = new Audio();
soundBg.src = sound.bg;
soundBg.loop = true;

let soundGameOver = new Audio();
soundGameOver.src = sound.gameOver;
soundGameOver.currentTime = 0;

// Game score
function gameScore() {
  ctx.fillStyle = "black";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "cyan";
  ctx.strokeRect(0, 0, 512, 20);
  ctx.fillRect(0, 0, 512, 20);
  // Score
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillStyle = "cyan";
  ctx.fillText("Score:" + score, 410, 15);
  // Ship 1 life
  ctx.fillText("Player 1", 10, 15);
  ctx.fillStyle = "black";
  ctx.fillRect(90, 0, 110, 20);
  ctx.fillStyle = "green";
  ctx.fillRect(95, 5, ship1.hp, 10);
  // Ship 2 life
  ctx.fillStyle = "cyan";
  ctx.fillText("Player 2", 210, 15);
  ctx.fillStyle = "black";
  ctx.fillRect(295, 0, 110, 20);
  ctx.fillStyle = "green";
  ctx.fillRect(300, 5, ship2.hp, 10);
}
// Boss stats
function bossStats() {
  if (boss.hp > 0) {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "red";
    ctx.strokeRect(0, 20, 512, 20);
    ctx.fillRect(0, 20, 512, 20);
    ctx.fillStyle = "red";
    ctx.fillText("Eyegull", 120, 35);
    ctx.fillStyle = "green";
    ctx.fillRect(200, 25, boss.hp, 10);
  }
}

// Enemies and obstacles
function generateAsteroids() {
  let sizeOptions = [30, 40, 50, 70, 80, 90];
  let size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
  let timeOptions = [53, 241, 653];
  let time = timeOptions[Math.floor(Math.random() * timeOptions.length)];
  let xOptions = [-250, -200, -150, 400, 450, 500, 550];
  let x = xOptions[Math.floor(Math.random() * xOptions.length)];
  let asteroidOptions = [1, 2, 3];
  let asteroidType =
    asteroidOptions[Math.floor(Math.random() * asteroidOptions.length)];
  let toRight = x < 0;
  if (frames % time === 0 && frames >= 800) {
    let asteroid = new Asteroid(x, size, asteroidType, toRight);
    asteroids.push(asteroid);
  }
}
function updateAsteroid() {
  asteroids.forEach((asteroid, index) => {
    if (asteroid.y > canvas.height + asteroid.height) {
      asteroids.splice(index, 1);
    } else {
      asteroid.draw();
    }
  });
}

function generateEnemies() {
  let xOptions = [100, 150, 200, 250];
  let x = xOptions[Math.floor(Math.random() * xOptions.length)];
  let toRight = Math.random() > 0.5;
  let typeOptions = [1, 2, 3];
  let type = typeOptions[Math.floor(Math.random() * typeOptions.length)];
  if (frames % 300 === 0 && frames >= 800) {
    let enemy = new Enemy(x, toRight, type);
    enemies.push(enemy);
  }
}

function updateEnemy() {
  enemies.forEach((enemy, index) => {
    enemy.attack();
    if (enemy.y > canvas.height + enemy.height) {
      enemies.splice(index, 1);
    } else {
      enemy.draw();
    }
  });
}

function generateExplosion(x, y, width, isBoss) {
  let explosion = new Explosion(x, y, width, isBoss);
  explosions.push(explosion);
}

function updateExplosion() {
  explosions.forEach((explosion, index) => {
    if (frames % (boss.ifBoss ? 60 : 20) === 0) {
      explosions.splice(index, 1);
    } else {
      explosion.draw();
    }
  });
}

// Attacks and collisions
function generateAttack(x, y, damage, isEnemy, color, attackType, direction) {
  let attack = new Attack(x, y, damage, isEnemy, color, attackType, direction);
  attacks.push(attack);
}

function updateAttack() {
  attacks.forEach((attack, index) => {
    if (attack.y > canvas.height + attack.height || attack.y <= 0) {
      attacks.splice(index, 1);
    } else {
      attack.draw();
    }
  });
}

function checkCollision() {
  // Ship <> Ship
  if (ship1.checkIfTouch(ship2)) {
    if (frames % 50 === 0) {
      ship1.hp -= 5;
      ship2.hp -= 5;
      console.log("Captain! Our ships have touched!");
      //soundGrind.play();
      soundExplosion2.play();
      generateExplosion(ship1.x + 30, ship1.y + 40, 15);
    }
  }
  if (ship1.hp === 0 && ship2.hp === 0) {
    gameOver();
    ship1.x = 1000;
    ship2.x = 1000;
    console.log("Oh no! Eyegull has defeated us :(");
    soundExplosion.play();
  }
  if (ship1.hp < 0) {
    ship1.hp = 0;
    if (frames % 100 === 0) {
      ship1.x = 1000;
      console.log("Oh no! We have lost Ship 1! Ship 2, we are in your hands");
    }
    generateExplosion(ship1.x + ship1.width / 2, ship1.y, 100, true);
    soundExplosion.play();
  }
  if (ship2.hp < 0) {
    ship2.hp = 0;
    if (frames % 100 === 0) {
      ship2.x = 1000;
      console.log("Oh no! We have lost Ship 2! Ship 1, we are in your hands");
    }
    generateExplosion(ship2.x + ship2.width / 2, ship2.y, 100, true);
    soundExplosion.play();
  }
  // Asteroids <> ships
  asteroids.forEach((asteroid, index) => {
    if (ship1.checkIfTouch(asteroid)) {
      ship1.hp -= 3;
      generateExplosion(asteroid.x, asteroid.y, asteroid.width);
      asteroids.splice(index, 1);
      console.log("An asteroid has crashed against Ship 1!");
      soundExplosion.play();
    }
    if (ship2.checkIfTouch(asteroid)) {
      ship2.hp -= 3;
      generateExplosion(asteroid.x, asteroid.y, asteroid.width);
      asteroids.splice(index, 1);
      console.log("An asteroid has crashed against Ship 1!");
      soundExplosion.play();
    }
  });
  // Enemies <> ships
  enemies.forEach((enemy, index) => {
    if (ship1.checkIfTouch(enemy)) {
      ship1.hp -= 5;
      generateExplosion(enemy.x, enemy.y, enemy.width);
      enemies.splice(index, 1);
      console.log("An enemy has crashed against Ship 1!");
    }
    if (ship2.checkIfTouch(enemy)) {
      ship2.hp -= 5;
      generateExplosion(enemy.x, enemy.y, enemy.width);
      enemies.splice(index, 1);
      console.log("An enemy has crashed against Ship 1!");
    }
  });
  // Attack
  attacks.forEach((attack, attackIndex) => {
    if (attack.checkIfTouch(boss)) {
      if (boss.hp < 100)
        console.log("Eyegull not invencible! Let's destroy it!");
      attacks.splice(attackIndex, 1);
      if (boss.hp <= 0) {
        soundExplosion.play();
        console.log("Yesss! We've destroyed Eyegull!");
        generateExplosion(100, 100, 200, true);
        generateExplosion(200, 0, 100, true);
        generateExplosion(0, 10, 200, true);
        generateExplosion(350, 250, 100, true);
        generateExplosion(350, 100, 150, true);
        generateExplosion(300, 50, 200, true);
        generateExplosion(50, 250, 100, true);
        generateExplosion(200, 150, 300, true);
        generateExplosion(0, 250, 200, true);
        generateExplosion(350, 100, 150, true);
        generateExplosion(100, 50, 200, true);
        generateExplosion(250, 250, 100, true);
        generateExplosion(350, 100, 150, true);
        kills++;
        score += 200;
        setTimeout(() => {
          win();
        }, 1000);
      } else {
        generateExplosion(attack.x, attack.y, 20);
        boss.hp -= attack.damage;
        soundExplosion2.play();
      }
    }
    asteroids.forEach((asteroid, asteroidIndex) => {
      if (attack.checkIfTouch(asteroid)) {
        attacks.splice(attackIndex, 1);
        if (asteroid.hp < attack.damage) {
          console.log("Asteroid destroyed. +20 points!");
          generateExplosion(asteroid.x, asteroid.y, asteroid.width);
          asteroids.splice(asteroidIndex, 1);
          score += 20;
          soundExplosion2.play();
        } else {
          asteroid.hp -= attack.damage;
        }
      }
    });
    enemies.forEach((enemy, enemyIndex) => {
      if (attack.checkIfTouch(enemy)) {
        attacks.splice(attackIndex, 1);
        if (enemy.hp < attack.damage) {
          console.log("Enemy destroyed! +50 points!");
          generateExplosion(enemy.x, enemy.y, enemy.width);
          soundExplosion2.play();
          enemies.splice(enemyIndex, 1);
          kills++;
          score += 50;
        } else {
          enemy.hp -= attack.damage;
        }
      }
    });
    if (ship1.checkIfTouch(attack)) {
      ship1.hp -= attack.damage;
      attacks.splice(attackIndex, 1);
      generateExplosion(
        attack.x,
        attack.y,
        attack.width > 10 ? attack.width : 10
      );
    }
    if (ship2.checkIfTouch(attack)) {
      ship2.hp -= attack.damage;
      attacks.splice(attackIndex, 1);
      generateExplosion(
        attack.x,
        attack.y,
        attack.width > 10 ? attack.width : 10
      );
    }
  });
}
// LISTENERS
addEventListener("keydown", e => {
  if (!gameOn) {
    switch (e.keyCode) {
      case 32:
        start();
        break;
    }
  } else {
    switch (e.keyCode) {
      // Ship 1
      case 13: // enter
        if (ship1.hp > 0) {
          generateAttack(
            ship1.x + 15,
            ship1.y - 60,
            ship1.damage,
            false,
            "white",
            "power"
          );
          soundLaser.play();
        }
        break;
      case 37: // left
        if (ship1.hp > 0) {
          ship1.x -= 20;
          ship1.image.src = images.shipOneL;
          ship1.moveForward();
        }
        break;
      case 39: // right
        if (ship1.hp > 0) {
          ship1.x += 20;
          ship1.image.src = images.shipOneR;
          ship1.moveForward();
        }
        break;
      case 38: // front
        if (ship1.hp > 0) {
          ship1.y -= 20;
          ship1.image.src = images.shipOne;
          ship1.moveForward();
        }
        break;
      case 40: // back
        if (ship1.hp > 0) {
          ship1.y += 20;
          ship1.image.src = images.shipOne;
        }
        break;
      // Ship 2
      case 32: // space bar
        if (ship2.hp > 0) {
          generateAttack(
            ship2.x + 15,
            ship2.y - 60,
            ship2.damage,
            false,
            "white",
            "power"
          );
          soundLaser.play();
        }
        break;
      case 65: // left
        if (ship2.hp > 0) {
          ship2.x -= 20;
          ship2.image.src = images.shipTwoL;
        }
        break;
      case 68: // right
        if (ship2.hp > 0) {
          ship2.x += 20;
          ship2.image.src = images.shipTwoR;
        }
        break;
      case 87: // front
        if (ship2.hp > 0) {
          ship2.y -= 20;
          ship2.image.src = images.shipTwo;
        }
        break;
      case 83: // back
        if (ship2.hp > 0) {
          ship2.y += 20;
          ship2.image.src = images.shipTwo;
        }
        break;
    }
  }
});
