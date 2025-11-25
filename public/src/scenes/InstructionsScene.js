export default class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionsScene' });
        this.currentStep = 0;
        this.instructionSteps = [
            {
                title: "Welcome to the maze",
                text: "Race against another player through the neon maze. Collect tokens, beat the timer, and claim the rewards first!",
                subtext: "Ready to play? Let's get you started",
                buttonText: "Learn the Moves"
            },
            {
                title: "How to Move",
                text: "Swipe in any direction to navigate the maze. Avoid dead ends, every second counts!",
                buttonText: "Collect Tokens"
            },
            {
                title: "Collect Tokens",
                text: "Tokens appear along your path. The more you collect, the higher your rewards.",
                subtext: "Missed one? Don't worry, another's waiting ahead.",
                buttonText: "Beat the Clock"
            },
            {
                title: "Beat the Clock",
                text: "Finish the maze before time runs out. Exra tokens await speed runners!",
                subtext: "Every second saved is a chance to earn more.",
                buttonText: "Go Earn Rewards"
            },
            {
                title: "Earn & Compete",
                text: "Claim your tokens and prove you're the ultimate runner.",
                subtext: "Your wallet's your key... Connect to start earning.",
                buttonText: "Start Run"
            }
        ];
    }

    preload() {
        // Load the background image
        this.load.image('instructions-bg', 'assets/images/background-vector.png');
    }

    create() {
        // Set solid black background
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add background image (same size as TitleScene logo)
        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'instructions-bg');
        bg.setDisplaySize(280, 250); // Match TitleScene logo size
        bg.setAlpha(0.8); // Make it semi-transparent so text is readable
        bg.setTint(0xFFFFFF);
        
        // Create the instructions UI
        this.createInstructionsUI();
    }

    createInstructionsUI() {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'instructions-overlay';
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
            z-index: 100;
            padding: 60px 20px 40px 20px;
            box-sizing: border-box;
            gap: 40px;
        `;

        // Title at top
        const titleDiv = document.createElement('h1');
        titleDiv.id = 'instruction-title';                                                                                                              
        titleDiv.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 28px;
            font-weight: bold;
            color: #FFFFFF;
            margin: 0;
            text-align: center;
        `;
        titleDiv.textContent = this.instructionSteps[0].title;

        // Content container with bordered box
        const contentBox = document.createElement('div');
        contentBox.id = 'instructions-content-box';
        contentBox.style.cssText = `
            max-width: 500px;
            width: 90%;
            border-radius: 8px;
            padding: 40px 30px;
            text-align: center;
            background: none;
            transition: opacity 0.3s ease;
        `;

        // Main instruction text (red)
        const mainTextDiv = document.createElement('p');
        mainTextDiv.id = 'instruction-main-text';
        mainTextDiv.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 20px;
            color: rgba(212, 15, 2, 1);
            line-height: 1.5;
            margin-bottom: 30px;
            font-weight: 600;
        `;
        mainTextDiv.textContent = this.instructionSteps[0].text;

        // Subtext (white, smaller)
        const subTextDiv = document.createElement('p');
        subTextDiv.id = 'instruction-subtext';
        subTextDiv.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #FFFFFF;
            line-height: 1.6;
            margin: 0;
            transition: opacity 0.3s ease;
        `;
        const currentStep = this.instructionSteps[this.currentStep];
        if (currentStep.subtext) {
            subTextDiv.textContent = currentStep.subtext;
            subTextDiv.style.display = 'block';
        } else {
            subTextDiv.style.display = 'none';
        }


        // Assemble content box
        contentBox.appendChild(mainTextDiv);
        contentBox.appendChild(subTextDiv);

        // Button
        const button = document.createElement('button');
        button.id = 'instruction-button';
        button.textContent = this.instructionSteps[0].buttonText;
        button.style.cssText = `
            background: rgba(212, 15, 2, 1);
            color: #FFFFFF;
            border: none;
            padding: 18px 48px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
            min-width: 280px;
            max-width: 90%;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(212, 15, 2, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });

        button.addEventListener('click', () => {
            this.handleNextStep();
        });

        // Skip button at bottom right
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip';
        skipButton.style.cssText = `
            position: absolute;
            bottom: 40px;
            right: 40px;
            background: transparent;
            color: #FFFFFF;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
            opacity: 0.7;
        `;

        skipButton.addEventListener('mouseenter', () => {
            skipButton.style.opacity = '1';
        });

        skipButton.addEventListener('mouseleave', () => {
            skipButton.style.opacity = '0.7';
        });

        skipButton.addEventListener('click', () => {
            this.goToMazeCreation();
        });

        // Assemble the UI
        overlay.appendChild(titleDiv);
        overlay.appendChild(contentBox);
        overlay.appendChild(button);
        overlay.appendChild(skipButton);

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        // Store references
        this.overlay = overlay;
        this.titleDiv = titleDiv;
        this.mainTextDiv = mainTextDiv;
        this.subTextDiv = subTextDiv;
        // this.progressDiv = progressDiv;
        this.button = button;
        this.contentBox = contentBox;
    }

    handleNextStep() {
        if (this.currentStep < this.instructionSteps.length - 1) {
            // Move to next step
            this.currentStep++;
            this.updateInstructions();
        } else {
            // Last step - go to maze creation
            this.goToMazeCreation();
        }
    }

    updateInstructions() {
        const step = this.instructionSteps[this.currentStep];

        // Fade out effect
        this.contentBox.style.opacity = '0';

        setTimeout(() => {
            // Update content
            this.titleDiv.textContent = step.title;
            this.mainTextDiv.textContent = step.text;
            this.button.textContent = step.buttonText;

            if (step.subtext) {
                this.subTextDiv.textContent = step.subtext;
                this.subTextDiv.style.display = 'block';
            } else {
                this.subTextDiv.style.display = 'none';
            }

            // Fade in effect
            this.contentBox.style.opacity = '1';
        }, 300);
    }

    goToMazeCreation() {
        // Remove instructions overlay
        const instructionsOverlay = document.getElementById('instructions-overlay');
        if (instructionsOverlay) {
            instructionsOverlay.style.transition = 'opacity 0.5s ease';
            instructionsOverlay.style.opacity = '0';
            
            setTimeout(() => {
                instructionsOverlay.remove();
                // Transition to maze creation scene
                this.scene.start('MazeCreationScene');
            }, 500);
        } else {
            this.scene.start('MazeCreationScene');
        }
    }
}
