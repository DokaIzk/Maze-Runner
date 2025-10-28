import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
    }

    create ()
    {
        // Add the background image and resize it to fill the screen
        // const bg = this.add.image(0, 0, 'background').setOrigin(0);
        // bg.displayWidth = this.sys.game.config.width;
        // bg.displayHeight = this.sys.game.config.height;

        this.scene.start('Preloader');
    }
}
