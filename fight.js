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
    attackBox: {
        offset: {
            x: 60,
            y: 50
        },
        width: 150,
        height: 50
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
    attackBox: {
        offset: {
            x: 60,
            y: 50
        },
        width: 170,
        height: 50
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
