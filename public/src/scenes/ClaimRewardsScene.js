export default class ClaimRewardsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClaimRewardsScene' });
    }

    create() {
        // Create a semi-transparent overlay
        const overlay = document.createElement('div');
        overlay.id = 'claim-reward-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'black';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        // Coin image
        const coinImg = document.createElement('img');
        coinImg.src = 'assets/images/coin.png'; // Update path as needed
        coinImg.alt = 'Coin';
        coinImg.style.width = '138px';
        coinImg.style.height = '174px';
        coinImg.style.marginBottom = '32px';
        coinImg.style.marginTop = '0';
        overlay.appendChild(coinImg);

        // Claiming text
        const claimText = document.createElement('div');
        claimText.innerHTML = `<div style="font-size: 22px; color: #fff; font-weight: bold; margin-bottom: 8px; text-align: center;">Claiming your tokens...</div>
        <div style="font-size: 16px; color: #ccc; margin-bottom: 32px; text-align: center;">This may take a few seconds.<br>Don't close the app.</div>`;
        overlay.appendChild(claimText);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.border = '2px solid rgba(212, 15, 2, 1)';
        cancelBtn.style.padding = '16px 0';
        cancelBtn.style.fontSize = '18px';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.borderRadius = '8px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.width = '320px';
        cancelBtn.style.maxWidth = '90vw';
        cancelBtn.style.transition = 'all 0.3s ease';
        cancelBtn.style.fontFamily = 'Arial, sans-serif';
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(212, 15, 2, 1)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'transparent';
        });
        cancelBtn.onclick = () => {
            overlay.remove();
            if (this.scene && this.scene.isActive('GameScene')) {
                this.scene.stop('ClaimRewardsScene');
            }
        };
        overlay.appendChild(cancelBtn);

        document.body.appendChild(overlay);
    }

    shutdown() {
        const overlay = document.getElementById('claim-reward-overlay');
        if (overlay) overlay.remove();
    }
}