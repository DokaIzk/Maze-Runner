// import { connect } from "http2";

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    // preload() {
    //     // Load the logo image from assets/images directory
    //     this.load.image('maze-logo', '../../public/assets/images/m.png');
    //     // public/assets/images/m.png
    //     // assets/images/m.png
    // }

    create() {
        // Set solid black background
        this.cameras.main.setBackgroundColor('#000000');
        
        // Create DOM overlay for crisp text
        this.createTextOverlay();
        
        // Setup input handling
        this.setupInput();

        // Setup responsive layout
        this.setupResponsiveLayout();
    }
    
    createTextOverlay() {
        // Create DOM overlay for crisp text
        const overlay = document.createElement('div');
        overlay.id = 'title-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 50;
            font-family: Arial, sans-serif;
            padding: 60px 20px;
            box-sizing: border-box;
            gap: 20px;
            pointer-events: none;
        `;
        
        // Maze logo image
        const logoImg = document.createElement('img');
        // logoImg.src = 'assets/images/m.png';
        logoImg.src = '/assets/images/m.png';
        logoImg.alt = 'Maze';
        logoImg.style.cssText = `
            width: 280px;
            height: auto;
            max-height: 250px;
            object-fit: contain;
            filter: drop-shadow(0 10px 30px rgba(212, 15, 2, 0.1));
        `;
        
        // Title text
        const titleDiv = document.createElement('h1');
        titleDiv.style.cssText = `
            color: #FFFFFF;
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-align: center;
        `;
        titleDiv.textContent = 'MazeRunner';
        
        // Tagline text  
        const taglineDiv = document.createElement('p');
        taglineDiv.style.cssText = `
            font-size: 16px;
            color: #FFFFFF;
            text-align: center;
            opacity: 0.9;
            margin: 0;
            line-height: 1.6;
            max-width: 90%;
        `;
        taglineDiv.innerHTML = 'Unravel the network\'s secrets, master <br> the maze, and reap the rewards.';

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: 320px;
            pointer-events: auto;
        `;
        
        // Connect Wallet button
        const connectWalletBtn = document.createElement('button');
        connectWalletBtn.id = 'connect-wallet-btn';
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.style.cssText = `
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

        // connectWalletBtn.disabled = true;
        // connectWalletBtn.style.opacity = '0.6';

        // const enableWhenReady = setInterval(() => {
        //     if (window.openDynamicWalletModal) {
        //         connectWalletBtn.disabled = false;
        //         connectWalletBtn.style.opacity = 1;
        //         clearInterval(enableWhenReady);
        //     }
        // }, 50);
        
        connectWalletBtn.addEventListener('click', () => {
            if (window.openDynamicWalletModal) {
                window.openDynamicWalletModal();
            } else {
                console.log('Dynamic wallet modal function not found');
            }
        });
        
        // Continue as Guest button
        const guestBtn = document.createElement('button');
        guestBtn.textContent = 'Continue as Guest';
        guestBtn.style.cssText = `
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
        
        guestBtn.addEventListener('mouseenter', () => {
            guestBtn.style.background = 'rgba(212, 15, 2, 1)';
        });
        
        guestBtn.addEventListener('mouseleave', () => {
            guestBtn.style.background = 'transparent';
        });

        guestBtn.addEventListener('click', () => {
            this.goToInstructions();
        });
        
        // Append buttons to container
        buttonsContainer.appendChild(connectWalletBtn);
        buttonsContainer.appendChild(guestBtn);
        
        overlay.appendChild(logoImg);
        overlay.appendChild(titleDiv);
        overlay.appendChild(taglineDiv);
        overlay.appendChild(buttonsContainer);
        
        const gameContainer = document.getElementById('game-container');
        
        if (gameContainer) {
            gameContainer.appendChild(overlay);
        } else {
            console.error('Could not find game-container element');
        }
        
        // Store references for animations
        this.titleText = titleDiv;
        this.taglineText = taglineDiv;
    }
    
    setupInput() {
        // Handle keyboard input (space or enter)
        this.input.keyboard.on('keydown-SPACE', () => {
            this.goToMazeCreation();
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.goToMazeCreation();
        });
    }
    
    goToInstructions() {
        // Immediately remove title overlay to prevent it from showing in other scenes
        const titleOverlay = document.getElementById('title-overlay');
        if (titleOverlay) {
            titleOverlay.remove();
        }
        
        // Transition to instructions scene
        this.scene.start('InstructionsScene');
    }

    goToMazeCreation() {
        // Immediately remove title overlay to prevent it from showing in other scenes
        const titleOverlay = document.getElementById('title-overlay');
        if (titleOverlay) {
            titleOverlay.remove();
        }
        
        // Transition to maze creation scene
        this.scene.start('MazeCreationScene');
    }

    setupResponsiveLayout() {
        // Handle window resize events - only if we're still in TitleScene
        window.addEventListener('resize', () => {
            // Only recreate overlay if we're still in the TitleScene
            if (this.scene.isActive('TitleScene')) {
                // Remove existing overlay
                const existingOverlay = document.getElementById('title-overlay');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
                
                // Recreate text overlay with new responsive values
                this.createTextOverlay();
            }
        });
    }
}