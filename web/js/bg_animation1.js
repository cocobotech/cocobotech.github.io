<script>
    // --- 动态背景动画的入口函数 (相当于 js1.js 的主要功能) ---
    // 接受 canvasId 参数，实现动态绑定，避免硬编码 ID
    function startBackgroundAnimation(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found. Aborting animation initialization.`);
            return;
        }
        const ctx = canvas.getContext('2d');

        let time = 0; 
        let lines = []; 

        // 波浪线参数 (使用您提供的值)
        const numLines = 5;
        const lineHeight = 30;
        const amplitude = 90;
        const frequency = 0.01;
        const speed = 0.008;
        const lineWidthMax = 8;
        const lineWidthMin = 0.3;
        const hueShiftSpeed = 1;

        // 新增：粒子和文字参数
        const particles = [];
        let currentCocoboLetters = []; 
        const cocobo = 'COCOBO';
        const cocoboSpawnInterval = 1000; 
        let lastCocoboSpawnTime = 0;

        // 初始化波浪线
        function initLines() {
            lines = [];
            const totalHeightNeeded = numLines * lineHeight * 2;
            const startYBase = (canvas.height - totalHeightNeeded) / 2;

            for (let i = 0; i < numLines; i++) {
                lines.push({
                    startY: startYBase + (i * lineHeight * 2), 
                    colorHue: (i * (360 / numLines)) % 360, 
                    offset: i * 0.8
                });
            }
        }

        // --- 核心波浪Y轴计算函数 ---
        function getWaveY(line, x, currentTime) {
            const y = line.startY 
                + Math.sin(x * frequency * 2 + currentTime * 1.2 + line.offset) * (amplitude / 2)
                + Math.cos(x * frequency * 0.5 - currentTime * 0.8 - line.offset) * (amplitude / 2);
            return y;
        }

        // --- 粒子/点 对象 (Particle) ---
        class Particle {
            constructor(x, y, hue) {
                this.x = x;
                this.y = y;
                this.hue = hue;
                this.radius = Math.random() * 2 + 1; 
                this.alpha = 1; 
                this.speedY = Math.random() * 0.2 + 0.1; 
                this.fadeRate = Math.random() * 0.005 + 0.002; 
                this.vx = (Math.random() - 0.5) * 0.5; 
            }

            update() {
                this.y += this.speedY; 
                this.x += this.vx; 
                this.alpha -= this.fadeRate; 
            }

            draw() {
                ctx.fillStyle = `hsla(${this.hue}, 100%, 75%, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- 字母对象 (Letter) ---
        class Letter {
            constructor(x, y, hue, char) {
                this.x = x;
                this.y = y;
                this.hue = hue;
                this.char = char;
                this.alpha = 1;
                this.speedY = Math.random() * 0.1 + 0.05; 
                this.fadeRate = Math.random() * 0.002 + 0.001; 
                this.size = Math.random() * 10 + 12; 
                this.vx = (Math.random() - 0.5) * 0.3; 
            }

            update() {
                this.y += this.speedY;
                this.x += this.vx;
                this.alpha -= this.fadeRate;
            }

            draw() {
                ctx.font = `${this.size}px Inter, sans-serif`;
                ctx.fillStyle = `hsla(${this.hue}, 100%, 85%, ${this.alpha})`; 
                ctx.fillText(this.char, this.x, this.y);
            }
        }

        // --- 元素生成逻辑 ---
        function spawnParticle() {
            const lineIndex = Math.floor(Math.random() * lines.length);
            const line = lines[lineIndex];
            const x = Math.random() * canvas.width;
            const y = getWaveY(line, x, time);
            const dynamicHue = (line.colorHue + time * hueShiftSpeed) % 360;
            particles.push(new Particle(x, y, dynamicHue));
        }

        function spawnCocoboGroup() {
            currentCocoboLetters = []; 
            const lineIndex = Math.floor(Math.random() * lines.length);
            const line = lines[lineIndex];
            const startX = Math.random() * (canvas.width - cocobo.length * 25) + 10;
            const commonHue = (line.colorHue + time * hueShiftSpeed) % 360;

            for (let i = 0; i < cocobo.length; i++) {
                const char = cocobo[i];
                const x = startX + i * 25; 
                const y = getWaveY(line, x, time); 

                currentCocoboLetters.push(new Letter(x, y, commonHue, char));
            }
        }


        // --- 元素更新和绘制逻辑 ---
        function updateAndDrawElements() {
            // 1. 粒子更新和绘制
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();
                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            // 2. 字母更新和绘制
            let allCocoboLettersFaded = true; 
            if (currentCocoboLetters.length > 0) {
                // 绘制字母间的虚线连接
                ctx.beginPath();
                ctx.setLineDash([5, 5]); 
                const firstLetter = currentCocoboLetters[0];

                ctx.strokeStyle = `hsla(${firstLetter.hue}, 100%, 85%, ${firstLetter.alpha * 0.7})`;
                ctx.lineWidth = 1;
                
                for(let i = 0; i < currentCocoboLetters.length; i++) {
                    const letter = currentCocoboLetters[i];
                    // 确保使用字母的近似中心点连接
                    ctx.lineTo(letter.x + letter.size / 2, letter.y - letter.size / 2);
                }
                ctx.stroke();
                ctx.setLineDash([]); 

                for (let i = currentCocoboLetters.length - 1; i >= 0; i--) {
                    const l = currentCocoboLetters[i];
                    l.update();
                    l.draw();
                    if (l.alpha > 0) {
                        allCocoboLettersFaded = false;
                    } else {
                        currentCocoboLetters.splice(i, 1); 
                    }
                }
            } else {
                allCocoboLettersFaded = true;
            }
            
            // 3. 随机生成新的元素
            if (Math.random() < 0.1) {
                spawnParticle();
            }

            // COCOBO 字母组生成逻辑
            if (allCocoboLettersFaded && (Date.now() - lastCocoboSpawnTime > cocoboSpawnInterval)) {
                spawnCocoboGroup();
                lastCocoboSpawnTime = Date.now();
            }
        }

        // --- 主动画循环 ---
        function animateWaves() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            time += speed; 

            // --- 绘制波浪线条 ---
            lines.forEach(line => {
                ctx.beginPath();
                
                const dynamicHue = (line.colorHue + time * hueShiftSpeed) % 360; 
                const alpha = Math.abs(Math.sin(time * 1.5 + line.offset)) * 0.7 + 0.3;
                
                ctx.strokeStyle = `hsla(${dynamicHue}, 100%, 75%, ${alpha})`; 
                ctx.lineWidth = lineWidthMin + Math.abs(Math.sin(time + line.offset)) * (lineWidthMax - lineWidthMin);

                for (let x = 0; x < canvas.width; x++) {
                    const y = getWaveY(line, x, time); 
                    
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            });

            // --- 更新和绘制新增的粒子和文字 ---
            updateAndDrawElements();

            requestAnimationFrame(animateWaves);
        }

        // 统一初始化所有功能
        // 这里不需要 window.onload，因为我们将把调用逻辑放在这个函数外部的 window.onload 中
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initLines(); 
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        animateWaves(); 
    }

    // 外部调用：当整个页面加载完毕后，启动动画，并传入 Canvas 的 ID
    window.onload = function() {
        // 传递您要求的 ID: 'bg_animation'
        startBackgroundAnimation('bg_animation_wave1');
    };
</script>
