import Phaser from 'phaser';
import { Boot } from './game/scenes/Boot';
import { Preloader } from './game/scenes/Preloader';
import { MainMenu } from './game/scenes/MainMenu';
// ...import other scenes as needed...

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    scene: [Boot, Preloader, MainMenu]
    // ...other config options...
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});