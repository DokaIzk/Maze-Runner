import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        // Background (optional)
        // this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        // Maze logo (centered, above title)
        this.add.image(width / 2, height * 0.32, 'Vector').setOrigin(0.5).setScale(1);

        // Title
        this.add.text(width / 2, Math.round(height * 0.52), 'Maze Runner', {
            fontFamily: 'Arial Black', fontSize: '48px', color: '#fff',
            stroke: '#000', strokeThickness: 6,
            align: 'center', resolution: 2
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, Math.round(height * 0.60), 'Navigate the network, solve the maze,\nand  earn rewards', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ccc',
            align: 'center', wordWrap: { width: Math.round(width * 0.5) }, resolution: 2
        }).setOrigin(0.5);

        // Connect Wallet button (rounded)
        const connectBtnGraphics = this.add.graphics();
        connectBtnGraphics.fillStyle(0x0a1a56, 1);
        connectBtnGraphics.fillRoundedRect(width / 2 - 160, Math.round(height * 0.75) - 28, 320, 56, 16);
        connectBtnGraphics.lineStyle(2, 0x0a1a56, 1);
        connectBtnGraphics.strokeRoundedRect(width / 2 - 160, Math.round(height * 0.75) - 28, 320, 56, 16);
        const connectBtnText = this.add.text(width / 2, Math.round(height * 0.75), 'Connect Wallet', {
            fontFamily: 'Arial', fontSize: '20px', color: '#fff', align: 'center', resolution: 2
        }).setOrigin(0.5);
        // Add interactive zone for pointer cursor
        const connectBtnZone = this.add.zone(width / 2, Math.round(height * 0.75), 320, 56)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        connectBtnZone.on('pointerdown', () => {
            // TODO: Add wallet connection logic
        });

        // Continue as Guest button (rounded)
        const guestBtnGraphics = this.add.graphics();
        guestBtnGraphics.fillStyle(0xbdbdbd, 1);
        guestBtnGraphics.fillRoundedRect(width / 2 - 160, Math.round(height * 0.85) - 28, 320, 56, 16);
        guestBtnGraphics.lineStyle(2, 0xbdbdbd, 1);
        guestBtnGraphics.strokeRoundedRect(width / 2 - 160, Math.round(height * 0.85) - 28, 320, 56, 16);
        const guestBtnText = this.add.text(width / 2, Math.round(height * 0.85), 'Continue as Guest', {
            fontFamily: 'Arial', fontSize: '20px', color: '#444', align: 'center', resolution: 2
        }).setOrigin(0.5);
        // Add interactive zone for pointer cursor
        const guestBtnZone = this.add.zone(width / 2, Math.round(height * 0.85), 320, 56)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        guestBtnZone.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
