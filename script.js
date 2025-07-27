const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
// console.log(ctx);
const CANVAS_WIDTH = canvas.width = 600;
const CANVAS_HEIGHT = canvas.height = 600;

// Image Upload
const playerImage = new Image();
playerImage.src = 'image/player1.png';
const spriteWidth = 800;
const spriteHeight = 800;

// Animation loop
let x = 0;
function animate(){
    ctx.clearRect(0 , 0 , CANVAS_WIDTH, CANVAS_HEIGHT);
    // ctx.fillRect(50 , 50 , 100, 100);
    // ctx.drawImage(playerImage,sx,sy,sw,sh,dx,dy,dw,dh);
    ctx.drawImage(playerImage,0,0,spriteWidth,spriteHeight,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    // if (playerImage.complete) { // Check if image is loaded
    //     ctx.drawImage(playerImage, 0, 0);
    // }
    requestAnimationFrame(animate);
};
animate();
// playerImage.onload = function() {
//     animate();
// };