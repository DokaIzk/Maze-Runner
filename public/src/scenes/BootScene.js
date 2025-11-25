import CONFIG from '../config.js';

// Boot Scene - Handles asset loading and initialization
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.loadingProgress = 0;
    }

    preload() {
        // Update loading progress
        this.load.on('progress', (progress) => {
            this.loadingProgress = progress;
            this.updateLoadingBar(progress);
        });

        this.load.on('complete', () => {
            this.updateLoadingBar(1);
            // Small delay before starting the title scene
            this.time.delayedCall(500, () => {
                this.scene.start('TitleScene');
                this.hideLoadingScreen();
            });
        });

        this.createColorTextures();
    }

    create() {}

    createColorTextures() {
        // Create cyberpunk-style pixel art textures
        const graphics = this.add.graphics();

        // === RETRO 8-BIT MOUSE SPRITE (Top-down view) - Matching reference image ===
        // Size: 12x12 pixels for crisp 8-bit look
        
        const pixelSize = 1;
        const mouseColors = {
            darkBlue: 0x2A3A4A,       // Dark blue for ears and outline
            bodyMid: 0x4A5A6A,        // Mid-tone body
            bodyMain: 0x5A6A7A,       // Main body color
            bodyLight: 0x6A7A8A,      // Light highlights
            tailPink: 0xFF8BA0,       // Pink tail
            eyeWhite: 0xFFFFFF,       // White eyes
            neonCyan: 0x00CCFF        // Neon cyan glow
        };
        
        // 0 = transparent, 1 = dark blue, 2 = body mid, 3 = body main, 
        // 4 = body light, 5 = tail pink, 6 = eye white, 7 = neon cyan
        const mousePattern = [
            [0,0,1,1,1,0,0,1,1,1,0,0],  // Row 0: Top of ears
            [0,1,1,1,1,0,0,1,1,1,1,0],  // Row 1: Ears full
            [1,1,2,2,1,1,1,1,2,2,1,1],  // Row 2: Ear bottoms + head outline
            [1,2,4,4,7,7,7,7,4,4,2,1],  // Row 3: Head with neon glow
            [1,3,7,7,7,7,7,7,7,7,3,1],  // Row 4: Body with strong glow
            [1,3,3,3,3,3,3,3,3,3,3,1],  // Row 5: Mid body
            [1,3,3,6,3,3,3,3,6,3,3,1],  // Row 6: Eyes
            [1,2,3,3,3,3,3,3,3,3,2,1],  // Row 7: Lower body with shading
            [5,1,2,2,2,3,3,2,2,2,1,0],  // Row 8: Tail starts
            [5,5,1,2,2,2,2,2,2,1,0,0],  // Row 9: Tail + bottom
            [0,5,5,1,1,2,2,1,1,0,0,0],  // Row 10: Tail curve
            [0,0,5,5,1,1,1,1,0,0,0,0]   // Row 11: Tail tip
        ];
        
        // Draw the mouse pixel by pixel
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const pixel = mousePattern[y][x];
                let color;
                
                switch(pixel) {
                    case 1: color = mouseColors.darkBlue; break;
                    case 2: color = mouseColors.bodyMid; break;
                    case 3: color = mouseColors.bodyMain; break;
                    case 4: color = mouseColors.bodyLight; break;
                    case 5: color = mouseColors.tailPink; break;
                    case 6: color = mouseColors.eyeWhite; break;
                    case 7: color = mouseColors.neonCyan; break;
                    default: continue; // Skip transparent pixels
                }
                
                graphics.fillStyle(color);
                graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
        
        graphics.generateTexture('player', 12, 12);
        graphics.clear();

        // Neon maze wall texture (cyberpunk style)
        graphics.fillStyle(0x001122); // Dark blue base
        graphics.fillRect(0, 0, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        
        // Neon blue outline
        graphics.lineStyle(2, 0x00CCFF, 1);
        graphics.strokeRect(1, 1, CONFIG.CELL_SIZE-2, CONFIG.CELL_SIZE-2);
        
        // Inner glow effect
        graphics.lineStyle(1, 0x0088CC, 0.8);
        graphics.strokeRect(2, 2, CONFIG.CELL_SIZE-4, CONFIG.CELL_SIZE-4);
        
        // Corner highlights
        graphics.fillStyle(0x00FFFF); // Bright cyan corners
        graphics.fillRect(0, 0, 2, 2); // Top-left
        graphics.fillRect(CONFIG.CELL_SIZE-2, 0, 2, 2); // Top-right
        graphics.fillRect(0, CONFIG.CELL_SIZE-2, 2, 2); // Bottom-left
        graphics.fillRect(CONFIG.CELL_SIZE-2, CONFIG.CELL_SIZE-2, 2, 2); // Bottom-right
        
        graphics.generateTexture('wall', CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        graphics.clear();

        // Dark floor path texture
        graphics.fillStyle(0x0A0A1A); // Very dark blue
        graphics.fillRect(0, 0, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        
        // Subtle grid pattern
        graphics.lineStyle(1, 0x1A1A2A, 0.3);
        graphics.strokeRect(0, 0, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        
        // Faint blue tint in center
        graphics.fillStyle(0x001133);
        graphics.fillRect(CONFIG.CELL_SIZE/4, CONFIG.CELL_SIZE/4, CONFIG.CELL_SIZE/2, CONFIG.CELL_SIZE/2);
        
        graphics.generateTexture('path', CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        graphics.clear();

        // === MAIN TOKEN (Orange) - 24x24 pixel art matching reference ===
        const canvas24 = 24;
        const stxOrange = 0xFF8533;  // Bright orange
        const stxOrangeDark = 0xCC6622; // Darker orange for shading
        const stxWhite = 0xFFFFFF;   // White logo
        
        // Create circular orange background
        graphics.fillStyle(stxOrangeDark);
        graphics.fillCircle(12, 12, 11);
        graphics.fillStyle(stxOrange);
        graphics.fillCircle(12, 12, 10);
        
        // Two horizontal bars with converging diagonals
        // 0 = transparent (shows background), 1 = white logo
        const LogoPattern = [
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // Row 0: \              /
            [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0], // Row 1:  \            /
            [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // Row 2:   \          /
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0], // Row 3:    \        /
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // Row 4:     \      /
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // Row 5:      \    /
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // Row 6:       \  /
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 7: ═══════════ TOP BAR
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 8: CLEAR GAP (nothing)
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 9: ═══════════ BOTTOM BAR
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // Row 10:      /  \
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // Row 11:     /    \
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0], // Row 12:    /      \
            [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // Row 13:   /        \
            [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0], // Row 14:  /          \
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1]  // Row 15: /            \
        ];
        
        // Draw the token logo (centered on 24x24 canvas)
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const pixel = LogoPattern[y][x];
                if (pixel === 1) {
                    graphics.fillStyle(stxWhite);
                    graphics.fillRect(x + 4, y + 4, 1, 1);
                }
            }
        }
        
        graphics.generateTexture('main-stx', canvas24, canvas24);
        graphics.clear();

        // === MINI TOKEN (Blue) - 18x18 pixel  ===
        const canvas18 = 18;
        const stxBlue = 0x5588FF;  // Bright blue
        const stxBlueDark = 0x3366CC; // Darker blue for shading
        
        // Create circular blue background
        graphics.fillStyle(stxBlueDark);
        graphics.fillCircle(9, 9, 8.5);
        graphics.fillStyle(stxBlue);
        graphics.fillCircle(9, 9, 7.5);
        
        // Smaller token logo pattern (12x12) - Same design, scaled down
        const miniLogoPattern = [
            [1,1,0,0,0,0,0,0,0,0,1,1], // Row 0: \          /
            [0,0,1,1,0,0,0,0,1,1,0,0], // Row 1:  \        /
            [0,0,0,0,1,1,1,1,0,0,0,0], // Row 2:   \      /
            [0,0,0,0,0,1,1,0,0,0,0,0], // Row 3:    \    /
            [0,0,0,0,0,1,1,0,0,0,0,0], // Row 4:     \  /
            [1,1,1,1,1,1,1,1,1,1,1,1], // Row 5: ═══════════ TOP BAR
            [0,0,0,0,0,0,0,0,0,0,0,0], // Row 6: CLEAR GAP
            [1,1,1,1,1,1,1,1,1,1,1,1], // Row 7: ═══════════ BOTTOM BAR
            [0,0,0,0,0,1,1,0,0,0,0,0], // Row 8:     /  \
            [0,0,0,0,1,1,1,1,0,0,0,0], // Row 9:    /    \
            [0,0,1,1,0,0,0,0,1,1,0,0], // Row 10:  /      \
            [1,1,0,0,0,0,0,0,0,0,1,1]  // Row 11: /        \
        ];
        
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const pixel = miniLogoPattern[y][x];
                if (pixel === 1) {
                    graphics.fillStyle(stxWhite);
                    graphics.fillRect(x + 3, y + 3, 1, 1);
                }
            }
        }
        
        graphics.generateTexture('mini-stx', canvas18, canvas18);
        graphics.clear();

        // === VILLAIN SPRITE  ===
        // Size: 12x12 pixels for crisp 8-bit look
        const villainColors = {
            darkPurple: 0x6A1B9A,    // Main body
            neonOrange: 0xFF9100,    // Glow/highlight
            neonRed: 0xFF1744,       // Tail/accent
            eyeYellow: 0xFFFF00,     // Eyes
            outline: 0x222222,       // Outline
        };
        // 0 = transparent, 1 = outline, 2 = body, 3 = highlight, 4 = tail, 5 = eyes
        const villainPattern = [
            [0,0,1,1,1,0,0,1,1,1,0,0],
            [0,1,1,1,1,0,0,1,1,1,1,0],
            [1,1,2,2,1,1,1,1,2,2,1,1],
            [1,2,3,3,5,5,5,5,3,3,2,1],
            [1,2,3,3,3,3,3,3,3,3,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,2,5,2,2,2,2,5,2,2,1],
            [1,1,2,2,2,2,2,2,2,2,1,1],
            [4,1,1,2,2,2,2,2,2,1,1,0],
            [4,4,1,1,2,2,2,2,1,1,0,0],
            [0,4,4,1,1,2,2,1,1,0,0,0],
            [0,0,4,4,1,1,1,1,0,0,0,0]
        ];
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const pixel = villainPattern[y][x];
                let color;
                switch(pixel) {
                    case 1: color = villainColors.outline; break;
                    case 2: color = villainColors.darkPurple; break;
                    case 3: color = villainColors.neonOrange; break;
                    case 4: color = villainColors.neonRed; break;
                    case 5: color = villainColors.eyeYellow; break;
                    default: continue;
                }
                graphics.fillStyle(color);
                graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
        graphics.generateTexture('villain', 12, 12);
        graphics.clear();

        // Destroy the graphics object
        graphics.destroy();
    }

    updateLoadingBar(progress) {
        const loadingBar = document.getElementById('loading-progress');
        if (loadingBar) {
            loadingBar.style.width = `${progress * 100}%`;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }
}
