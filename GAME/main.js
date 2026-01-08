const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const gravity = 0.8;

    // optional

/* ================== ULTIMATE EFFECTS ================== */
let showUltimate = false;
let ultimateTimer = 0;
let ultimateOwner = null; // "player" or "enemy"

let shakeIntensity = 0;
let timeScale = 1;


/* ================== GAME MODE ================== */
let gameMode = "single"; // "single" or "two"
function setMode(mode){
  gameMode = mode;
}

/* ================== LOAD IMAGE ================== */
const load = src => { const i = new Image(); i.src = src; return i; };


let images = {};

/* ================== CHARACTER STATS (ADDED) ================== */
const characterStats = {
  multo: {
    atk: 10,
    hp: 100,
    def: 0.15,
    speed: 4
  },
  vampire: {
    atk: 15,
    hp: 90,
    def: 0.05,
    speed: 7
  },
  mananangal: {
    atk: 14,
    hp: 91,
    def: 0.10,
    speed: 5
  }
};

/* ================== CHARACTERS ================== */
const createFighter = (x, facing) => ({
  x, y:300, w:150, h:210,
  dx:0, dy:0,

  atk:10,            // ADDED
  def:0,             // ADDED
  speed:5,           // ADDED

  hp:100, maxHp:100,
  mana:100, maxMana:100,

  facing,
  state:"idle",
  blocking:false,
  projectileImg:null,
  attacking:false,
  attackTimer:0,
  attackCooldown:0,
  hurtTimer:0
});

const player = createFighter(150,"right");
const enemy  = createFighter(650,"left");

/* ================== INPUT ================== */
const keys = {};
document.addEventListener("keydown", e=>{
  keys[e.key.toLowerCase()] = true;
  e.preventDefault();
});
document.addEventListener("keyup", e=>{
  keys[e.key.toLowerCase()] = false;
});

let playerName = "Player";

/* ================== CHARACTER SELECT ================== */
function selectChar(name){
  playerName = name.charAt(0).toUpperCase()+name.slice(1);

  /* APPLY STATS (ADDED) */
  const stats = characterStats[name];
  player.atk = stats.atk;
  player.def = stats.def;
  player.speed = stats.speed;
  player.hp = stats.hp;
  player.maxHp = stats.hp;

  images.player = {
    idle:load(`assets/img/${name}_idle.png`),
    jump:load(`assets/img/${name}_jump.png`),
    punch:load(`assets/img/${name}_punch.png`),
    kick:load(`assets/img/${name}_kick.png`),
    ultimate:load(`assets/img/${name}_ultimate.png`),
    dead:load(`assets/img/${name}_dead.png`),
    hurt:load(`assets/img/${name}_hurt.png`)
  };
  player.projectileImg = load(`assets/img/${name}_projectile.png`);
   ultimateVideo = document.createElement("video");
ultimateVideo.src = `assets/vid/${name}_ult.mp4`; // path to your MP4
ultimateVideo.muted = true;        // autoplay works only if muted
ultimateVideo.playsInline = true;
ultimateVideo.preload = "auto";
ultimateVideo.loop = false;
}

function selectChar2(name){
  /* APPLY STATS (ADDED) */
  const stats = characterStats[name];
  enemy.atk = stats.atk;
  enemy.def = stats.def;
  enemy.speed = stats.speed;
  enemy.hp = stats.hp;
  enemy.maxHp = stats.hp;

  images.enemy = {
    idle:load(`assets/img/${name}_idle.png`),
    punch:load(`assets/img/${name}_punch.png`),
    kick:load(`assets/img/${name}_kick.png`),
    ultimate:load(`assets/img/${name}_ultimate.png`),
    dead:load(`assets/img/${name}_dead.png`),
    hurt:load(`assets/img/${name}_hurt.png`),
    jump:load(`assets/img/${name}_jump.png`),


  };
  enemy.ultimateVideo = document.createElement("video");
enemy.ultimateVideo.src = `assets/vid/${name}_ult.mp4`;
enemy.ultimateVideo.muted = true;
enemy.ultimateVideo.playsInline = true;
enemy.ultimateVideo.preload = "auto";

 
  enemy.projectileImg  = load(`assets/img/${name}_projectile.png`);
  canvas.style.display="block";
  loop();
}

/* ================== DRAW ================== */
function drawFighter(f,img){
  ctx.save();
  if(f.facing==="left"){
    ctx.translate(f.x+f.w,f.y);
    ctx.scale(-1,1);
    ctx.drawImage(img,0,0,f.w,f.h);
  } else {
    ctx.drawImage(img,f.x,f.y,f.w,f.h);
  }
  if(f.blocking){
    ctx.strokeStyle="cyan";
    ctx.strokeRect(f.x,f.y,f.w,f.h);
  }
  ctx.restore();
}

/* ================== PHYSICS ================== */
function physics(f){
  if(f.state==="dead") return;
  f.dy+=gravity;
  f.y+=f.dy;
  f.x+=f.dx;
  if(f.y>=300){
    f.y=300; f.dy=0;
    if(f.state==="jump") f.state="idle";
  }
}

/* ================== HIT ================== */
function hit(attacker, defender, dmg, knock) {
  if(defender.state === "dead") return;

  if(attacker.x < defender.x + defender.w &&
     attacker.x + attacker.w > defender.x &&
     attacker.y < defender.y + defender.h) {

    const isFacing =
      (attacker.facing === "right" && attacker.x < defender.x) ||
      (attacker.facing === "left" && attacker.x > defender.x);
    if(!isFacing) return;

    const attackRange = attacker.w;
    const distance = Math.abs(
      attacker.x + attacker.w / 2 -
      (defender.x + defender.w / 2)
    );
    if(distance > attackRange) return;

    const blocked = defender.blocking;
    let finalDmg = blocked ? dmg * 0.2 : dmg;

    /* DEFENSE APPLIED (ADDED) */
    finalDmg *= (1 - defender.def);

    defender.hp -= finalDmg;

    const dir = attacker.facing === "right" ? 1 : -1;
    defender.dx += knock * dir * (blocked ? 0.3 : 1);

    const verticalKnock = Math.min(knock * 0.6, 15) * (blocked ? 0.2 : 1);
    defender.dy += -verticalKnock;

    defender.state = "hurt";
    defender.hurtTimer = Math.min(Math.floor(finalDmg / 2) + 5, 20);
  }
}

/* ================== PROJECTILES ================== */
const shots=[];
function shoot(f){
  if(f.mana<20||f.state==="dead") return;
  f.mana-=20;
  shots.push({
    x:f.facing==="right"?f.x+f.w:f.x-20,
    y:f.y+40,
    speed:f.facing==="right"?8:-8,
    owner:f,
    img:f.projectileImg
  });
}

function updateShots(){
  shots.forEach((s,i)=>{
    s.x+=s.speed;
    ctx.drawImage(s.img,s.x,s.y,30,20);
    const t = s.owner===player?enemy:player;
    if(s.x>t.x&&s.x<t.x+t.w){
      hit(s.owner,t,s.owner.atk,10);
      shots.splice(i,1);
    }
    if(s.x<0||s.x>canvas.width) shots.splice(i,1);
  });
}

/* ================== ULTIMATE ================== */
function ultimateFighter(fighter, target){
  if(fighter.mana < 100 || fighter.state === "dead") return;

  fighter.mana = 0;
  fighter.state = "ultimate";

  showUltimate = true;
  ultimateOwner = fighter;
  ultimateTimer = 60;

  shakeIntensity = 12;
  timeScale = 0.4;

  ultimateVideo.currentTime = 0;
  ultimateVideo.play();

  const box = {
    x: fighter.facing === "right" ? fighter.x + fighter.w : fighter.x - 220,
    y: fighter.y,
    w: 220,
    h: fighter.h
  };

  if(box.x < target.x + target.w && box.x + box.w > target.x){
    hit(fighter, target, fighter.atk * 3, 18);
  }
}

/* ================== PLAYER 1 CONTROLS ================== */
function controls(){
  if(player.state==="dead") return;
  player.dx=0;
  player.blocking=keys["b"];

  if(keys["a"]){player.dx=-player.speed;player.facing="left";}
  if(keys["d"]){player.dx= player.speed;player.facing="right";}
  if(keys["w"]&&player.y===300){player.dy=-15;player.state="jump";}

  if(player.attackCooldown>0) player.attackCooldown--;

  if(!player.attacking){
    if(keys["j"]&&player.attackCooldown===0){
      player.state="punch";
      hit(player,enemy,player.atk*0.6,6);
      player.attackCooldown=20;
    }
    if(keys["k"]&&player.attackCooldown===0){
      player.state="kick";
      hit(player,enemy,player.atk*0.8,10);
      player.attackCooldown=25;
    }
  }

  if(keys["p"]) shoot(player);
  if(keys["u"]) ultimateFighter(player, enemy);
}

/* ================== PLAYER 2 CONTROLS ================== */
function controlsP2(){
  if(gameMode!=="two") return;
  enemy.dx=0;
  enemy.blocking=keys["/"];

  if(keys["arrowleft"]){enemy.dx=-enemy.speed;enemy.facing="left";}
  if(keys["arrowright"]){enemy.dx= enemy.speed;enemy.facing="right";}
  if(keys["arrowup"]&&enemy.y===300){enemy.dy=-15;enemy.state="jump";}

  if(enemy.attackCooldown>0) enemy.attackCooldown--;

  if(keys["."]&&enemy.attackCooldown===0){
    enemy.state="punch";
    hit(enemy,player,enemy.atk*0.6,6);
    enemy.attackCooldown=20;
  }
  if(keys[","]&&enemy.attackCooldown===0){
    enemy.state="kick";
    hit(enemy,player,enemy.atk*0.8,10);
    enemy.attackCooldown=25;
  }

  if(keys["shift"]) shoot(enemy);
  if(keys["enter"]) ultimateFighter(enemy, player);

}

/* ================== ENEMY AI ================== */
function enemyAI(){
  if(gameMode==="two") return;
  if(enemy.attackCooldown>0) enemy.attackCooldown--;
  const dist=player.x-enemy.x;

  if(Math.abs(dist)>120){
    enemy.dx=dist>0?enemy.speed:-enemy.speed;
    enemy.facing=enemy.dx<0?"left":"right";
  } else enemy.dx=0;

  if(Math.abs(dist)<160&&enemy.attackCooldown===0){
    enemy.state=Math.random()<0.5?"punch":"kick";
    hit(enemy,player,enemy.atk*0.7,8);
    enemy.attackCooldown=120;
  }
}
if(enemy.mana >= 100 && Math.abs(dist) < 200 && Math.random() < 0.005){
  ultimateFighter(enemy, player);
}


/* ================== UI ================== */
function bars(){
  ctx.fillStyle="white";
  ctx.font="16px Arial";
  ctx.fillText(playerName,50,20);
  ctx.fillText(gameMode==="two"?"Player 2":"Computer",550,20);

  ctx.fillStyle="green";
  ctx.fillRect(50,30,(player.hp/player.maxHp)*200,15);
  ctx.fillRect(550,30,(enemy.hp/enemy.maxHp)*200,15);

  ctx.fillStyle="blue";
  ctx.fillRect(50,50,(player.mana/player.maxMana)*200,10);
  ctx.fillRect(550,50,(enemy.mana/enemy.maxMana)*200,10);
}

/* ================== LOOP ================== */
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();

if(shakeIntensity > 0){
  const shakeX = (Math.random() - 0.5) * shakeIntensity;
  const shakeY = (Math.random() - 0.5) * shakeIntensity;
  ctx.translate(shakeX, shakeY);
  shakeIntensity *= 0.85; // decay
}

if(showUltimate){
  const vid = ultimateOwner === player
    ? ultimateVideo
    : enemy.ultimateVideo;

  if(!vid.paused && !vid.ended){
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
  }

  ultimateTimer--;
  if(ultimateTimer <= 0){
    showUltimate = false;
    shakeIntensity = 0;
    timeScale = 1;
    ultimateOwner.state = "idle";
    vid.pause();
  }
}


ctx.restore();

  bars();
  controls();
  gameMode==="single"?enemyAI():controlsP2();
  physics(player);
  physics(enemy);
  updateShots();

  if(player.state==="hurt"){player.hurtTimer--; if(player.hurtTimer<=0) player.state="idle";}
  if(enemy.state==="hurt"){enemy.hurtTimer--; if(enemy.hurtTimer<=0) enemy.state="idle";}

  if(player.hp<=0) player.state="dead";
  if(enemy.hp<=0) enemy.state="dead";

  drawFighter(player,images.player[player.state]||images.player.idle);
  drawFighter(enemy,images.enemy[enemy.state]||images.enemy.idle);

  player.mana=Math.min(100,player.mana+0.1);
  enemy.mana=Math.min(100,enemy.mana+0.1);

  if(player.state==="dead"){ctx.fillText("YOU LOSE",350,200);return;}
  if(enemy.state==="dead"){ctx.fillText("YOU WIN",350,200);return;}

setTimeout(() => requestAnimationFrame(loop), 16 / timeScale);

}

