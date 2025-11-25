// Import React and Dynamic SDK for wallet UI
import React from 'react';
import ReactDOM from 'react-dom/client';
import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { ConnectWallet } from './ui/ConnectWallet.jsx';
import { dynamicConfig } from './dynamic-config';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

import CONFIG from './config.js';
import ErrorPopup from './ui/ErrorPopup.js';
import MazeGenerator from './utils/mazeGenerator.js';
import CollisionSystem from './utils/collisions.js';

import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import MazeCreationScene from './scenes/MazeCreationScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import ClaimRewardsScene from './scenes/ClaimRewardsScene.js';


// Main game initialization
class MazeRunnerGame {
    constructor() {
        this.game = null;
        this.init();
    }

    init() {
        // Phaser game configuration
        const isMobile = window.innerWidth <= 768;
        const canvasWidth = isMobile ? window.innerWidth : CONFIG.CANVAS_WIDTH;
        const canvasHeight = isMobile ? window.innerHeight : CONFIG.CANVAS_HEIGHT;
        
        const config = {
            type: Phaser.AUTO,
            width: canvasWidth,
            height: canvasHeight,
            parent: 'game-container',
            backgroundColor: CONFIG.COLORS.BACKGROUND,
            scene: [BootScene, TitleScene, InstructionsScene, MazeCreationScene, GameScene, ClaimRewardsScene, UIScene],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 320,
                    height: 240
                },
                max: {
                    width: 1200,
                    height: 900
                }
            },
            render: {
                antialias: true,
                pixelArt: false
            },
            input: {
                touch: true,
                smoothFactor: 0
            }
        };

        // Create the game
        this.game = new Phaser.Game(config);
        
        // Expose game globally for debugging
        window.phaserGame = this.game;

        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup debug helpers
        this.setupDebugHelpers();
    }

    setupErrorHandling() {
        // Handle Phaser errors
        this.game.events.on('error', (error) => {
            console.error('Phaser error:', error);
            this.showErrorMessage('Game error occurred. Please refresh the page.');
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showErrorMessage('An error occurred. Please refresh the page.');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorMessage('Connection error. Please check your network.');
        });
    }

    setupDebugHelpers() {
        // Expose global debug functions
        window.debugVictory = (scenario = 'player') => {
            const gameScene = this.game.scene.getScene('GameScene');
            if (gameScene) {
                gameScene.debugShowVictory(scenario);
            } else {
                console.error('GameScene not found');
            }
        };
        
        window.debugGameOver = (scenario = 'player') => {
            const gameScene = this.game.scene.getScene('GameScene');
            if (gameScene) {
                gameScene.debugShowGameOver(scenario);
            } else {
                console.error('GameScene not found');
            }
        };
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 68, 68, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Public methods for external control
    pauseGame() {
        if (this.game && this.game.scene.isActive('GameScene')) {
            this.game.scene.pause('GameScene');
        }
    }

    resumeGame() {
        if (this.game && this.game.scene.isPaused('GameScene')) {
            this.game.scene.resume('GameScene');
        }
    }

    restartGame() {
        if (this.game && this.game.scene.isActive('GameScene')) {
            this.game.scene.restart('GameScene');
        }
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {    
    // Check for required dependencies
    if (typeof Phaser === 'undefined') {
        console.error('Phaser.js not loaded');
        document.body.innerHTML = '<div style="text-align: center; color: white; padding: 50px;">Error: Failed to load game engine. Please refresh the page.</div>';
        return;
    }
    
    // Check if all required classes are loaded
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded');
        return;
    }
    
    if (typeof MazeGenerator === 'undefined') {
        console.error('MazeGenerator not loaded');
        return;
    }
    
    if (typeof CollisionSystem === 'undefined') {
        console.error('CollisionSystem not loaded');
        return;
    }
    
    console.log('All dependencies loaded successfully');

    // ✅ NEW: Initialize React wallet UI first
    const walletUIElement = document.getElementById('wallet-ui');
    if (walletUIElement) {
        const root = ReactDOM.createRoot(walletUIElement);
        root.render(
            <DynamicContextProvider settings={{
                environmentId: "9a3fa5a6-b4cd-479e-847a-2ad44088003b",
                walletConnectors: [EthereumWalletConnectors],
            }}>
                <ConnectWallet />
                <DynamicWidget /> 
            </DynamicContextProvider>
        );
    } else {
        console.warn('⚠️ wallet-ui element not found');
    }

    setTimeout(() => {
        // ✅ Initialize the Phaser game
        window.mazeRunner = new MazeRunnerGame();
        
        // Add keyboard shortcuts info
        const instructionsDiv = document.getElementById('instructions');
        if (instructionsDiv) {
            instructionsDiv.innerHTML += '<br>Press L for Leaderboard • Press S for Stats • Press P to Pause';
        }
    }, 100);

});

// Handle page visibility changes for auto-pause
document.addEventListener('visibilitychange', () => {
    if (window.mazeRunner) {
        if (document.hidden) {
            window.mazeRunner.pauseGame();
        }
        // Note: Don't auto-resume, let player manually resume
    }
});

// Export for debugging
window.mazeRunnerGame = MazeRunnerGame;