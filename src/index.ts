const sketch = (p: p5) => {
    let shipImg: p5.Image;
    let cannonImg: p5.Image;
    let leanImg: p5.Image;

    let imgScale = 0.4;

    let gameState = 'pregame';

    let load = 0;

    p.preload = () => {
        shipImg = p.loadImage('assets/lean ship.png');
        cannonImg = p.loadImage('assets/lean cannon.png');
        leanImg = p.loadImage('assets/LEAN.png');
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.frameRate(60);

        p.angleMode(p.DEGREES);
        p.imageMode(p.CENTER);

        p.noiseDetail(3, 0.5);
    };

    let speed = 10;
    let res = 10;
    let maxHeightMult = 0.01;
    let minHeightMult = 0;

    let wheelRadius = 10;
    let wheelBase = 120;

    let xoff = 0;
    let angle = 0;

    let shot = false;
    let X = -wheelBase * 4;
    class Lean {
        x: number;
        y: number;
        angle: number;
        vel: {
            x: number;
            y: number;
            angular: number;
        };

        static drag = 0.995;
        static angularDrag = 0.999;
        static imgScale = 0.4;
        static gravity = 0.1;

        constructor(
            x: number,
            y: number,
            vx: number,
            vy: number,
            vangular: number,
            angle: number = 0
        ) {
            this.x = x;
            this.y = y;
            this.vel = {
                x: vx,
                y: vy,
                angular: vangular,
            };
            this.angle = angle;
        }

        update() {
            this.vel.y += Lean.gravity;
            this.x += this.vel.x;
            this.y += this.vel.y;
            this.angle += this.vel.angular;
            this.vel.x *= Lean.drag;
            this.vel.y *= Lean.drag;
            this.vel.angular *= Lean.angularDrag;

            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.angle);
            p.image(leanImg, 0, 0, leanImg.width * Lean.imgScale, leanImg.height * Lean.imgScale);
            p.pop();

            if (
                this.x < -leanImg.width * Lean.imgScale * 2 ||
                this.x > p.width + leanImg.width * Lean.imgScale ||
                this.y > p.height
            ) {
                this.destroy();
            }

            if (this.y > getY(this.x / res)) {
                this.destroy();
            }
        }

        destroy() {
            leans = leans.filter(l => l !== this);
        }
    }

    let leans: Lean[] = [];

    const getY = (x: number) => {
        const n = (x + xoff) / 100;

        let y = p.noise(n, n, xoff / 100);

        const maxHeight = p.height * (1 - maxHeightMult);
        const minHeight = p.height * (1 - minHeightMult);

        y = p.map(y, 0, 1, minHeight, maxHeight);

        return y;
    };

    p.draw = () => {
        p.background('#87CEEB');

        for (let i = 0; i < leans.length; i++) {
            leans[i].update();
        }

        p.noStroke();

        p.push();
        p.beginShape();
        for (let x = 0; x < p.width / res + 1; x++) {
            p.vertex(x * res, getY(x));
        }
        p.fill('#7920F4');
        p.vertex(p.width, p.height);
        p.vertex(0, p.height);
        p.endShape();
        p.pop();

        // wheel 1 (driving wheel)

        const x = X;
        const y = getY(x / res) - wheelRadius;

        // p.fill(84, 22, 117);
        // p.circle(x, y, wheelRadius * 2);

        // wheel 2 (driven wheel)

        for (let i = 270; i > 90; i -= 0.1) {
            const x2 = x - wheelBase * p.cos(i);
            const y2 = y - wheelBase * p.sin(i);

            if (y2 < getY(x2 / res) - wheelRadius) {
                let result = true;
                for (let j = 0; j < wheelBase; j += 1) {
                    const x3 = x - j * p.cos(i);
                    const y3 = y - j * p.sin(i);

                    if (y3 > getY(x3 / res)) {
                        result = false;
                        break;
                    }
                }

                if (!result) {
                    continue;
                }

                // p.circle(x2, y2, wheelRadius * 2);

                // p.stroke('green');
                // p.strokeWeight(2);

                // ship

                // get point between wheels
                const x4 = x - (wheelBase / 2) * p.cos(i);
                const y4 = y - (wheelBase / 2) * p.sin(i);

                p.push();
                p.translate(x4, y4 - 100 * imgScale);
                p.rotate(i + 180);
                p.image(
                    shipImg,
                    0,
                    -shipImg.height * 0.08,
                    shipImg.width * imgScale,
                    shipImg.height * imgScale
                );
                p.pop();

                // cannon
                p.push();
                // rotate to point at mouse
                p.translate(x4, y4 - 100 * imgScale);
                angle = p.atan2(p.mouseY - y4, p.mouseX - x4);
                p.rotate(angle);

                p.image(
                    cannonImg,
                    55 * imgScale,
                    0,
                    cannonImg.width * imgScale,
                    cannonImg.height * imgScale
                );

                p.pop();

                // shoot

                if (p.mouseIsPressed && !shot && gameState === 'play') {
                    leans.push(
                        new Lean(
                            x4 + 55 * imgScale * p.cos(angle) * 2,
                            y4 + 55 * imgScale * p.sin(angle) * 2,
                            15 * p.cos(angle),
                            15 * p.sin(angle),
                            -3 * p.cos(angle),
                            angle
                        )
                    );

                    shot = true;
                }

                // p.line(x, y, x2, y2);

                break;
            }
        }

        xoff += speed / res;

        if (!p.mouseIsPressed) {
            shot = false;
        }

        if (gameState === 'pregame') {
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(50);
            p.fill('purple');
            p.text('LEAN PIRATES', p.width / 2, p.height / 2);

            p.textSize(20);
            p.text('click to start', p.width / 2, p.height / 2 + 50);

            if (p.mouseIsPressed) {
                gameState = 'loading';
            }
        }

        if (gameState === 'loading') {
            load += 1;

            maxHeightMult = p.map(load, 0, 150, 0, 0.8);
            X = p.map(load, 0, 150, -wheelBase * 2, p.width * 0.2 - wheelBase / 2);

            if (load > 150) {
                gameState = 'play';
            }
        }
    };
};

new p5(sketch);
