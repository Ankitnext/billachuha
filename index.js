 window.onload = function() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var x = 250;
    var y = 150;
    var coinx = Math.random() * (600-50);
	var coiny = Math.random() * (400-50);
    let coinVisible = true;
    let coinTimer = null;
    
    var t = Date.now();
    let speed = 300;
    let dir = 0;
    let score = 0;

    let up = document.getElementById('up');
    let down = document.getElementById('down');
    let left = document.getElementById('left');
    let right = document.getElementById('right');

    up.onmousedown = function() { dir = 4;}
    down.onmousedown = function() { dir = 3;}
    left.onmousedown = function() { dir = 2;}
    right.onmousedown = function() { dir = 1;}

    up.ontouchstart = function() { dir = 4;}
    down.ontouchstart = function() { dir = 3;}
    left.ontouchstart = function() { dir = 2;}
    right.ontouchstart = function() { dir = 1;}

    up.onmouseup = function() { dir = 0;}
    down.onmouseup = function() { dir = 0;}
    left.onmouseup = function() { dir = 0;}
    right.onmouseup = function() { dir = 0;}

    up.ontouchend = function() { dir = 0;}
    down.ontouchend = function() { dir = 0;}
    left.ontouchend = function() { dir = 0;}
    right.ontouchend = function() { dir = 0;}

    document.addEventListener("keydown", function(event) {
        switch(event.key) {
            case "ArrowRight":
                dir = 1;
                break;
            case "ArrowLeft":
                dir = 2;
                break;
            case "ArrowDown":
                dir = 3;
                break;
            case "ArrowUp":
                dir = 4;
                break;
        }
    });

    document.addEventListener("keyup", function(event) {
        if (
            event.key === "ArrowRight" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowDown" ||
            event.key === "ArrowUp"
        ) {
            dir = 0;
        }
    });


    const playerImg = new Image();
    const coinImg = new Image();

    playerImg.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2oP3lWLmezhBAmuHvAwuaqRv6xVX0eApt7A&s'; // replace with your actual file path
    coinImg.src = 'https://www.partysuppliesindia.com/cdn/shop/products/1_36_9f92dde3-d77d-4459-a21f-63744a94c836.jpg?v=1735574298&width=1500';

    const bgMusic = new Audio('background.mp3');
    const coinSound = new Audio('foodeat.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.2;

    bgMusic.play().catch(() => {
        document.body.addEventListener('click', () => bgMusic.play(), { once: true });
    });

    function draw() {
        var timePassed = (Date.now() - t) / 1000;
        t = Date.now();

        context.clearRect(0, 0, 600, 400);
        
        context.font = '25px Arial';
        context.fillStyle = 'black';
        context.fillText("Score: " + score, 20, 30);

        // context.beginPath();
        // context.rect(x, y, 100, 100);
        // context.fillStyle="red";
        // context.fill();

        // context.beginPath();
        // context.rect(coinx, coiny, 50, 50);
        // context.fillStyle="#e3c228";
        // context.fill();
        context.drawImage(playerImg, x, y, 100, 100);
        context.drawImage(coinImg, coinx, coiny, 70, 70); 

        if(dir == 1) { 
            if(x+100 < 600) {
                x += (speed * timePassed);
            }
        }
        else if(dir == 2) { 
            if(x > 0) {
                x -= (speed * timePassed);
            }
        }
        else if(dir == 3) { 
            if(y+100 < 400) {
                y += (speed * timePassed);
            }
        }
        else if(dir == 4) { 
            if(y > 0) {
                y -= (speed * timePassed);
            }
        }

        if (coinx <= x+100 && x <= coinx+70 && coiny <= y+100 && y <= coiny+70) {
            score++;
            coinSound.currentTime = 0;
            // music start to play
            coinSound.play();
             // Coin Music for 3 second
             setTimeout(() => {
                coinSound.pause();
                coinSound.currentTime = 0;
            }, 3000);

            coinx = Math.random() * (600 - 70);
            coiny = Math.random() * (400 - 70);
        }

        window.requestAnimationFrame(draw);
    }
    playerImg.onload = coinImg.onload = () => {
                draw();
            };
}