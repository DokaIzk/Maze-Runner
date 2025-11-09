// UI Scene - Handles user interface overlays and menus
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        
        this.leaderboardVisible = false;
        this.statsVisible = false;
    }

    create() {
        console.log('UIScene: Initializing UI');
        
        // Setup UI controls
        this.setupUIControls();
        
        // Initialize leaderboard updates
        this.setupLeaderboardUpdates();
    }

    setupUIControls() {
        // Setup wallet button functionality
        const walletButton = document.getElementById('wallet-button');
        if (walletButton && window.stacksAPI) {
            walletButton.onclick = () => {
                if (window.stacksAPI.isWalletConnected) {
                    window.stacksAPI.disconnectWallet();
                } else {
                    window.stacksAPI.connectWallet();
                }
            };
        }

        // Add keyboard shortcuts for UI
        this.input.keyboard.on('keydown-L', () => {
            this.toggleLeaderboard();
        });

        this.input.keyboard.on('keydown-S', () => {
            this.toggleStats();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.hideAllPanels();
        });
    }

    setupLeaderboardUpdates() {
        // Update leaderboard periodically
        this.time.addEvent({
            delay: 30000, // 30 seconds
            callback: this.updateLeaderboard,
            callbackScope: this,
            loop: true
        });

        // Initial leaderboard load
        this.updateLeaderboard();
    }

    async updateLeaderboard() {
        if (!window.contractCalls) return;

        try {
            const topPlayers = await window.contractCalls.getTopPlayers();
            this.displayLeaderboard(topPlayers);
        } catch (error) {
            console.warn('Could not update leaderboard:', error);
        }
    }

    displayLeaderboard(players) {
        // Create or update leaderboard display
        let leaderboardPanel = document.getElementById('leaderboard-panel');
        
        if (!leaderboardPanel) {
            leaderboardPanel = this.createLeaderboardPanel();
        }

        const leaderboardList = leaderboardPanel.querySelector('.leaderboard-list');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';

            if (players && players.length > 0) {
                players.forEach((player, index) => {
                    if (player && player.player && player.score) {
                        const listItem = document.createElement('div');
                        listItem.className = 'leaderboard-item';
                        listItem.innerHTML = `
                            <span class="rank">${index + 1}</span>
                            <span class="address">${window.stacksAPI.formatAddress(player.player)}</span>
                            <span class="score">${player.score}</span>
                        `;
                        leaderboardList.appendChild(listItem);
                    }
                });
            } else {
                leaderboardList.innerHTML = '<div class="no-data">No scores yet</div>';
            }
        }
    }

    createLeaderboardPanel() {
        const panel = document.createElement('div');
        panel.id = 'leaderboard-panel';
        panel.className = 'ui-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 200;
        `;

        panel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #00ff88; text-align: center;">🏆 Leaderboard</h3>
            <div class="leaderboard-list" style="max-height: 300px; overflow-y: auto;">
                <div class="loading">Loading...</div>
            </div>
            <button class="close-btn" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #ff4444;
                font-size: 20px;
                cursor: pointer;
            ">×</button>
        `;

        // Add styles for leaderboard items
        const style = document.createElement('style');
        style.textContent = `
            .leaderboard-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #333;
            }
            .leaderboard-item:last-child {
                border-bottom: none;
            }
            .leaderboard-item .rank {
                color: #00ccff;
                font-weight: bold;
                width: 30px;
            }
            .leaderboard-item .address {
                flex: 1;
                font-family: monospace;
                font-size: 12px;
                margin: 0 10px;
            }
            .leaderboard-item .score {
                color: #00ff88;
                font-weight: bold;
            }
            .no-data {
                text-align: center;
                color: #888;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);

        // Add close button functionality
        const closeBtn = panel.querySelector('.close-btn');
        closeBtn.onclick = () => this.hideLeaderboard();

        document.body.appendChild(panel);
        return panel;
    }

    createStatsPanel() {
        const panel = document.createElement('div');
        panel.id = 'stats-panel';
        panel.className = 'ui-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 280px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ccff;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 200;
        `;

        panel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #00ccff; text-align: center;">📊 Your Stats</h3>
            <div class="stats-content">
                <div class="stat-item">
                    <span class="label">High Score:</span>
                    <span class="value" id="user-high-score">-</span>
                </div>
                <div class="stat-item">
                    <span class="label">Games Played:</span>
                    <span class="value" id="user-games-played">-</span>
                </div>
                <div class="stat-item">
                    <span class="label">Global Rank:</span>
                    <span class="value" id="user-rank">-</span>
                </div>
                <div class="stat-item">
                    <span class="label">Wallet:</span>
                    <span class="value wallet-address" id="user-address">Not connected</span>
                </div>
            </div>
            <button class="close-btn" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #ff4444;
                font-size: 20px;
                cursor: pointer;
            ">×</button>
        `;

        // Add styles for stats items
        const style = document.createElement('style');
        style.textContent = `
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #333;
            }
            .stat-item:last-child {
                border-bottom: none;
            }
            .stat-item .label {
                color: #ccc;
            }
            .stat-item .value {
                color: #00ccff;
                font-weight: bold;
            }
            .wallet-address {
                font-family: monospace;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);

        // Add close button functionality
        const closeBtn = panel.querySelector('.close-btn');
        closeBtn.onclick = () => this.hideStats();

        document.body.appendChild(panel);
        return panel;
    }

    async updatePlayerStats() {
        if (!window.contractCalls || !window.stacksAPI.isWalletConnected) {
            return;
        }

        try {
            const stats = await window.contractCalls.getPlayerStats();
            const rank = await window.contractCalls.getPlayerRank();

            document.getElementById('user-high-score').textContent = stats.score || 0;
            document.getElementById('user-games-played').textContent = stats['games-played'] || 0;
            document.getElementById('user-rank').textContent = rank || 'Unranked';
            document.getElementById('user-address').textContent = 
                window.stacksAPI.formatAddress(window.stacksAPI.userAddress);
        } catch (error) {
            console.warn('Could not update player stats:', error);
        }
    }

    toggleLeaderboard() {
        const panel = document.getElementById('leaderboard-panel') || this.createLeaderboardPanel();
        
        if (this.leaderboardVisible) {
            this.hideLeaderboard();
        } else {
            this.showLeaderboard();
        }
    }

    showLeaderboard() {
        const panel = document.getElementById('leaderboard-panel') || this.createLeaderboardPanel();
        panel.style.display = 'block';
        this.leaderboardVisible = true;
        this.updateLeaderboard();
    }

    hideLeaderboard() {
        const panel = document.getElementById('leaderboard-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        this.leaderboardVisible = false;
    }

    toggleStats() {
        const panel = document.getElementById('stats-panel') || this.createStatsPanel();
        
        if (this.statsVisible) {
            this.hideStats();
        } else {
            this.showStats();
        }
    }

    showStats() {
        const panel = document.getElementById('stats-panel') || this.createStatsPanel();
        panel.style.display = 'block';
        this.statsVisible = true;
        this.updatePlayerStats();
    }

    hideStats() {
        const panel = document.getElementById('stats-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        this.statsVisible = false;
    }

    hideAllPanels() {
        this.hideLeaderboard();
        this.hideStats();
    }

    // Add notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.background = 'rgba(0, 255, 136, 0.9)';
                notification.style.color = 'black';
                break;
            case 'error':
                notification.style.background = 'rgba(255, 68, 68, 0.9)';
                break;
            case 'warning':
                notification.style.background = 'rgba(255, 170, 0, 0.9)';
                notification.style.color = 'black';
                break;
            default:
                notification.style.background = 'rgba(0, 204, 255, 0.9)';
                notification.style.color = 'black';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }
}

// Add CSS animations
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
        }
        to {
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
        }
        to {
            transform: translateX(-50%) translateY(-100%);
        }
    }
`;
document.head.appendChild(animationStyle);
