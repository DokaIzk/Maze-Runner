import * as API from "../linera/API";
import CONFIG from '../config.js';
import MazeGenerator from "../utils/mazeGenerator.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.gameState = {
            score: 0,
            level: 1,
            timeLeft: CONFIG.BASE_TIME,
            isGameOver: false,
            isPaused: false
        };
        this.player = null;
        this.opponent = null;
        this.mainTKN = null;
        this.miniTKN = [];
        this.walls = null;
        this.maze = null;
        this.collisionGrid = null;
        this.cursors = null;
        this.wasd = null;
        this.gameTimer = null;
        this.userMazeConfig = null;
        this.levelCompletions = [];
        this.opponentTKCount = 0;
    }
    
    create(data) {
        this.cameras.main.setBackgroundColor('#000000');
    
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'flex';
            uiOverlay.style.visibility = 'visible';
            uiOverlay.style.opacity = '1';
            uiOverlay.style.pointerEvents = 'none';

            const walletAddressSpan = document.getElementById('wallet-address');
            let walletAddress = window.dynamicWalletAddress;
            if (walletAddress) {
                const shortAddr = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
                walletAddressSpan.textContent = shortAddr;
            } else {
                walletAddressSpan.textContent = '';
            }
        }
        
        // Reset game state values
        this.gameState = {
            score: 0,
            level: 1,
            timeLeft: CONFIG.BASE_TIME,
            isGameOver: false,
            isPaused: false
        };
    
        this.opponentTKCount = 0;
        if (data && data.userMazeConfig) {
            this.userMazeConfig = data.userMazeConfig;
            this.adjustGameDifficulty();
        }
        
        // Ensure canvas has keyboard focus
        this.game.canvas.setAttribute('tabindex', '1');
        this.game.canvas.focus();

        this.setupInput();
        this.generateNewLevel();
        this.startTimer();
        this.updateUI();
        this.setupPause();

        // After creating player and opponent icons, add labels
        this.events.once('postcreate', () => {
            if (this.player) {
                let youLabel = document.getElementById('player-you-label');
                if (!youLabel) {
                    youLabel = document.createElement('div');
                    youLabel.id = 'player-you-label';
                    youLabel.textContent = 'YOU';
                    youLabel.style.cssText = `
                        position: absolute;
                        left: ${this.player.x - 30}px;
                        top: ${this.player.y + 40}px;
                        color: #2986f5;
                        font-weight: bold;
                        font-size: 1.1em;
                        font-family: Arial, sans-serif;
                        text-shadow: 1px 1px 2px #000;
                        pointer-events: none;
                    `;
                    document.body.appendChild(youLabel);
                }
            }
            // Add 'OPPONENT' label under opponent
            if (this.opponent) {
                let oppLabel = document.getElementById('opponent-label');
                if (!oppLabel) {
                    oppLabel = document.createElement('div');
                    oppLabel.id = 'opponent-label';
                    oppLabel.textContent = 'OPPONENT';
                    oppLabel.style.cssText = `
                        position: absolute;
                        left: ${this.opponent.x - 50}px;
                        top: ${this.opponent.y + 40}px;
                        color: #a259f7;
                        font-weight: bold;
                        font-size: 1.1em;
                        font-family: Arial, sans-serif;
                        text-shadow: 1px 1px 2px #000;
                        pointer-events: none;
                    `;
                    document.body.appendChild(oppLabel);
                }
            }
        });
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // WASD keys
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Mobile touch controls
        this.setupMobileControls();
        
        // Pause key - use global keyboard event to work even when scene is paused
        window.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            }
            // Jump to level 10 with "0" key (cheat/testing feature)
            if (event.key === '0' && !this.gameState.isGameOver) {
                this.jumpToLevel(10);
            }
        });
    }

    setupMobileControls() {
        // Touch/swipe gesture detection
        let startX, startY, startTime;
        let isPointerDown = false;
        let lastMoveX = 0, lastMoveY = 0;
        const minSwipeDistance = 50;
        const maxTapTime = 200; // milliseconds
        
        window.addEventListener('touchmove', (e) => { 
            e.preventDefault();
            const X = e.touches[0].clientX;
            const Y = e.touches[0].clientY;
         }, { passive: false });

        this.input.on('pointerdown', (pointer) => {
            if (this.gameState.isGameOver || this.gameState.isPaused) return;
            
            startX = pointer.x;
            startY = pointer.y;
            startTime = this.time.now;
            isPointerDown = true;
            lastMoveX = 0;
            lastMoveY = 0;
        });
        
        this.input.on('pointermove', (pointer) => {
            // Mobile drag movement with collision detection - continuous smooth movement
            if (isPointerDown && startX && startY && this.player && !this.gameState.isGameOver && !this.gameState.isPaused) {
                const deltaX = pointer.x - startX;
                const deltaY = pointer.y - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Only move if dragged significant distance
                if (distance > 20 && distance < minSwipeDistance) {
                    const angle = Math.atan2(deltaY, deltaX);
                    const speed = CONFIG.PLAYER_SPEED / 120;
                    const moveX = Math.cos(angle) * speed;
                    const moveY = Math.sin(angle) * speed;
                    const mazeRelativeX = this.player.x - this.mazeOffsetX;
                    const mazeRelativeY = this.player.y - this.mazeOffsetY;
                    
                    const newPosition = CollisionSystem.getValidMovePosition(
                        mazeRelativeX, mazeRelativeY,
                        moveX, moveY,
                        this.getScaledPlayerSize(), this.getScaledPlayerSize(),
                        this.collisionGrid, this.levelCellSize || CONFIG.CELL_SIZE,
                        this.maze.grid
                    );
                    
                    // Update if position actually changed (collision allowed it)
                    const worldX = newPosition.x + this.mazeOffsetX;
                    const worldY = newPosition.y + this.mazeOffsetY;
                    
                    if (worldX !== this.player.x || worldY !== this.player.y) {
                        this.player.setPosition(worldX, worldY);
                        lastMoveX = moveX;
                        lastMoveY = moveY;
                    }
                }
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (!startX || !startY) return;
            isPointerDown = false;
            
            const deltaX = pointer.x - startX;
            const deltaY = pointer.y - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const timeDiff = this.time.now - startTime;
            
            // Check for tap (short touch without movement)
            if (distance < 20 && timeDiff < maxTapTime) {
                this.togglePause();
                startX = startY = startTime = null;
                return;
            }
            
            if (distance < minSwipeDistance) {
                // Reset variables for short movements
                startX = startY = startTime = null;
                return;
            }
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.movePlayer('right');
                } else {
                    this.movePlayer('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.movePlayer('down');
                } else {
                    this.movePlayer('up');
                }
            }
            
            startX = startY = startTime = null;
        });
    }

    movePlayer(direction) {
        if (!this.player || this.gameState.isGameOver || this.gameState.isPaused) return;
        
        const moveDistance = this.levelCellSize || CONFIG.CELL_SIZE; // Move one cell at a time on mobile
        let deltaX = 0, deltaY = 0;
        
        switch(direction) {
            case 'up': deltaY = -moveDistance; break;
            case 'down': deltaY = moveDistance; break;
            case 'left': deltaX = -moveDistance; break;
            case 'right': deltaX = moveDistance; break;
        }
        
        const mazeRelativeX = this.player.x - this.mazeOffsetX;
        const mazeRelativeY = this.player.y - this.mazeOffsetY;
        
        const newPosition = CollisionSystem.getValidMovePosition(
            mazeRelativeX, mazeRelativeY,
            deltaX, deltaY,
            this.getScaledPlayerSize(), this.getScaledPlayerSize(),
            this.collisionGrid, this.levelCellSize || CONFIG.CELL_SIZE,
        );
        
        // Smooth animation to new position
        this.tweens.add({
            targets: this.player,
            x: newPosition.x + this.mazeOffsetX,
            y: newPosition.y + this.mazeOffsetY,
            duration: 750,
            ease: 'Power2'
        });
    }

    generateNewLevel() {
        // Clear existing objects
        this.clearLevel();
        
        // Calculate maze dimensions based on level (progressive scaling)
        const mazeConfig = this.getMazeConfigForLevel(this.gameState.level);
        
        // Generate maze with level-appropriate complexity
        this.maze = new MazeGenerator(
            mazeConfig.width, 
            mazeConfig.height, 
            mazeConfig.removeWallsRatio  // Pass complexity parameter
        );
        this.maze.generate();
        this.collisionGrid = this.maze.toCollisionGrid();
        
        // Calculate dynamic cell size with mobile optimization
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
    
        // Responsive sizing - works for any screen size
        const uiSpaceTop = 45; // Fixed top margin for UI area
        const horizontalPadding = 10; // 10px padding on left/right
        const verticalMargin = 45; // 45px gap above maze
        
        // Calculate available space based on actual screen/canvas size
        const screenWidth = isMobile ? window.innerWidth : CONFIG.CANVAS_WIDTH;
        const screenHeight = isMobile ? window.innerHeight : CONFIG.CANVAS_HEIGHT;
        
        const availableWidth = screenWidth - (horizontalPadding * 2);
        const availableHeight = screenHeight - uiSpaceTop - verticalMargin;
        
        // Calculate dynamic cell size that fits both width and height
        let dynamicCellSize;
        let mazePixelWidth;
        let mazePixelHeight;
        
        // Calculate cell sizes for both dimensions
        const cellSizeForWidth = Math.floor(availableWidth / mazeConfig.width);
        const cellSizeForHeight = Math.floor(availableHeight / mazeConfig.height);
        
        // Use the smaller one to ensure maze fits in both dimensions
        dynamicCellSize = Math.min(cellSizeForWidth, cellSizeForHeight);
        dynamicCellSize = Math.max(4, dynamicCellSize); // Minimum 4px per cell
        
        // Calculate final maze dimensions
        mazePixelWidth = mazeConfig.width * dynamicCellSize;
        mazePixelHeight = mazeConfig.height * dynamicCellSize;
        
        // Position maze - centered horizontally with padding, positioned below UI
        this.mazeOffsetX = horizontalPadding + (availableWidth - mazePixelWidth) / 2;
        this.mazeOffsetY = uiSpaceTop + verticalMargin;
        
        // Store the dynamic cell size for this level (temporary solution)
        this.levelCellSize = dynamicCellSize;
        
        
        // Create visual representation
        this.createMazeVisuals();
        
        // Place player at start
        this.createPlayer();
        
        // Place opponent at start
        this.createOpponent();
        
        // Place main token
        this.createmainTKN();
        
        // Place mini tokens
        this.createminiTKN();
        
        // Update timer for level
        this.updateLevelTimer();
    }

    getMazeConfigForLevel(level) {
        // Progressive difficulty scaling from level 1 to 10
        // Level 1: Simple maze with fewer walls (easier)
        // Level 10: Complex maze with more walls (harder)
        
        const minSize = 20;  // Starting maze size
        const maxSize = 40;  // Maximum maze size
        
        // Calculate maze dimensions (linear progression)
        const sizeRange = maxSize - minSize;
        const sizeProgress = Math.min((level - 1) / 9, 1); // 0 to 1 over 10 levels
        const mazeSize = Math.floor(minSize + (sizeRange * sizeProgress));
        
        // Complexity settings - INVERTED: Level 1 has MORE walls removed (easier), Level 10 has NONE removed (hardest)
        const complexityLevels = [
            { level: 1, name: 'Very Easy', removeWalls: 0.65 },      // 65% walls removed = very open, very easy
            { level: 2, name: 'Very Easy', removeWalls: 0.58 },      // 58% walls removed = still very open
            { level: 3, name: 'Easy', removeWalls: 0.50 },           // 50% walls removed = easy
            { level: 4, name: 'Easy', removeWalls: 0.42 },           // 42% walls removed = still easy
            { level: 5, name: 'Medium', removeWalls: 0.35 },         // 35% walls removed = getting harder
            { level: 6, name: 'Medium', removeWalls: 0.28 },         // 28% walls removed = moderate
            { level: 7, name: 'Hard', removeWalls: 0.15 },           // 15% walls removed = challenging
            { level: 8, name: 'Very Hard', removeWalls: 0.08 },      // 8% walls removed = very hard
            { level: 9, name: 'Extreme', removeWalls: 0.04 },        // 4% walls removed = extreme
            { level: 10, name: 'Nightmare', removeWalls: 0.02 }       // 2% walls removed = maximum walls but passable
        ];
        
        const complexityIndex = Math.min(level - 1, complexityLevels.length - 1);
        const complexity = complexityLevels[complexityIndex];
        
        return {
            width: mazeSize,
            height: mazeSize,
            complexity: complexity.name,
            removeWallsRatio: complexity.removeWalls
        };
    }

    clearLevel() {
        // Remove existing game objects
        if (this.mazeGraphics) {
            this.mazeGraphics.destroy();
        }
        if (this.player) {
            this.player.destroy();
        }
        if (this.opponent) {
            this.opponent.destroy();
        }
        if (this.mainTKN) {
            this.mainTKN.destroy();
        }
        this.miniTKN.forEach(miniSTX => miniSTX.destroy());
        this.miniTKN = [];
    }

    createMazeVisuals() {        
        // Create graphics object for drawing lines
        this.mazeGraphics = this.add.graphics();
        this.mazeGraphics.setDepth(1);
        
        // Set line style - thicker lines on mobile for better visibility
        const isMobile = window.innerWidth <= 768;
        const lineWidth = isMobile ? 3 : 2;
        this.mazeGraphics.lineStyle(lineWidth, 0xD40F02, 1.0);
        
        // Draw maze walls as lines instead of filled cells
        if (!this.maze || !this.maze.grid) {
            console.error('Maze or maze grid is not available!');
            return;
        }
        
        if (!this.levelCellSize) {
            console.error('levelCellSize is not set!');
            return;
        }
        
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const cell = this.maze.grid[y][x];
                if (!cell) {
                    console.error('Cell is undefined at', x, y);
                    continue;
                }
                
                const worldX = x * this.levelCellSize + this.mazeOffsetX;
                const worldY = y * this.levelCellSize + this.mazeOffsetY;
                
                // Draw walls as lines around each cell
                if (cell.walls && cell.walls.top) {
                    this.mazeGraphics.moveTo(worldX, worldY);
                    this.mazeGraphics.lineTo(worldX + this.levelCellSize, worldY);
                }
                
                if (cell.walls && cell.walls.right) {
                    this.mazeGraphics.moveTo(worldX + this.levelCellSize, worldY);
                    this.mazeGraphics.lineTo(worldX + this.levelCellSize, worldY + this.levelCellSize);
                }
                
                if (cell.walls && cell.walls.bottom) {
                    this.mazeGraphics.moveTo(worldX + this.levelCellSize, worldY + this.levelCellSize);
                    this.mazeGraphics.lineTo(worldX, worldY + this.levelCellSize);
                }
                
                if (cell.walls && cell.walls.left) {
                    this.mazeGraphics.moveTo(worldX, worldY + this.levelCellSize);
                    this.mazeGraphics.lineTo(worldX, worldY);
                }
            }
        }
        
        // Stroke all the lines at once
        this.mazeGraphics.strokePath();
        
        // Add purple glow effect to the entire maze
        this.tweens.add({
            targets: this.mazeGraphics,
            alpha: { from: 0.7, to: 1.0 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    hasAdjacentWall(x, y) {
        // Check if there's a wall adjacent to this position
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // left, right, up, down
        ];
        
        for (let [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;
            
            if (checkX >= 0 && checkX < this.collisionGrid[0].length &&
                checkY >= 0 && checkY < this.collisionGrid.length &&
                this.collisionGrid[checkY][checkX] === 1) {
                return true;
            }
        }
        return false;
    }

    createPlayer() {
        // Find a valid starting position (preferably top-left area)
        let startPos;
        let attempts = 0;
        
        // Try to find a position in the top-left quadrant first
        do {
            startPos = this.maze.getRandomEmptyPosition(this.collisionGrid);
            attempts++;
        } while (attempts < 10 && (startPos.x > this.collisionGrid[0].length / 2 || startPos.y > this.collisionGrid.length / 2));
        
        // If we couldn't find a good starting position, use any valid position
        if (attempts >= 10) {
            startPos = this.maze.getRandomEmptyPosition(this.collisionGrid);
        }
        
        const worldPos = CollisionSystem.getWorldPosition(startPos.x, startPos.y, this.levelCellSize || CONFIG.CELL_SIZE);
        
        // Apply maze offset for centering
        const centeredX = worldPos.x + this.mazeOffsetX;
        const centeredY = worldPos.y + this.mazeOffsetY;
        
        this.player = this.add.image(centeredX, centeredY, 'player');
        this.player.setDisplaySize(this.getScaledPlayerSize(), this.getScaledPlayerSize());
        this.player.setDepth(10); // Ensure player is above maze tiles
        
        // Add subtle glow effect to the mouse
        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.9, to: 1.0 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createOpponent() {
        // Find a valid starting position (preferably bottom-right area)
        let startPos;
        let attempts = 0;
        do {
            startPos = this.maze.getRandomEmptyPosition(this.collisionGrid);
            attempts++;
        } while (attempts < 10 && (startPos.x < this.collisionGrid[0].length / 2 || startPos.y < this.collisionGrid.length / 2));
        if (attempts >= 10) {
            startPos = this.maze.getRandomEmptyPosition(this.collisionGrid);
        }
        const worldPos = CollisionSystem.getWorldPosition(startPos.x, startPos.y, this.levelCellSize || CONFIG.CELL_SIZE);
        const centeredX = worldPos.x + this.mazeOffsetX;
        const centeredY = worldPos.y + this.mazeOffsetY;
        this.opponent = this.add.image(centeredX, centeredY, 'villain');
        this.opponent.setDisplaySize(this.getScaledPlayerSize(), this.getScaledPlayerSize());
        this.opponent.setDepth(9); // Just below player
        // Add glow effect to villain
        this.tweens.add({
            targets: this.opponent,
            alpha: { from: 0.8, to: 1.0 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createmainTKN() {
        // Place main STX token at a random empty position
        let attempts = 0;
        let position;
        
        do {
            position = this.maze.getRandomEmptyPosition(this.collisionGrid);
            attempts++;
        } while (attempts < 50 && this.isPositionTooCloseToPlayer(position));
        
        const worldPos = CollisionSystem.getWorldPosition(position.x, position.y, this.levelCellSize || CONFIG.CELL_SIZE);
        
        // Apply maze offset for centering
        const centeredX = worldPos.x + this.mazeOffsetX;
        const centeredY = worldPos.y + this.mazeOffsetY;
      
        this.mainTKN = this.add.image(centeredX, centeredY, 'main-stx');
        this.mainTKN.setDisplaySize(this.getScaledmainTKNSize(), this.getScaledmainTKNSize());
        this.mainTKN.setDepth(5); // Above maze, below player
        
        // Add pulsing animation
        this.tweens.add({
            targets: this.mainTKN,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createminiTKN() {
        const numminiTKN = Math.max(1, 4 - this.gameState.level);
        
        for (let i = 0; i < numminiTKN; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = this.maze.getRandomEmptyPosition(this.collisionGrid);
                attempts++;
            } while (attempts < 20 && (
                this.isPositionTooCloseToPlayer(position) ||
                this.isPositionTooCloseTomainTKN(position) ||
                this.isPositionTooCloseToOtherminiTKN(position)
            ));
            
            const worldPos = CollisionSystem.getWorldPosition(position.x, position.y, this.levelCellSize || CONFIG.CELL_SIZE);
            
            // Apply maze offset for centering
            const centeredX = worldPos.x + this.mazeOffsetX;
            const centeredY = worldPos.y + this.mazeOffsetY;
            
            const miniSTX = this.add.image(centeredX, centeredY, 'mini-stx');
            miniSTX.setDisplaySize(this.getScaledminiTKNize(), this.getScaledminiTKNize());
            miniSTX.setDepth(5); // Above maze, below player
            
            // Add floating animation
            this.tweens.add({
                targets: miniSTX,
                y: centeredY - 5,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            this.miniTKN.push(miniSTX);
        }
    }

    isPositionTooCloseToPlayer(position) {
        if (!this.player) return false;
        
        // Convert world position to maze-relative position
        const playerMazeX = this.player.x - this.mazeOffsetX;
        const playerMazeY = this.player.y - this.mazeOffsetY;
        const playerGrid = CollisionSystem.getGridPosition(playerMazeX, playerMazeY, this.levelCellSize || CONFIG.CELL_SIZE);
        const distance = Math.abs(position.x - playerGrid.x) + Math.abs(position.y - playerGrid.y);
        
        return distance < 5; // Manhattan distance
    }

    isPositionTooCloseTomainTKN(position) {
        if (!this.mainTKN) return false;
        
        // Convert world position to maze-relative position
        const stxMazeX = this.mainTKN.x - this.mazeOffsetX;
        const stxMazeY = this.mainTKN.y - this.mazeOffsetY;
        const stxGrid = CollisionSystem.getGridPosition(stxMazeX, stxMazeY, this.levelCellSize || CONFIG.CELL_SIZE);
        const distance = Math.abs(position.x - stxGrid.x) + Math.abs(position.y - stxGrid.y);
        
        return distance < 3;
    }

    isPositionTooCloseToOtherminiTKN(position) {
        return this.miniTKN.some(miniSTX => {
            // Convert world position to maze-relative position
            const miniMazeX = miniSTX.x - this.mazeOffsetX;
            const miniMazeY = miniSTX.y - this.mazeOffsetY;
            const miniGrid = CollisionSystem.getGridPosition(miniMazeX, miniMazeY, this.levelCellSize || CONFIG.CELL_SIZE);
            const distance = Math.abs(position.x - miniGrid.x) + Math.abs(position.y - miniGrid.y);
            return distance < 3;
        });
    }

    update() {
        if (this.gameState.isGameOver || this.gameState.isPaused) {
            return;
        }
        
        // Ensure UI overlay stays visible during gameplay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay && uiOverlay.style.display !== 'flex') {
            uiOverlay.style.display = 'flex';
        }
        
        this.handleInput();
        this.updateOpponentAI();
        this.checkCollisions();
        this.updateUI();
    }

    handleInput() {
        if (!this.player) return;
        
        let deltaX = 0;
        let deltaY = 0;
        
        // Check input - use delta time for smooth movement
        const speed = CONFIG.PLAYER_SPEED / 60; // pixels per frame at 60fps
        
        // Check input
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            deltaX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            deltaX = speed;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            deltaY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            deltaY = speed;
        }
        
        // Move player with collision detection
        if (deltaX !== 0 || deltaY !== 0) {
            this.movePlayerWithCollision(deltaX, deltaY);
        }
    }

    movePlayerWithCollision(deltaX, deltaY) {
        if (!this.player) return;
        
        // Convert world position to maze-relative position for collision detection
        const mazeRelativeX = this.player.x - this.mazeOffsetX;
        const mazeRelativeY = this.player.y - this.mazeOffsetY;
        
        const newPosition = CollisionSystem.getValidMovePosition(
            mazeRelativeX, mazeRelativeY,
            deltaX, deltaY,
            this.getScaledPlayerSize(), this.getScaledPlayerSize(),
            this.collisionGrid, this.levelCellSize || CONFIG.CELL_SIZE,
            this.maze.grid  // Pass the maze grid for wall checking
        );
        
        // Convert back to world coordinates
        const worldX = newPosition.x + this.mazeOffsetX;
        const worldY = newPosition.y + this.mazeOffsetY;
        
        this.player.setPosition(worldX, worldY);
    }

    // --- A* Pathfinding Helper ---
    findPathAStar(start, goal, grid) {
        // start/goal: {x, y} in grid coordinates
        // grid: 2D array, 0=open, 1=wall
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        const key = (p) => `${p.x},${p.y}`;
        
        gScore[key(start)] = 0;
        fScore[key(start)] = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
        openSet.push({...start});
        
        while (openSet.length > 0) {
            // Get node with lowest fScore
            openSet.sort((a, b) => fScore[key(a)] - fScore[key(b)]);
            const current = openSet.shift();
            
            if (current.x === goal.x && current.y === goal.y) {
                // Reconstruct path
                const path = [current];
                let k = key(current);
                while (cameFrom[k]) {
                    path.unshift(cameFrom[k]);
                    k = key(cameFrom[k]);
                }
                return path;
            }
            
            closedSet.add(key(current));
            
            // Check all 4 directions with proper wall checking
            const directions = [
                {dx: 0, dy: -1, wall: 'top'},
                {dx: 1, dy: 0, wall: 'right'},
                {dx: 0, dy: 1, wall: 'bottom'},
                {dx: -1, dy: 0, wall: 'left'}
            ];
            
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                // Bounds check
                if (nx < 0 || ny < 0 || ny >= grid.length || nx >= grid[0].length) continue;
                
                // Wall check using actual maze walls
                const currentCell = this.maze.grid[current.y][current.x];
                if (currentCell.walls && currentCell.walls[dir.wall]) {
                    continue; // Wall blocks this direction
                }
                
                // Check if target cell is walkable
                if (grid[ny][nx] === 1) continue;
                
                const neighbor = {x: nx, y: ny};
                const neighborKey = key(neighbor);
                
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = gScore[key(current)] + 1;
                
                if (gScore[neighborKey] === undefined || tentativeG < gScore[neighborKey]) {
                    cameFrom[neighborKey] = current;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
                    
                    if (!openSet.some(p => p.x === nx && p.y === ny)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null; // No path found
    }

    updateOpponentAI() {
        if (!this.opponent || !this.mainTKN) return;
        
        // If currently moving, wait for completion
        if (this.opponent._moving) {
            return;
        }
        
        // Calculate current grid position
        const oppMazeX = this.opponent.x - this.mazeOffsetX;
        const oppMazeY = this.opponent.y - this.mazeOffsetY;
        const oppGrid = CollisionSystem.getGridPosition(oppMazeX, oppMazeY, this.levelCellSize || CONFIG.CELL_SIZE);
        
        // Calculate target grid position
        const stxMazeX = this.mainTKN.x - this.mazeOffsetX;
        const stxMazeY = this.mainTKN.y - this.mazeOffsetY;
        const stxGrid = CollisionSystem.getGridPosition(stxMazeX, stxMazeY, this.levelCellSize || CONFIG.CELL_SIZE);
        
        // Find path using A* (already respects maze walls)
        const path = this.findPathAStar(oppGrid, stxGrid, this.collisionGrid);
        
        if (!path || path.length < 2) {
            return; // No path or already at target
        }
        
        // Move to next cell in path (pathfinding already checked walls)
        const next = path[1];
        const targetWorld = CollisionSystem.getWorldPosition(next.x, next.y, this.levelCellSize || CONFIG.CELL_SIZE);
        const worldX = targetWorld.x + this.mazeOffsetX;
        const worldY = targetWorld.y + this.mazeOffsetY;
        
        // Mark as moving
        this.opponent._moving = true;
        
        // Tween to next position
        this.tweens.add({
            targets: this.opponent,
            x: worldX,
            y: worldY,
            duration: 320,
            ease: 'Linear',
            onComplete: () => {
                this.opponent._moving = false;
            }
        });
    }

    checkCollisions() {
        if (!this.player) return;
        if (this.mainTKN && CollisionSystem.checkPointCollision(
            this.player.x, this.player.y,
            this.mainTKN.x, this.mainTKN.y, 25
        )) {
            this.collectmainTKN('player');
        }
        
        if (this.opponent && this.mainTKN && CollisionSystem.checkPointCollision(
            this.opponent.x, this.opponent.y,
            this.mainTKN.x, this.mainTKN.y, 25
        )) {
            this.collectmainTKN('opponent');
        }
        
        this.miniTKN.forEach((miniSTX, index) => {
            if (CollisionSystem.checkPointCollision(
                this.player.x, this.player.y,
                miniSTX.x, miniSTX.y, 20
            )) {
                this.collectMiniSTX(index);
            }
        });
    }

    collectmainTKN(who = 'player') {
        this.trackLevelCompletion();
        
        const levelBonus = CONFIG.MAIN_STX_POINTS * this.gameState.level;
        const timeBonus = Math.floor(this.gameState.timeLeft * CONFIG.TIME_BONUS_MULTIPLIER);
        if (who === 'player') {
            this.gameState.score += levelBonus + timeBonus;
            this.gameState.playerSTXCount = (this.gameState.playerSTXCount || 0) + 1;
        } else if (who === 'opponent') {
            this.opponentTKCount = (this.opponentTKCount || 0) + 1;
        }
        this.mainTKN.destroy();
        this.mainTKN = null;

        if (this.gameState.level >= 10) {
            this.gameWon();
            return;
        }
        this.gameState.level++;
        this.time.delayedCall(500, () => {
            this.generateNewLevel();
        });
    }

    collectMiniSTX(index) {
        this.gameState.score += CONFIG.MINI_STX_POINTS;
        this.gameState.timeLeft += CONFIG.MINI_STX_TIME_BONUS;
        this.miniTKN[index].destroy();
        this.miniTKN.splice(index, 1);
    }

    startTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        if (this.gameState.isPaused) return;   
        this.gameState.timeLeft--;
        if (this.gameState.timeLeft <= 0) {
            this.gameOver();
        }
    }

    updateLevelTimer() {
        // Timer INCREASES with level (more time for harder mazes)
        const newTime = Math.min(
            CONFIG.BASE_TIME + (this.gameState.level - 1) * CONFIG.TIME_DECREASE_PER_LEVEL,
            CONFIG.BASE_TIME + 18  // Cap at 48 seconds (30 + 9*2)
        );
        this.gameState.timeLeft = newTime;
    }

    updateUI() {
        // Update UI overlay with wallet address and player/opponent labels
        const mazeRunnerHeading = document.getElementById('maze-runner-heading');
        if (mazeRunnerHeading) {
            // Wallet address gotten from window (set by React context)
            let walletAddress = '';
            if (window.dynamicUser && window.dynamicUser.walletAddress) {
                walletAddress = window.dynamicUser.walletAddress;
            } else if (window.dynamicPrimaryWallet && window.dynamicPrimaryWallet.address) {
                walletAddress = window.dynamicPrimaryWallet.address;
            }
            // Shorten address for display
            let shortAddress = '';
            if (walletAddress && walletAddress.length > 8) {
                shortAddress = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
            }
            // Remove any previous wallet address span
            let prevSpan = document.getElementById('wallet-address-span');
            if (prevSpan) prevSpan.remove();
            if (shortAddress) {
                const addressSpan = document.createElement('span');
                addressSpan.id = 'wallet-address-span';
                addressSpan.textContent = ` | Wallet: ${shortAddress}`;
                addressSpan.style.fontSize = '0.9em';
                addressSpan.style.color = '#fff';
                addressSpan.style.marginLeft = '10px';
                mazeRunnerHeading.appendChild(addressSpan);
            }
        }

        // Add "YOU" and "OPPONENT" labels under player/opponent icons
        // Remove previous labels if any
        let youLabel = document.getElementById('player-you-label');
        if (youLabel) youLabel.remove();
        let oppLabel = document.getElementById('player-opponent-label');
        if (oppLabel) oppLabel.remove();

        const playerIcon = document.getElementById('player-icon');
        const opponentIcon = document.getElementById('opponent-icon');
        if (playerIcon) {
            youLabel = document.createElement('div');
            youLabel.id = 'player-you-label';
            youLabel.textContent = 'YOU';
            youLabel.style.textAlign = 'center';
            youLabel.style.fontWeight = 'bold';
            youLabel.style.fontSize = '0.95em';
            youLabel.style.color = '#00e676';
            youLabel.style.marginTop = '2px';
            playerIcon.parentNode.insertBefore(youLabel, playerIcon.nextSibling);
        }
        if (opponentIcon) {
            oppLabel = document.createElement('div');
            oppLabel.id = 'player-opponent-label';
            oppLabel.textContent = 'OPPONENT';
            oppLabel.style.textAlign = 'center';
            oppLabel.style.fontWeight = 'bold';
            oppLabel.style.fontSize = '0.95em';
            oppLabel.style.color = '#ff1744';
            oppLabel.style.marginTop = '2px';
            opponentIcon.parentNode.insertBefore(oppLabel, opponentIcon.nextSibling);
        }
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            this.scene.pause();
            this.showPauseOverlay();
            this.updatePauseButtonIcon(true); 
        } else {
            this.scene.resume();
            this.hidePauseOverlay();
            this.updatePauseButtonIcon(false); 
        }
    }

    updatePauseButtonIcon(isPaused) {
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            if (isPaused) {
                pauseButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7L8 5z" fill="#000000"/>
                    </svg>
                `;
            } else {
                pauseButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="#000000"/>
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="#000000"/>
                    </svg>
                `;
            }
        }
    }

    showPauseOverlay() {
        // Create or show pause overlay
        let pauseOverlay = document.getElementById('pause-overlay');
        if (!pauseOverlay) {
            pauseOverlay = document.createElement('div');
            pauseOverlay.id = 'pause-overlay';
            pauseOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 200;
                gap: 30px;
                padding: 20px;
            `;

            const pausedTitle = document.createElement('h1');
            pausedTitle.textContent = 'Game Paused';
            pausedTitle.style.cssText = `
                font-size: 32px;
                font-weight: bold;
                color: #FFFFFF;
                margin: 0;
                text-align: center;
            `;
            
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
                background: rgba(27, 28, 28, 1);
                border-radius: 12px;
                padding: 30px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
                max-width: 320px;
                width: 90%;
            `;
            
            const timeBox = document.createElement('div');
            timeBox.style.cssText = `
                text-align: center;
            `;
            
            const timeLabel = document.createElement('div');
            timeLabel.textContent = 'Time Used';
            timeLabel.style.cssText = `
                font-size: 16px;
                color: #FFFFFF;
                margin-bottom: 10px;
                opacity: 0.8;
            `;
            
            const timeValue = document.createElement('div');
            timeValue.id = 'pause-time-display';
            const minutes = Math.floor(this.gameState.timeLeft / 60);
            const seconds = this.gameState.timeLeft % 60;
            timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timeValue.style.cssText = `
                font-size: 48px;
                font-weight: bold;
                color: #FFFFFF;
                letter-spacing: 2px;
            `;
            
            timeBox.appendChild(timeLabel);
            timeBox.appendChild(timeValue);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 100%;
                max-width: 320px;
            `;
            
            const resumeButton = document.createElement('button');
            resumeButton.textContent = 'Resume';
            resumeButton.style.cssText = `
                background: rgba(212, 15, 2, 1);
                color: #FFFFFF;
                border: none;
                padding: 18px 32px;
                font-size: 18px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: Arial, sans-serif;
                width: 100%;
            `;
            
            resumeButton.addEventListener('click', () => {
                this.togglePause();
            });
            
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart';
            restartButton.style.cssText = `
                background: transparent;
                color: #FFFFFF;
                border: 2px solid rgba(212, 15, 2, 1);
                padding: 18px 32px;
                font-size: 18px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: Arial, sans-serif;
                width: 100%;
            `;
            
            restartButton.addEventListener('mouseenter', () => {
                restartButton.style.background = 'rgba(212, 15, 2, 1)';
            });
            
            restartButton.addEventListener('mouseleave', () => {
                restartButton.style.background = 'transparent';
            });
            
            restartButton.addEventListener('click', () => {
                this.hidePauseOverlay();
                this.restartGame();
            });
            
            const homeButton = document.createElement('button');
            homeButton.textContent = 'Home';
            homeButton.style.cssText = `
                background: transparent;
                color: #FFFFFF;
                border: 2px solid rgba(212, 15, 2, 1);
                padding: 18px 32px;
                font-size: 18px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: Arial, sans-serif;
                width: 100%;
            `;
            
            homeButton.addEventListener('mouseenter', () => {
                homeButton.style.background = 'rgba(212, 15, 2, 1)';
            });
            
            homeButton.addEventListener('mouseleave', () => {
                homeButton.style.background = 'transparent';
            });
            
            homeButton.addEventListener('click', () => {
                this.hidePauseOverlay();
                const uiOverlay = document.getElementById('ui-overlay');
                if (uiOverlay) {
                    uiOverlay.style.display = 'none';
                }
                this.scene.start('TitleScene');
            });
            
            buttonsContainer.appendChild(resumeButton);
            buttonsContainer.appendChild(restartButton);
            buttonsContainer.appendChild(homeButton);
            
            contentContainer.appendChild(timeBox);
            contentContainer.appendChild(buttonsContainer);
            
            pauseOverlay.appendChild(pausedTitle);
            pauseOverlay.appendChild(contentContainer);
            
            document.getElementById('game-container').appendChild(pauseOverlay);
        } else {
            pauseOverlay.style.display = 'flex';
            const timeDisplay = document.getElementById('pause-time-display');
            if (timeDisplay) {
                const minutes = Math.floor(this.gameState.timeLeft / 60);
                const seconds = this.gameState.timeLeft % 60;
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    hidePauseOverlay() {
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.style.display = 'none';
        }
    }

    setupPause() {
        window.addEventListener('blur', () => {
            if (!this.gameState.isGameOver) {
                this.gameState.isPaused = true;
                this.scene.pause();
            }
        });
        
        window.addEventListener('focus', () => {
            // Don't auto-resume, let player manually resume
        });
    }

    gameOver() {
        this.gameState.isGameOver = true;
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }

        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
        
        this.showGameOverScreen();
        this.trackLevelCompletion()
    }

    showGameOverScreen(winner, playerSTX, opponentTK) {
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreElement = document.getElementById('final-score');
        const submissionStatus = document.getElementById('submission-status');
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
        
        if (gameOverScreen) {
            gameOverScreen.style.padding = '40px';
        }

        // Calculate scores
        const playerScore = this.gameState.score || 0;
        const playerSTXCount = this.gameState.playerSTXCount || 0;
        const opponentTKCount = this.opponentTKCount || 0;

        let playerIsWinner = playerSTXCount > opponentTKCount;
        let opponentIsWinner = opponentTKCount > playerSTXCount;
        
        // Update title
        const titleElement = document.querySelector('.game-over-title');
        if (titleElement) {
            if (playerIsWinner) {
                titleElement.textContent = 'Game Complete';
                titleElement.style.cssText = `
                    font-size: 32px;
                    font-weight: bold;
                    color: #FFFFFF;
                    margin: 0 0 10px 0;
                    text-align: center;
                `;
                // Add small text under the title
                let subtitle = document.getElementById('game-complete-subtitle');
                if (!subtitle) {
                    subtitle = document.createElement('div');
                    subtitle.id = 'game-complete-subtitle';
                    subtitle.textContent = 'All levels have been completed!';
                    subtitle.style.cssText = `
                        font-size: 18px;
                        color: #FFFFFF;
                        margin-bottom: 20px;
                        text-align: center;
                        opacity: 0.85;
                    `;
                    titleElement.parentNode.insertBefore(subtitle, titleElement.nextSibling);
                } else {
                    subtitle.style.display = 'block';
                }
            } else {
                titleElement.textContent = 'Game Over';
                titleElement.style.cssText = `
                    font-size: 32px;
                    font-weight: bold;
                    color: #FFFFFF;
                    margin: 0 0 30px 0;
                    text-align: center;
                `;
                // Hide subtitle if it exists
                let subtitle = document.getElementById('game-complete-subtitle');
                if (subtitle) {
                    subtitle.style.display = 'none';
                }
            }
        }

        // Create score comparison display
        if (finalScoreElement) {
            if (playerIsWinner) {
                // Player wins
                finalScoreElement.innerHTML = `
                    <div style="
                        background: rgba(27, 28, 28, 1);
                        border-radius: 20px;
                        padding: 25px;
                        display: flex;
                        flex-direction: column;
                        gap: 30px;
                        width: 650px;
                        max-width: 90vw;
                        text-align: center;
                        box-shadow: 0 4px 32px rgba(0,0,0,0.25);
                    ">
                        <div style="display: flex; gap: 20px; justify-content: center; width: 100%;">
                            <!-- Player Side -->
                            <div style="
                                flex: 1;
                                background: rgba(212, 15, 2, 1);
                                border-radius: 12px;
                                padding: 20px;
                                text-align: center;
                                color: #fff;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                font-weight: bold;
                            ">
                                
                                <div style="font-size: 18px; margin-bottom: 6px;">
                                    <img src="assets/images/player-icon.png" alt="YOU" style="width: 22px; margin-bottom: -4px;" /> Player
                                </div>
                                <div style="font-size: 32px; margin-bottom: 4px;">${playerSTXCount}</div>
                                <div style="font-size: 14px; opacity: 0.85;">Tokens Collected</div>
                            </div>
                            <!-- Opponent Side -->
                            <div style="
                                flex: 1;
                                background: #18191a;
                                border-radius: 12px;
                                padding: 20px;
                                text-align: center;
                                color: #fff;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                font-weight: bold;
                            ">
                                <div style="font-size: 18px; margin-bottom: 6px;">
                                    <img src="assets/images/opponent-icon.png" alt="OPPONENT" style="width: 22px; margin-bottom: -4px;" /> Opponent
                                </div>
                                <div style="font-size: 32px; margin-bottom: 4px;">${opponentTKCount}</div>
                                <div style="font-size: 14px; opacity: 0.85;">Tokens Collected</div>
                            </div>
                        </div>
                        <div style="font-size: 22px; color: #fff; margin-top: 18px; margin-bottom: 10px; font-weight: bold;">
                            Final Score: ${playerScore.toLocaleString()}
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center; width: 100%; margin-top: 8px;">
                            <button id="restart-button" style="
                                background: rgba(212, 15, 2, 1);
                                color: #FFFFFF;
                                border: none;
                                padding: 14px 0;
                                font-size: 18px;
                                font-weight: 600;
                                border-radius: 18px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-family: Arial, sans-serif;
                                width: 28%;
                            ">Play Again</button>
                            <button id="claim-reward-btn" style="
                                background: transparent;
                                color: #FFFFFF;
                                border: 2px solid rgba(212, 15, 2, 1);
                                padding: 14px 0;
                                font-size: 18px;
                                font-weight: 600;
                                border-radius: 18px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-family: Arial, sans-serif;
                                width: 28%;
                            ">Claim Reward</button>
                        </div>
                    </div>
                `;
            } else {
                // Opponent wins or draw: use existing styling
                finalScoreElement.innerHTML = `
                    <div style="
                        background: rgba(27, 28, 28, 1);
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 30px;
                        width: 650px;
                        max-width: 90vw;
                        text-align: center;
                    ">
                        <!-- Player vs Opponent Comparison -->
                        <div style="display: flex; gap: 20px; justify-content: center; width: 100%;">
                            <!-- Player Side -->
                            <div style="
                                flex: 1;
                                background: ${playerIsWinner ? 'rgba(212, 15, 2, 1)' : 'transparent'};
                                border: 2px solid rgba(212, 15, 2, 1);
                                border-radius: 12px;
                                padding: 20px;
                                text-align: center;
                            ">
                                <div style="font-size: 18px; color: #FFFFFF; margin-bottom: 10px; font-weight: 600;"><img src="assets/images/player-icon.png" alt="YOU" style="width: 30px; margin-bottom: 2px;" /> Player</div>
                                <div style="font-size: 36px; color: #FFFFFF; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px;">${playerSTXCount}</div>
                                <div style="font-size: 14px; color: #FFFFFF; opacity: 0.7;">Tokens</div>
                            </div>
                            <!-- Opponent Side -->
                            <div style="
                                flex: 1;
                                background: ${opponentIsWinner ? 'rgba(212, 15, 2, 1)' : 'transparent'};
                                border: 2px solid rgba(212, 15, 2, 1);
                                border-radius: 12px;
                                padding: 20px;
                                text-align: center;
                            ">
                                <div style="font-size: 18px; color: #FFFFFF; margin-bottom: 10px; font-weight: 600;"><img src="assets/images/opponent-icon.png" alt="OPPONENT" style="width: 30px; margin-bottom: 2px;" /> Opponent</div>
                                <div style="font-size: 36px; color: #FFFFFF; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px;">${opponentTKCount}</div>
                                <div style="font-size: 14px; color: #FFFFFF; opacity: 0.7;">Tokens</div>
                            </div>
                        </div>
                        <!-- Your Score -->
                        <div>
                            <div style="font-size: 16px; color: #FFFFFF; margin-bottom: 10px; opacity: 0.8;">Your Score</div>
                            <div style="font-size: 48px; color: #FFFFFF; font-weight: bold; letter-spacing: 2px;">${playerScore.toLocaleString()}</div>
                        </div>
                        <!-- Buttons -->
                        <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
                            <button id="restart-button" style="
                                background: rgba(212, 15, 2, 1);
                                color: #FFFFFF;
                                border: none;
                                padding: 18px 32px;
                                font-size: 18px;
                                font-weight: 600;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-family: Arial, sans-serif;
                                width: 100%;
                            ">Try again</button>
                            <button id="home-button" style="
                                background: transparent;
                                color: #FFFFFF;
                                border: 2px solid rgba(212, 15, 2, 1);
                                padding: 18px 32px;
                                font-size: 18px;
                                font-weight: 600;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-family: Arial, sans-serif;
                                width: 100%;
                            ">Home</button>
                        </div>
                    </div>
                `;
            }
        }
        
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }
        
        // Setup button handlers
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('mouseenter', () => {
                restartButton.style.transform = 'translateY(-2px)';
                restartButton.style.boxShadow = '0 6px 20px rgba(212, 15, 2, 0.4)';
            });
            
            restartButton.addEventListener('mouseleave', () => {
                restartButton.style.transform = 'translateY(0)';
                restartButton.style.boxShadow = 'none';
            });
            
            restartButton.onclick = () => this.restartGame();
        }
        
        const homeButton = document.getElementById('home-button');
        if (homeButton) {
            homeButton.addEventListener('mouseenter', () => {
                homeButton.style.background = 'rgba(212, 15, 2, 1)';
            });
            
            homeButton.addEventListener('mouseleave', () => {
                homeButton.style.background = 'transparent';
            });
            
            homeButton.onclick = () => {
                const gameOverScreen = document.getElementById('game-over-screen');
                if (gameOverScreen) {
                    gameOverScreen.style.display = 'none';
                }
                this.scene.start('TitleScene');
            };
        }

        const claimRewardBtn = document.getElementById('claim-reward-btn');
        if (claimRewardBtn) {
            claimRewardBtn.onclick = () => {
                this.scene.launch('ClaimRewardsScene');
            };
        }
    }

    addClaimRewardButton() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (!gameOverScreen) return;
        if (document.getElementById('claim-reward-btn')) return;
    }
    
    async handleClaimReward() {
        const claimButton = document.getElementById('claim-reward-btn');
        if (!claimButton) return;
        
        try {
            claimButton.disabled = true;
            claimButton.textContent = 'Processing...';
            
            const gameId = this.userMazeConfig.gameId;
            const result = await API.claimReward(gameId);
            
            if (result && result.claimReward && result.claimReward.claimed) {
                claimButton.style.background = 'rgba(212, 15, 2, 1)';
                claimButton.textContent = 'Reward Claimed!';
            } else {
                throw new Error('Failed to claim reward or already claimed.');
            }
        } catch (error) {
            console.error('Failed to claim reward:', error);
            claimButton.disabled = false;
            claimButton.textContent = 'Claim Reward';
        }
    }

    restartGame() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }

        const victoryOverlay = document.getElementById('victory-overlay');
        if (victoryOverlay) {
            victoryOverlay.style.display = 'none';
            victoryOverlay.remove(); 
        }
        
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }

        this.updatePauseButtonIcon(false);
        this.scene.restart({userMazeConfig: this.userMazeConfig});
    }

    jumpToLevel(targetLevel) {
        if (targetLevel < 1 || targetLevel > 10) return;
        this.gameState.level = targetLevel;
        this.generateNewLevel();
        this.updateUI();
    }

    gameWon() {
        // Compare playerSTXCount and opponentTKCount
        const playerSTX = this.gameState.playerSTXCount || 0;
        const opponentTK = this.opponentTKCount || 0;
        let winner;
        if (playerSTX > opponentTK) {
            winner = 'Player';
        } else if (opponentTK > playerSTX) {
            winner = 'Villain';
        } else {
            winner = 'Draw';
        }
        
        this.gameState.isGameOver = true;
    
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }
    
        this.showVictoryScreen();
        this.trackLevelCompletion();
    }

    showVictoryScreen() {
        const playerSTX = this.gameState.playerSTXCount || 0;
        const opponentTK = this.opponentTKCount || 0;
        const playerIsWinner = playerSTX > opponentTK;
        const villainIsWinner = opponentTK > playerSTX;
        const isDraw = playerSTX === opponentTK;
        
        // Hide UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
        
        // Create victory overlay
        let victoryOverlay = document.getElementById('victory-overlay');
        if (!victoryOverlay) {
            victoryOverlay = document.createElement('div');
            victoryOverlay.id = 'victory-overlay';
            victoryOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 300;
                animation: victoryFadeIn 1s ease-in-out;
                overflow-y: auto;
                padding: 20px;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes victoryFadeIn {
                    0% { opacity: 0; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes victoryPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
            `;
            document.head.appendChild(style);
            
            victoryOverlay.innerHTML = `
                <div class="victory-title" style="font-size: 64px; color: #FFFFFF; margin-bottom: 20px; font-weight: bold; text-align: center;">
                    GAME COMPLETE!
                </div>
                <div style="font-size: 20px; color: #FFFFFF; margin-bottom: 30px; text-shadow: 0 0 15px #000000; text-align: center;">
                    All levels have been completed!
                </div>
                
                <!-- Side-by-Side Comparison -->
                <div style="display: flex; gap: 20px; justify-content: center; align-items: stretch; width: 100%; max-width: 600px; margin: 20px auto;">
                    <!-- Player Side -->
                    <div style="
                        flex: 1;
                        background: ${playerIsWinner ? 'rgba(212, 15, 2, 1)' : 'rgba(27, 28, 28, 1)'};
                        border: ${playerIsWinner ? '3px solid rgba(212, 15, 2, 1)' : '2px solid rgba(27, 28, 28, 1)'};
                        border-radius: 15px;
                        padding: 25px 20px;
                        text-align: center;
                        transform: ${playerIsWinner ? 'scale(1.05)' : 'scale(1)'};
                        transition: all 0.3s ease;
                    ">
                        ${playerIsWinner ? '<h1 style="font-size: 32px; color: #ffffff; margin: 0 0 15px 0;">🏆</h1>' : ''}
                        <h2 style="font-size: 24px; color: #ffffff; margin: 0 0 15px 0;">🐭 Player</h2>
                        <div style="font-size: 48px; color: #ffffff; font-weight: bold; margin: 15px 0;">${playerSTX}</div>
                        <div style="font-size: 16px; color: #d1d5db; margin-top: 10px;">Tokens Collected</div>
                    </div>
                    
                    <!-- Villain Side -->
                    <div style="
                        flex: 1;
                        background: ${villainIsWinner ? 'rgba(212, 15, 2, 1)' : 'rgba(27, 28, 28, 1)'};
                        border: ${villainIsWinner ? '3px solid rgba(212, 15, 2, 1)' : '2px solid rgba(27, 28, 28, 1)'};
                        border-radius: 15px;
                        padding: 25px 20px;
                        text-align: center;
                        transform: ${villainIsWinner ? 'scale(1.05)' : 'scale(1)'};
                        transition: all 0.3s ease;
                    ">
                        ${villainIsWinner ? '<h1 style="font-size: 32px; color: #ffffff; margin: 0 0 15px 0;;">🏆</h1>' : ''}
                        <h2 style="font-size: 24px; color: #ffffff; margin: 0 0 15px 0;">👹 Villain</h2>
                        <div style="font-size: 48px; color: #ffffff; font-weight: bold; margin: 15px 0;">${opponentTK}</div>
                        <div style="font-size: 16px; color: #d1d5db; margin-top: 10px;">Tokens Collected</div>
                    </div>
                </div>
                ${isDraw ? '<div style="font-size: 24px; color: #fbbf24; margin-top: 20px; text-shadow: 0 0 15px #fbbf24;">🤝 It\'s a Draw! 🤝</div>' : ''}
                
                <div style="font-size: 48px; color: #ffffff; margin-top: 30px; margin-bottom: 20px; text-shadow: 0 0 25px #000000; font-weight: bold;">
                    Final Score: ${this.gameState.score}
                </div>
                
                <button id="play-again-button" style="
                    background: rgba(212, 15, 2, 1);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 18px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: bold;
                " onmouseover="this.style.transform='scale(1.05)';" 
                   onmouseout="this.style.transform='scale(1)';">
                    Play Again
                </button>
                <div id="victory-submission-status" style="margin-top: 20px; font-size: 14px; color: #FFFFFF; text-align: center;"></div>
            `;
            
            document.getElementById('game-container').appendChild(victoryOverlay);
        } else {
            victoryOverlay.style.display = 'flex';
        }
        
        // Setup play again button
        const playAgainButton = document.getElementById('play-again-button');
        if (playAgainButton) {
            playAgainButton.onclick = () => this.restartGame();
        }
    }

    // Helper methods for proportional entity scaling
    getScaledPlayerSize() {
        if (!this.levelCellSize) return CONFIG.PLAYER_SIZE;
        
        // Calculate scale factor based on cell size ratio
        const scaleFactor = this.levelCellSize / CONFIG.CELL_SIZE;
        
        // Scale player size but keep it reasonable (min 8px, max based on cell size)
        const scaledSize = Math.round(CONFIG.PLAYER_SIZE * scaleFactor);
        return Math.max(8, Math.min(scaledSize, this.levelCellSize * 0.8));
    }

    getScaledmainTKNSize() {
        if (!this.levelCellSize) return 32;
        
        const scaleFactor = this.levelCellSize / CONFIG.CELL_SIZE;
        const scaledSize = Math.round(32 * scaleFactor);
        return Math.max(12, Math.min(scaledSize, this.levelCellSize * 0.9));
    }

    getScaledminiTKNize() {
        if (!this.levelCellSize) return 24;
        
        const scaleFactor = this.levelCellSize / CONFIG.CELL_SIZE;
        const scaledSize = Math.round(24 * scaleFactor);
        return Math.max(10, Math.min(scaledSize, this.levelCellSize * 0.7));
    }
    
    debugShowVictory(scenario = 'player') {        
        // Set up mock data based on scenario
        let playerSTXCount, opponentTKCount;
        switch(scenario) {
            case 'player':
                playerSTXCount = 8;
                opponentTKCount = 2;
                break;
            case 'villain':
                playerSTXCount = 3;
                opponentTKCount = 7;
                break;
            case 'draw':
                playerSTXCount = 5;
                opponentTKCount = 5;
                break;
            default:
                playerSTXCount = 6;
                opponentTKCount = 4;
        }
        
        // Initialize gameState if it doesn't exist
        this.gameState = this.gameState || {
            score: 0,
            level: 1,
            timeLeft: CONFIG.BASE_TIME,
            isGameOver: false,
            isPaused: false
        };
        
        // Set the values correctly
        this.gameState.playerSTXCount = playerSTXCount;
        this.opponentTKCount = opponentTKCount;  // This is NOT in gameState
        this.gameState.score = 15000;
        this.gameState.level = 10;
        this.gameState.isGameOver = true;
        
        console.log('Player STX:', this.gameState.playerSTXCount);
        console.log('Opponent STX:', this.opponentTKCount);
        
        // Hide UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
        
        this.showVictoryScreen();
    }
    
    debugShowGameOver(scenario = 'player') {
        
        // Set up mock data based on scenario
        let playerSTXCount, opponentTKCount;
        switch(scenario) {
            case 'player':
                playerSTXCount = 6;
                opponentTKCount = 3;
                break;
            case 'villain':
                playerSTXCount = 2;
                opponentTKCount = 8;
                break;
            case 'draw':
                playerSTXCount = 4;
                opponentTKCount = 4;
                break;
            default:
                playerSTXCount = 5;
                opponentTKCount = 3;
        }
        
        // Initialize gameState if it doesn't exist
        this.gameState = this.gameState || {
            score: 0,
            level: 1,
            timeLeft: CONFIG.BASE_TIME,
            isGameOver: false,
            isPaused: false
        };
        
        // Set the values correctly
        this.gameState.playerSTXCount = playerSTXCount;
        this.opponentTKCount = opponentTKCount;  // This is NOT in gameState
        this.gameState.score = 8500;
        this.gameState.level = 7;
        this.gameState.isGameOver = true;
        
        console.log('Player STX:', this.gameState.playerSTXCount);
        console.log('Opponent STX:', this.opponentTKCount);
        console.log('Score:', this.gameState.score);
        
        // Hide UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
        
        this.showGameOverScreen('test', playerSTXCount, opponentTKCount);
    }

    adjustGameDifficulty() {
        if (!this.userMazeConfig) return;
        
        // Adjust starting level based on difficulty selection
        switch(this.userMazeConfig.difficulty) {
            case 'easy':
                this.gameState.level = 1; // Start at level 1
                break;
            case 'hard':
                this.gameState.level = 4; // Start at level 4
                break;
            case 'difficult':
                this.gameState.level = 8; // Start at level 8
                break;
        }
    }

    trackLevelCompletion() {
        const completion = {
            level: this.gameState.level,
            score: this.gameState.score,
            timeRemaining: this.gameState.timeLeft,
            timestamp: Date.now(),
            gameId: this.userMazeConfig?.gameId,
            userId: this.userMazeConfig?.userId
        };
        
        this.levelCompletions.push(completion);
        this.submitLevelProgress(completion);
    }
    
    async submitLevelProgress(completion) {
        try {
            if (!completion || !completion.gameId) {
                console.warn('No game ID available for progress submission');
                return;
            }
            await API.submitScore(completion.score, completion.level, completion.gameId);
        } catch (error) {
            console.error('Error submitting progress to blockchain:', error);
        }
    }

    async gameWon() {
        this.gameState.isGameOver = true;
        
        // Stop timer
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }
        
        // Submit all level completions to blockchain
        await this.submitCompletionsToBlockchain();
        
        // Check if bounty conditions are met
        this.checkBountyConditions();
        
        // Show victory screen
        this.showVictoryScreen();
    }

    async submitCompletionsToBlockchain() {
        if (!this.userMazeConfig || this.levelCompletions.length === 0) return;
        
        try {
            console.log('Submitting level completions to blockchain:', this.levelCompletions);
            
            // TODO: Batch submit all level completions
            // await window.contractCalls.submitLevelCompletions(
            //     this.userMazeConfig.gameId,
            //     this.userMazeConfig.userId,
            //     this.levelCompletions
            // );
            
        } catch (error) {
            console.error('Error submitting level completions:', error);
            // Continue with game flow even if blockchain submission fails
        }
    }

    checkBountyConditions() {
        if (!this.userMazeConfig || this.userMazeConfig.bountyAmount <= 0) return;
        
        // Check if bountyConditions exists before accessing properties
        if (!this.userMazeConfig.bountyConditions) {
            return;
        }
        
        const conditions = this.userMazeConfig.bountyConditions;
        let bountyEarned = false;
        
        // Check completion conditions
        if (conditions.completeAllLevels && this.gameState.level >= 10) {
            bountyEarned = true;
        }
        
        if (conditions.minimumScore && this.gameState.score >= conditions.minimumScore) {
            bountyEarned = true;
        }
        
        // TODO: Add time limit check if implemented
        
        if (bountyEarned) {
            // TODO: Trigger bounty payment through smart contract
        }
    }
}
