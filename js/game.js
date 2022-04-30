import './pixi.min.js';
import './charm.min.js';
import './ion.sound.min.js';

let btnplay, btnswitch, btnrestart,
    PLAYERS = {},
    Graphics = [
        'island',
        'tower',
        'ship',
        'coin',
        'bullet',
        'btn',
        'btnplay',
        'btnrestart',
        'btnswitch',
    ],
    Textures = {},
    panel, playfield, money, shipDiv, fpsDiv,
    started = false,
    rotAnim = 0,
    direction = true,
    prevTs = false,
    playW = 0,
    prevBullet = 0,
    bulletFrac,
    bulletSpeed,
    shipSpeed = 100,
    fireMode = 0,
    coins = {},
    coinF = false,
    coinL = false,
    bulletsArr = [],
    bulletsPull = [],
    bangParts = [],
    score = 0,
    level = 0,
    titres = true,
    dieing = false,
    switchOn = false,
    pause = false,
    audio = {},
    fps = 0,
    fts = 0,
    coinsCount = 30, coinSize,
    stage, ship, shipLayer, renderer, imgs, cham, island, tower,
    bang, btnbg, btn, btnCont, fade, lvlText, scoreText, game, scoreCoin,
    angle = 0,
    allW = 0,
    stageW = 0,
    allH = 0,
    cX = 0,
    cY = 0,
    radius = 0,
    scale = 1,
    orientation = 0,
    wave1, wave2, moneyCont, circle, bg;

function start() {
    if (titres) {
        document.body.className = ''
        titres = false
        if (switchOn) {
            cham.fadeOut(btnrestart, 10)
            cham.fadeIn(btnplay, 10)
        }
        newGame()
    } else {
        started = true;
        cham.fadeIn(btnswitch, 10)
        cham.fadeOut(btnplay, 10)
        prevTs = false
    }
}

function newGame() {
    bulletFrac = 400;
    bulletSpeed = 130;
    score = 0;
    level = 1;
    pause = false;
    lvlText.text = 'Level '+level;
    scoreText.text = score+'';
    resetLevel();
}

function resetLevel() {
    angle = 0, rotAnim = 0;
    prevBullet = 0;
    fireMode = 0;
    let b;
    while(b = bulletsArr.shift()) {
        b.done = true;
        b.alpha = 0;
        bulletsPull.push(b);
    }
    if (!direction) {
        ship.scale.x = -ship.scale.x;
        direction = true;
    }
    prevTs = false;
    coinF = 360;
    coinL = 0;
    ship.alpha = 1;
    let delay = 0;
    for(let deg in coins) {
        let c = coins[deg];
        coinF = Math.min(coinF, deg);
        coinL = Math.max(coinL, deg);
        if (!c.done) {
            continue;
        }
        c.done = false;
        setTimeout((function(c) {return function() {
            for(let i in c.chams) {
                c.chams[i].pause();
            }
            c.chams = [];

            cham.fadeIn(c, 15);
            cham.scale(c, c.stScale, c.stScale, 15);

        }})(c), delay);
        delay += 20;
    }
    let tSc = tower.scale.x;
    let iSc = island.scale.x;
    cham.scale(tower, tSc*1.15, tSc*1.15, 15).onComplete = function() {
        cham.scale(tower, tSc, tSc, 18);
    }
    cham.scale(island, iSc*1.08, iSc*1.08, 10).onComplete = function() {
        cham.scale(island, iSc, iSc, 12);
    }
}

function stop() {
    if (!titres) {
        titres = true;
        dieing = false;
        ge('results').className = 'results score';
        document.body.className = 'results_show';
        ge('score_val').innerHTML = score;

        cham.fadeOut(btnswitch, 10);
        cham.fadeIn(btnrestart, 10);
        switchOn = true;
    }
}


function swap() {
    if (dieing || pause) {
        return false;
    }
    cham.scale(btnCont, 0.9, 0.9, 5).onComplete = function() {
        cham.scale(btnCont, 1, 1, 5);
    }
    if (!started) {
        start();
        return false;
    }
    direction = !direction;
    ship.scale.x = -ship.scale.x;
    fireMode = 3;
    //ion.sound.play("swap");
    return false;
}

function nextLevel() {
    if (!started) {
        return false;
    }
    //started = false;
    pause = true;
    level += 1;
    score += 10;
    bulletFrac = bulletFrac * 0.9;
    bulletSpeed = bulletSpeed * 1.1;
    if (level % 10 == 0) {
        shipSpeed = shipSpeed * 1.1;
    }
    lvlText.text = 'Level '+level;
    scoreText.text = score+'';
    cham.scale(lvlText, 1.3, 1.3, 20).onComplete = function() {
        cham.scale(lvlText, 1, 1, 20);
    }


    cham.fadeIn(fade, 10).onComplete = function() {
        started = false;

        pause = false;

        cham.fadeOut(btnswitch, 10);
        cham.fadeIn(btnplay, 10);

        resetLevel();
        cham.fadeOut(fade, 40);
    }
}

function fireBullet() {
    let bullet = bulletsPull.shift();
    if (bullet) {
        bullet.alpha = 1;
        bullet.done = false;
    } else {
        bullet = new PIXI.Sprite(imgs.bullet);
        stage.addChildAt(bullet, stage.getChildIndex(tower));
    }
    bullet.anchor.set(0.5, 0.5);

    let a;
    let calcAngle = shipSpeed * 92 / bulletSpeed;
    if (fireMode == 4) {
        fireMode = 0;
        a = angle + (Math.random() * 90 - 45);
    } else if (fireMode == 3) {
        a = angle;
    } else if (fireMode == 2) {
        fireMode = 0;
        a = angle + (direction ? calcAngle : -calcAngle);
    } else {
        a = angle + (direction ? calcAngle : -calcAngle);
        a += (Math.random() * 60 - 30);
    }
    fireMode += 1;

    if (a > 360) {
        a -= 360;
    }
    bullet.deg = a;
    bullet.rotation = bullet.a = radians(a);
    bullet.dist = 0;
    bullet.width = p(4);
    bullet.height = bullet.width*3;
    bullet.x = rX(a, bullet.dist);
    bullet.y = rY(a, bullet.dist);
    bulletsArr.push(bullet);
}

function drawBullets(time) {
    for(let i in bulletsArr) {
        let bullet = bulletsArr[i];
        let a = bullet.a;
        bullet.dist += time * bulletSpeed / 1000;
        bullet.x = rX(a, bullet.dist);
        bullet.y = rY(a, bullet.dist);

        if (bullet.dist > 200) {
            bullet.alpha = 0;
            bulletsPull.push(bulletsArr.splice(i, 1)[0]);
            break;
        } else if (bullet.dist > 85 && bullet.dist < 95 && started && !pause) {
            let aDif = Math.abs(bullet.deg - angle);
            while (aDif > 360) {
                aDif -= 360;
            }
            if (aDif < 5 || aDif > 355) {
                cham.fadeOut(bullet, 10);
                bulletsPull.push(bulletsArr.splice(i, 1)[0]);
                //die(rX(a, bullet.dist+5), rY(a, bullet.dist+5));
                die();
                break;
            }
        }
    }
}

function die() {
    if (!started) {
        return false;
    }
    started = false;
    dieing = shipSpeed;
    if (!bang) {
        bang = new PIXI.Container();
        bang.x = 0;
        bang.y = 0;
        let colors = [0xCC1A1A, 0xFFE594, 0xFFC749, 0xFFFFFF, 0xA52323, 0xFB5923];

        for(let i = 0; i < 25; i++) {
            let circ = new PIXI.Graphics();
            circ.beginFill(colors[Math.floor(Math.random() * colors.length)], 1);
            circ.drawCircle(0, 0, p(5));
            circ.endFill();
            bang.addChild(circ);
            circ.alpha = 0;
            bangParts.push(circ);
        }
        stage.addChild(bang);
    }
    let size = 1.5;
    let delay = 0;
    for(let i in bangParts) {
        let part = bangParts[i];
        let bRand = p(4);
        part.scaleTo = 0.8;

        setTimeout((function(part) {return function() {
            part.alpha = 0;
            part.scale.set(0.01, 0.01);
            let anim = cham.scale(part, part.scaleTo, part.scaleTo, 20);
            let aX = rX(radians(angle), 100);
            let aY = rY(radians(angle), 100);
            part.x = aX + rand(bRand, true);
            part.y = aY + rand(bRand, true);
            cham.fadeIn(part, 20);
            cham.slide(part, aX + rand(bRand, true),  aY + rand(bRand, true), 20);
            anim.onComplete = function() {
                let aX = rX(radians(angle), 100);
                let aY = rY(radians(angle), 100);
                cham.scale(part, 0, 0, 70);
                cham.fadeOut(part, 40);
                cham.slide(part, aX + rand(bRand, true), aY + rand(bRand, true), 40);
            }
        }})(part), delay);
        delay += 30;
    }
    let oldScaleX = ship.scale.x;
    let oldScaleY = ship.scale.y;
    cham.scale(ship, -ship.scale.x*1.5, ship.scale.y*1.5, 15).onComplete = function() {
        cham.scale(ship, oldScaleX, oldScaleY, 15);
    }
    setTimeout(function() {
        cham.fadeOut(ship, 30);
    }, 800)
    setTimeout(stop, 2000);
    const addr = window.webxdc.selfAddr;
    if (score > getHighscore(addr)) {
        const name = window.webxdc.selfName;
        const info = name + " scored " + score + " in Corsairs";
        window.webxdc.sendUpdate(
            {
                payload: {
                    addr: addr,
                    name: name,
                    score: score,
                },
                info: info,
            },
            info
        );
    }
    ion.sound.play("explosion");
}

function updateTable() {
    let table_html = '';
    let table = getHighscores();
    for (let i = 0; i < table.length; i++) {
        let row = table[i];
        table_html += '<div class="row' + (row.current ? ' you' : '') + '">'
            +    '<span class="row_place">' + (i+1) + '.&nbsp;&nbsp;</span>'
            +    '<span class="row_name">'+row.name+'</span>'
            +    '<span class="row_score">' + row.score + '</span>'
            +  '</div>';
    }
    ge('scores_table').innerHTML = table_html;
}

function loadImages(files, cb) {
    let images = {};
    let done = 0;
    files.forEach((filename) => {
        let img = new Image();
        img.src = 'images/' + filename + '.svg';
        img.onload = function() {
            done += 1;
            if (done == files.length) {
                cb(images);
            }
        }
        images[filename] = img;
    });
}

function p(w) {
    return stageW*w/100;
}
function radians(degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
function degrees(radians) {
    return radians * 180 / Math.PI;
};
let a90 = radians(90);


function aX(a, pos) {
    return (pos / 100) * (radius) * Math.cos(a-a90);
}
function aY(a, pos) {
    return (pos / 100) * (radius) * Math.sin(a-a90);
}

function rX(a, pos) {
    return cX + (pos / 100) * (radius) * Math.cos(a-a90);
}
function rY(a, pos) {
    return cY + (pos / 100) * (radius) * Math.sin(a-a90);
}
function rand(num, sign) {
    if (sign) {
        return Math.floor((Math.random() * num * 2) - num);
    } else {
        return Math.floor((Math.random() * num));
    }
}

function doneCoin(coinN) {
    if (!started) return;
    let c = coins[coinN];
    if (!c || c.done) return;
    c.done = true;
    c.chams = [];

    //cham.slide(c, c.x-(c.width*3/3), c.y-(c.height*3/2), 20);
    c.chams.push(cham.fadeOut(c, 20));
    c.chams.push(cham.scale(c, c.stScale*2, c.stScale*2, 20));
    coinF = false;
    let has = false;
    for(let i in coins) {
        if (coins[i].done) continue;
        has = true;
        if (coinF === false) {
            coinF = i;
        }
        coinL = i;
    }
    if (!has) {
        nextLevel();
    } else {
        score += 1;
    }
    scoreText.text = score+'';

    ion.sound.play("coin2", {volume: 1});
}

function drawMoney() {
    for(let i = 0; i < coinsCount; i+=1) {
        let deg = parseInt(i/coinsCount*360);
        if (deg > 360) {
            deg -= 360;
        }
        let a = radians(deg);
        if (deg && deg != 360) {
            let coin = new PIXI.Sprite(imgs.coin);
            coin.anchor.set(0.5, 0.5);
            moneyCont.addChild(coin);
            coin.height = coin.width = coinSize;
            coin.stScale = coin.scale.x;
            coin.scale.set(coin.stScale * 2, coin.stScale * 2);
            coin.alpha = 0;
            coin.done = 1;
            coins[deg] = coin;
        }
    }
}

function go(ts) {
    requestAnimationFrame(go);
    cham.update();
    if (!ts) {
        return;
    }
    if (prevTs === false) {
        prevTs = ts;
        return;
    }
    let time = ts - prevTs;
    prevTs = ts;
    drawBullets(time);

    if (started || dieing > 0) {
        let add = time * shipSpeed / 1000;
        if (dieing) {
            let add = time * dieing / 1000;
            dieing -= time / 1.5;
        }
        if (direction) {
            angle += add;
            if (angle > 360) {
                angle -= 360;
            }
            let am = angle - coinF;
            if (am > -5 && am < 5) {
                doneCoin(coinF);
            }
        } else {
            angle -= add;
            if (angle < 0) {
                angle += 360;
            }
            let am = coinL - angle;
            if (am > -5 && am < 5) {
                doneCoin(coinL);
            }
        }
        if (!prevBullet || ts - prevBullet > bulletFrac) {
            prevBullet = ts;
            fireBullet();
        }
    }

    let rAngle = radians(angle);


    ship.x = rX(rAngle, 100);
    ship.y = rY(rAngle, 100);
    ship.rotation = rAngle;

    //island.rotation -= 0.001
    //tower.rotation -= 0.001
    //tower.rotation = rAngle / 2

    renderer.render(stage);
}

function ge(id) {
    return document.getElementById(id);
}

function createWave() {
    let wave = new PIXI.Graphics();
    //wave.beginFill(0xFFFFFF)
    stage.addChild(wave);
    return wave;
}

function startWave(wave, duration) {
    wave.scale.set(1, 1);
    wave.alpha = 1;
    cham.scale(wave, 1.1, 1.1, duration).onComplete = function() {
        cham.scale(wave, 1.2, 1.2, duration-1);
        cham.fadeOut(wave, duration).onComplete = function() {
            startWave(wave, duration);
        }
    }
}

function sizeStage() {
    allW = game.offsetWidth;
    allH = game.offsetHeight;
    allW = allW * scale;
    allH = allH * scale;
    if (!renderer) {
        renderer = PIXI.autoDetectRenderer(allW, allH);
    } else {
        renderer.resize(allW, allH);
    }
    let canvas = renderer.view;
    canvas.width = allW;
    canvas.height = allH;
    canvas.style.width = allW/scale + 'px';
    canvas.style.height = allH/scale + 'px';
    if (allW > allH) {
        orientation = 1;
        cX = (allW * 0.7) / 2;
        cY = allH / 2;
        if (allW * 0.7 < allH) {
            stageW = allW * 0.7;
        } else {
            stageW = allH;
        }
    } else {
        orientation = 0;
        cX = allW / 2;
        cY = (allH * 0.7) / 2;
        if (allW * 1.3 > allH) {
            stageW = allH * 0.7;
        } else {
            stageW = allW;
        }
    }
}

function posElements(first) {
    radius = p(41);

    let islandSize = p(32);
    island.x = cX;
    island.y = cY;
    island.width = islandSize;
    island.height = islandSize;

    let shipSize = p(8);
    ship.x = rX(radians(0), 100);
    ship.y = rY(radians(0), 100);
    ship.width = shipSize;
    ship.height = shipSize;

    let towerSize = p(14);
    tower.x = cX;
    tower.y = cY;
    tower.width = towerSize;
    tower.height = towerSize;


    bg.clear();
    bg.beginFill(0xFFFFFF);
    if (orientation) {
        bg.drawRect(0, 0, allW*0.3, allH);

        bg.y = 0;
        btnCont.y = cY;
        if (first) {
            bg.x = allW;
            btnCont.x = allW * 0.7 + allW * 0.3;
            cham.slide(bg, allW*0.7, 0, 20, "decelerationCubed");
            cham.slide(btnCont, allW * 0.7 + allW * 0.3/2, cY, 30, "decelerationCubed");
        } else {
            bg.x = allW * 0.7;
            btnCont.x = allW * 0.7 + allW * 0.3 / 2;
        }
    } else {
        btnCont.x = cX;
        bg.x = 0;
        if (first) {
            bg.y = allH;
            btnCont.y = allH * 0.7 + allH * 0.3;
            cham.slide(bg, 0, allH*0.7, 20, "decelerationCubed");
            cham.slide(btnCont, cX, allH * 0.7 + allH * 0.3 / 2, 30, "decelerationCubed");
        } else {
            bg.y = allH * 0.7;
            btnCont.y = allH * 0.7 + allH * 0.3 / 2;
        }
        bg.drawRect(0, 0, allW, allH * 0.3);
    }

    btnbg.height = btnbg.width = p(32);
    btnplay.height = p(12);
    btnplay.width = p(10);

    btnswitch.height = btnswitch.width = p(12);

    btnrestart.width = p(10);
    btnrestart.height = p(12);

    lvlText.x = p(5)+(lvlText.width / 2);
    lvlText.y = p(3.5)+(lvlText.height / 2);

    if (orientation) {
        scoreText.x = allW*0.7 - p(8);
    } else {
        scoreText.x = allW - p(8);
    }
    scoreText.y = p(3.5);

    scoreCoin.x = scoreText.x + p(1);
    scoreCoin.y = scoreText.y + p(0.8);
    scoreCoin.height = scoreCoin.width = p(3.2);

    wave1.x = cX;
    wave1.y = cY;
    wave1.clear();
    wave1.beginFill(0xE0FDFF);
    wave1.drawCircle(0, 0, p(25));

    /*wave2.x = cX
      wave2.y = cY
      wave2.clear()
      wave2.beginFill(0xE0FDFF)
      wave2.drawCircle(0, 0, p(25))*/

    circle.x = cX;
    circle.y = cY;

    moneyCont.x = cX;
    moneyCont.y = cY;


    circle.clear();
    circle.lineStyle(p(0.8), 0xE0FDFF, 1);
    circle.drawCircle(0, 0, radius);


    coinSize = p(4);
    for(let deg in coins) {
        let coin = coins[deg];
        let a = radians(deg);
        coin.x = coin.startX = aX(a, 100);
        coin.y = coin.startY = aY(a, 100);
        coin.height = coin.width = coinSize;
    }

    fade.clear();
    fade.beginFill(0xFFFFFF);
    if (orientation) {
        fade.drawRect(0, 0, allW*0.7, allH);
    } else {
        fade.drawRect(0, 0, allW, allH * 0.7);
    }

    let resDiv = ge('results');
    if (orientation) {
        resDiv.style.width = '70%';
        resDiv.style.height = '100%';
    } else {
        resDiv.style.width = '100%';
        resDiv.style.height = '70%';
    }
}

function onResize() {
    sizeStage();
    posElements();

}

function main() {
    game = ge('game');

    scale = window.devicePixelRatio || 1;
    sizeStage();
    /*if (scale > 2) {
      scale = 2
      }
      scale = 1*/
    let scaleForHighResDisplay = (scale > 1);
    sizeStage();
    renderer.backgroundColor = 0xD3F7FF;
    game.appendChild(renderer.view);

    stage = new PIXI.Container();
    cham = new Charm(PIXI);


    ion.sound({
        sounds: [
            {
                name: "coin2"
            },
            {
                name: "explosion"
            },
            {
                name: "swap"
            }
        ],
        path: "sounds/",
        multiplay: true,
        volume: 1,
        preload: true
    });

    loadImages(Graphics, function(loadedImgs) {
        imgs = {};
        for(let i in loadedImgs) {
            imgs[i] = new PIXI.Texture(new PIXI.BaseTexture(loadedImgs[i]));
        }


        let waveDuration = 100;
        wave1 = createWave();
        //startWave(wave1, waveDuration)

        /*wave2 = createWave()
          cham.scale(wave2, 1, 1, waveDuration).onComplete = function() {
          startWave(wave2, waveDuration)
          }*/


        island = new PIXI.Sprite(imgs.island);
        island.anchor.set(0.5, 0.5);
        stage.addChild(island);

        radius = p(41);
        circle = new PIXI.Graphics();
        stage.addChild(circle);


        coinSize = p(4);
        moneyCont = new PIXI.Container();
        stage.addChild(moneyCont);
        drawMoney();


        ship = new PIXI.Sprite(imgs.ship);
        ship.rotation = 0.04;

        ship.anchor.set(0.5, 0.5);
        stage.addChild(ship);


        tower = new PIXI.Sprite(imgs.tower);
        tower.anchor.set(0.5, 0.5);
        stage.addChild(tower);

        btnCont = new PIXI.Container();
        bg = new PIXI.Graphics();
        bg.interactive = true;
        bg.on('mousedown', swap);
        bg.on('touchstart', function() {
            ion.sound.play("coin2", {volume: 0});
            swap();
        });
        stage.addChild(bg);

        btnbg = new PIXI.Sprite(imgs.btn);
        btnplay = new PIXI.Sprite(imgs.btnplay);
        btnswitch = new PIXI.Sprite(imgs.btnswitch);
        btnrestart = new PIXI.Sprite(imgs.btnrestart);
        btnbg.anchor.set(0.5, 0.5);
        btnCont.addChild(btnbg);
        btnplay.anchor.set(0.4, 0.5);
        btnplay.alpha = 1;
        btnCont.addChild(btnplay);

        btnswitch.anchor.set(0.5, 0.5);
        btnswitch.alpha = 0;
        btnCont.addChild(btnswitch);

        btnrestart.anchor.set(0.5, 0.5);
        btnrestart.alpha = 0;
        btnCont.addChild(btnrestart);

        stage.addChild(btnCont);

        lvlText = new PIXI.Text('Level 1', {
            fontFamily : 'Charter, Baskerville, Georgia',
            fontSize: p(4),
            fontWeight: 'bold',
            fill : 0x4D4D4D
        });
        lvlText.anchor.set(0.5, 0.5);
        stage.addChild(lvlText);

        scoreText = new PIXI.Text('0', {
            fontFamily : 'Charter, Baskerville, Georgia',
            fontSize: p(4),
            fontWeight: 'bold',
            fill : 0x4D4D4D
        });
        scoreText.anchor.set(1, 0);
        stage.addChild(scoreText);

        scoreCoin = new PIXI.Sprite(imgs.coin);
        stage.addChild(scoreCoin);

        fade = new PIXI.Graphics();
        fade.alpha = 0;
        stage.addChild(fade);

        posElements(true);
        go();

        window.onresize = onResize;
    })
    renderer.render(stage);


    window.webxdc.setUpdateListener((update) => {
        const player = update.payload;
        if (player.score > getHighscore(player.addr)) {
            PLAYERS[player.addr] = { name: player.name, score: player.score };
        }
        if (update.serial === update.max_serial && !started) {
            updateTable();
        }
    }, 0);

    document.onkeydown = function(e) {
        let key = e.which || e.keyCode;
        if (key == 40 || key == 38 || key == 32) {
            swap();
        } else if (key == 37 || key == 39) {
            swap();
        }
    }
}


function getHighscores() {
    return Object.keys(PLAYERS).map((addr) => {
        return {...PLAYERS[addr], current: addr === window.webxdc.selfAddr};
    }).sort((a, b) => b.score - a.score);
}

function getHighscore(addr) {
    return PLAYERS[addr] ? PLAYERS[addr].score : 0;
}

window.onLoad = main;
if (window.loaded) {
    main();
}
