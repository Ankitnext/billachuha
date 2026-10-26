// Player Creation
class Sprite{
    constructor({
        position, 
        imageSrc, 
        scale = 1, 
        framesMax = 1, 
        offset = { x: 0, y: 0}
    }){
        this.position = position;
        this.width = 50
        this.height = 150;
        this.image = new Image()
        this.image.src = imageSrc
        this.scale = scale
        this.framesMax = framesMax
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 7
        this.offset = offset
    }

    draw(){
        if (!this.image.complete || !this.image.naturalWidth) return;
        c.save();
        if (this.facing === -1) { c.translate(this.position.x * 2 + this.width, 0); c.scale(-1, 1); }
        c.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x - this.offset.x, 
            this.position.y - this.offset.y, 
            (this.image.width / this.framesMax ) * this.scale, 
            this.image.height * this.scale
        )
        c.restore();
     }

     animateFrames(){
        this.framesElapsed++;
        
        if(this.framesElapsed % this.framesHold === 0){
            if(this.framesCurrent < this.framesMax - 1){
                this.framesCurrent++;
            }  else {
                this.framesCurrent = 0;
            }
        }
     }
    // Update position of player
    update(){
        this.draw();
        this.animateFrames()
    }
}
// Fighter Creation
class Fighter extends Sprite {
    constructor({
        position, 
        velocity, 
        color = 'red', 
        imageSrc, 
        scale = 1, 
        framesMax = 1,
        offset = { x: 0, y: 0},
        sprites,
        attackBox = {
            offset: { x: 0, y: 0 },
            width: 120,
            height: 50
        }
    }){
        super({
            position,
            imageSrc,
            scale,
            framesMax,
            offset
        })
        this.velocity = velocity;
        this.width = 50
        this.height = 150;
        this.lastKey
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset: attackBox.offset,
            width: attackBox.width,
            height: attackBox.height
        }
        this.color = color
        this.isAttacking = false
        this.health = 100
        this.facing = 1;
        this.nextAttackAt = 0;
        this.attackUntil = 0;
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 7
        this.sprites = sprites

        for(const sprite in this.sprites){
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imageSrc
        }
    }

   
    // Update position of player
    update(render = true){
        if (render) this.draw();
        this.animateFrames()

        this.position.x += this.velocity.x;
        this.position.x = Math.max(0, Math.min(canvas.width - this.width, this.position.x));
        this.position.y += this.velocity.y;
        this.attackBox.position.x = this.facing === -1
            ? this.position.x + this.width - this.attackBox.offset.x - this.attackBox.width
            : this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
        if (performance.now() >= this.attackUntil) this.isAttacking = false;

        // gravity Function
        if(this.position.y + this.height + this.velocity.y >= canvas.height - 96){
            this.velocity.y = 0;
            this.position.y = 330;
        } else {
            this.velocity.y += gravity;
        }
    }

    attack(now = performance.now()){
        if (this.health <= 0 || now < this.nextAttackAt) return false;
        this.nextAttackAt = now + 650;
        this.attackUntil = now + 220;
        this.switchSprite('attack1')
        this.isAttacking = true;
        return true;
     }
     

     switchSprite(sprite){
        if(this.image === this.sprites.attack1.image && 
            this.framesCurrent < this.sprites.attack1.framesMax - 1
        ) 
        return
        
         switch (sprite){
            case 'idle':
                if(this.image !== this.sprites.idle.image ){
                    this.image = this.sprites.idle.image
                    this.framesMax = this.sprites.idle.framesMax
                    this.framesCurrent = 0
                }
                break;
            case 'run':
                if(this.image !== this.sprites.run.image){
                    this.image = this.sprites.run.image
                    this.framesMax = this.sprites.run.framesMax
                    this.framesCurrent = 0
                }
                break;
            case 'jump':
                if(this.image !== this.sprites.jump.image){
                    this.image = this.sprites.jump.image
                    this.framesMax = this.sprites.jump.framesMax
                    this.framesCurrent = 0
                }
                break;
            case 'fall':
                if(this.image !== this.sprites.fall.image){
                    this.image = this.sprites.fall.image
                    this.framesMax = this.sprites.fall.framesMax
                    this.framesCurrent = 0
                }
                break;  
            case 'attack1':
                if(this.image !== this.sprites.attack1.image){
                    this.image = this.sprites.attack1.image
                    this.framesMax = this.sprites.attack1.framesMax
                    this.framesCurrent = 0
                }
                break;      
         }
     }
}
