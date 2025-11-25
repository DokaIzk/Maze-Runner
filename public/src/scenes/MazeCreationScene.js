// Maze Creation Scene - User configuration before gameplay
export default class MazeCreationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MazeCreationScene' });
        this.userMazeConfig = null;
    }

    create() {
        // Create the maze creation UI overlay
        this.createMazeCreationUI();
    }

    createMazeCreationUI() {
        // Create flex container
        let mazeCreationContainer = document.getElementById('maze-creation-container');
        if (!mazeCreationContainer) {
            mazeCreationContainer = document.createElement('div');
            mazeCreationContainer.id = 'maze-creation-container';
            mazeCreationContainer.style.cssText = `
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
                z-index: 400;
                font-family: Arial, sans-serif;
                padding: 60px 20px;
                box-sizing: border-box;
                gap: 40px;
            `;
            
            // Create title at top
            const titleElement = document.createElement('h1');
            titleElement.textContent = 'MazeRunner';
            titleElement.style.cssText = `
                color: #FFFFFF;
                font-size: 32px;
                font-weight: bold;
                margin: 0;
                text-align: center;
                position: absolute;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
            `;
            
            // Create maze image
            const mazeImage = document.createElement('img');
            mazeImage.src = 'assets/images/m.png';
            mazeImage.alt = 'Maze';
            mazeImage.style.cssText = `
                width: 280px;
                height: auto;
                max-height: 250px;
                object-fit: contain;
                filter: drop-shadow(0 10px 30px rgba(212, 15, 2, 0.2));
            `;
            
            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 100%;
                max-width: 320px;
            `;
            
            // New Game button (filled red)
            const newGameButton = document.createElement('button');
            newGameButton.id = 'new-game-button';
            newGameButton.textContent = 'New Game';
            newGameButton.style.cssText = `
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
            
            // Game Instructions button (outlined)
            const instructionsButton = document.createElement('button');
            instructionsButton.id = 'game-instructions-button';
            instructionsButton.textContent = 'Game Instructions';
            instructionsButton.style.cssText = `
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
            
            // Exit button (outlined)
            const exitButton = document.createElement('button');
            exitButton.id = 'exit-button';
            exitButton.textContent = 'Exit';
            exitButton.style.cssText = `
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
            
            // Add hover effects to Instructions button
            instructionsButton.addEventListener('mouseenter', () => {
                instructionsButton.style.background = 'rgba(212, 15, 2, 1)';
                instructionsButton.style.transform = 'translateY(-2px)';
            });
            
            instructionsButton.addEventListener('mouseleave', () => {
                instructionsButton.style.background = 'transparent';
            });
            
            // Add hover effects to Exit button
            exitButton.addEventListener('mouseenter', () => {
                exitButton.style.background = 'rgba(212, 15, 2, 1)';
            });
            
            exitButton.addEventListener('mouseleave', () => {
                exitButton.style.background = 'transparent';
            });
            
            // Add status text
            const statusDiv = document.createElement('div');
            statusDiv.id = 'creation-status';
            statusDiv.style.cssText = `
                font-size: 14px;
                color: #888;
                text-align: center;
                opacity: 0;
                transition: all 0.3s ease;
            `;
            
            // Assemble buttons
            buttonsContainer.appendChild(newGameButton);
            buttonsContainer.appendChild(instructionsButton);
            buttonsContainer.appendChild(exitButton);
            
            // Assemble the layout
            mazeCreationContainer.appendChild(titleElement);
            mazeCreationContainer.appendChild(mazeImage);
            mazeCreationContainer.appendChild(buttonsContainer);
            mazeCreationContainer.appendChild(statusDiv);

            const gameContainer = document.getElementById('game-container') || document.body;
            gameContainer.appendChild(mazeCreationContainer);
        }

        // Setup event handlers
        this.setupMazeCreationHandlers();
    }

    setupMazeCreationHandlers() {
        const newGameButton = document.getElementById('new-game-button');
        const instructionsButton = document.getElementById('game-instructions-button');
        const exitButton = document.getElementById('exit-button');

        // New Game button handler - directly start the game
        newGameButton.addEventListener('click', () => {
            // Generate simple game config
            this.userMazeConfig = {
                gameId: this.generateRandomGameId(),
                totalRounds: 10,
                difficulty: 'normal',
                createdAt: Date.now(),
                currentRound: 0,
                roundTimes: []
            };
            this.startGameWithMaze();
        });
        
        // Instructions button handler
        instructionsButton.addEventListener('click', () => {
            this.goToInstructions();
        });
        
        // Exit button handler
        exitButton.addEventListener('click', () => {
            this.goToTitle();
        });
    }

    goToInstructions() {
        // Remove maze creation container
        const container = document.getElementById('maze-creation-container');
        if (container) {
            container.style.transition = 'all 0.5s ease';
            container.style.opacity = '0';
        }
        
        setTimeout(() => {
            if (container) {
                container.remove();
            }
            this.scene.start('InstructionsScene');
        }, 500);
    }

    goToTitle() {
        // Remove maze creation container
        const container = document.getElementById('maze-creation-container');
        if (container) {
            container.style.transition = 'all 0.5s ease';
            container.style.opacity = '0';
        }
        
        setTimeout(() => {
            if (container) {
                container.remove();
            }
            this.scene.start('TitleScene');
        }, 500);
    }



    async createMaze() {
        const statusDiv = document.getElementById('creation-status');
        const createButton = document.getElementById('create-maze-button');
        
        try {
            // Show status message
            statusDiv.textContent = 'Creating maze on blockchain...';
            statusDiv.style.opacity = '1';
            createButton.disabled = true;
            createButton.style.opacity = '0.6';
            
            // Store game configuration
            this.userMazeConfig = {
                gameId: this.generateRandomGameId(),
                // txId: gameResult.txId,
                totalRounds: 10,
                // bounty: bountyAmount,
                // playerAddress: userAddress,
                difficulty: 'normal',
                createdAt: Date.now(),
                currentRound: 0,
                roundTimes: [] // Track completion time for each round
            };
            
            statusDiv.textContent = 'Maze created! Starting game...';
            
            // Start the game with the maze configuration
            setTimeout(() => {
                this.startGameWithMaze();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error creating maze:', error);
            statusDiv.textContent = `Error: ${error.message}`;
            statusDiv.style.color = '#FF6B6B';
            statusDiv.style.opacity = '1';
            createButton.disabled = false;
            createButton.style.opacity = '1';
            
            // Show error popup
            ErrorPopup.show(error.message, '❌ Game Creation Failed', 5000);
            
            // Reset after delay
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.style.opacity = '0';
            }, 5000);
        }
    }

    generateUserIdFromAddress(address) {
        // Create a hash of the wallet address for user ID
        let hash = 0;
        for (let i = 0; i < address.length; i++) {
            const char = address.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `user_${Math.abs(hash).toString(16)}`;
    }

    generateRandomGameId() {
        // Generate a random game ID
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `game_${timestamp}_${random}`;
    }

    startGameWithMaze() {
        // Hide the maze creation container
        const container = document.getElementById('maze-creation-container');
        if (container) {
            container.style.transition = 'all 0.5s ease';
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
        }
        
        // Start game after animation
        setTimeout(() => {
            if (container) {
                container.remove();
            }
            
            // Pass maze configuration to game scene and start it
            this.scene.start('GameScene', { 
                userMazeConfig: this.userMazeConfig 
            });
        }, 500);
    }
}