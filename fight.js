const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;
// Canvas Positionand its width and height
c.fillRect(0,0,canvas.width,canvas.height);

const gravity = 0.7;
// background creation
const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: './img/background.png'
})
// Shop Animation
const shop = new Sprite({
    position: {
        x: 600,
        y: 128
    },
    imageSrc: './img/shop.png',
    scale: 2.75,
    framesMax: 6
})

// Player Position
const player = new Fighter({
    position: {
        x: 0,
        y: 0
    }, 
    velocity: {
         x: 0,
         y: 0      
    },
    offset: {
        x: 0,
        y: 0
    },
    imageSrc: './img/samuraiMack2/samuraiMack/Idle.png',
    framesMax: 8,
    scale: 2.5,
    offset: {
        x: 215,
        y: 157
    },
    sprites: {
        idle: {
            imageSrc: './img/samuraiMack2/samuraiMack/Idle.png',
            framesMax: 8
        },
        run: {
            imageSrc: './img/samuraiMack2/samuraiMack/Run.png',
            framesMax: 8
            // image: new Image()
        },
        jump: {
            imageSrc: './img/samuraiMack2/samuraiMack/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: './img/samuraiMack2/samuraiMack/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './img/samuraiMack2/samuraiMack/Attack1.png',
            framesMax: 6
        }
    }
});

// Enemy position
const enemy = new Fighter({
    position: {
        x: 400,
        y: 100
    }, 
    velocity: {
         x: 0,
         y: 0      
    },
    color: 'blue',
    offset: {
        x: -50,
        y: 0
    },
    imageSrc: './img/kenji2/kenji/Idle.png',
    framesMax: 4,
    scale: 2.5,
    offset: {
        x: 215,
        y: 167
    },
    sprites: {
        idle: {
            imageSrc: './img/kenji2/kenji/Idle.png',
            framesMax: 4
        },
        run: {
            imageSrc: './img/kenji2/kenji/Run.png',
            framesMax: 8
            // image: new Image()
        },
        jump: {
            imageSrc: './img/kenji2/kenji/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: './img/kenji2/kenji/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './img/kenji2/kenji/Attack1.png',
            framesMax: 4
        }
    }
});

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}

decreaseTimer();

// Animate infinite
function animate(){
    window.requestAnimationFrame(animate);
    // console.log('google');
    c.fillStyle = 'black';
    c.fillRect(0,0, canvas.width, canvas.height);
    background.update()
    shop.update()
    player.update();
    enemy.update();

    player.velocity.x = 0;
    enemy.velocity.x = 0;

    // Player Movement
    
    if(keys.a.pressed && player.lastKey === 'a'){
        player.velocity.x = -5
        player.switchSprite('run')
    } else if(keys.d.pressed && player.lastKey === 'd'){
        player.velocity.x = 5
        player.switchSprite('run')
    } else {
        player.switchSprite('idle')
    }

    // Jump Player Animation
    if(player.velocity.y < 0){
        player.switchSprite('jump') 
    } else if(player.velocity.y > 0){
       player.switchSprite('fall')  
    }
    
     // Enemy Movement
    if(keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft'){
        enemy.velocity.x = -5
        enemy.switchSprite('run')
    } else if(keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight'){
        enemy.velocity.x = 5
        enemy.switchSprite('run')
    } else {
        enemy.switchSprite('idle')
    }

    // Jump Enemy Animation
    if(enemy.velocity.y < 0){
        enemy.switchSprite('jump') 
    } else if(enemy.velocity.y > 0){
       enemy.switchSprite('fall')  
    }

    // detect for Collision of player
    if( rectangularCollision({
        rectangle1: player,
        rectangle2: enemy
    }) && 
        player.isAttacking
    ){
        player.isAttacking = false
        // console.log('player Attack');
        enemy.health -= 20
        document.querySelector('#enemyHealth').style.width = enemy.health + '%';
    }

    // detect for Collision of enemy
    if( rectangularCollision({
        rectangle1: enemy,
        rectangle2: player
    }) && 
        enemy.isAttacking
    ){
        enemy.isAttacking = false
        // console.log('enemy Attack');
        player.health -= 20
        document.querySelector('#playerHealth').style.width = player.health + '%';
    }

    // End game Based on Player Health
    if(player.health <= 0 || enemy.health <= 0){
       determineWinner({ player, enemy, timerId});
    }
}

animate();

window.addEventListener('keydown',(event) => {
    switch(event.key){
        case 'd':
            keys.d.pressed = true
            player.lastKey = 'd'
            break;
        case 'a':
            keys.a.pressed = true
            player.lastKey = 'a'
            break;
        case 'w':
            player.velocity.y = -20
            break;
        case ' ':
            player.attack()
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = true
            enemy.lastKey = 'ArrowRight';
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true
            enemy.lastKey = 'ArrowLeft';
            break;
        case 'ArrowUp':
            enemy.velocity.y = -20
            break;
        case 'ArrowDown':
            enemy.attack()
            break;
    }
    // console.log(event.key);
});
window.addEventListener('keyup',(event) => {
    switch(event.key){
        case 'd':
            keys.d.pressed = false
            break;
        case 'a':
            keys.a.pressed = false
            break;
    }
    // Enemy keys
     switch(event.key){
        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break;
    }
    // console.log(event.key);
});