// Game configuration constants
const CONFIG = {
    // Game dimensions
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Maze settings
    MAZE_WIDTH: 180,    // Wider maze (was 25)
    MAZE_HEIGHT: 120,   // Taller maze (was 12)
    CELL_SIZE: 17,     // Same cell size
    
    // Player settings
    PLAYER_SIZE: 14,   // Larger player (was 13)
    PLAYER_SPEED: 150,
    
    // Game mechanics
    BASE_TIME: 30, // seconds
    TIME_DECREASE_PER_LEVEL: 2,
    MIN_TIME: 10,
    MINI_TKN_TIME_BONUS: 3,
    
    // Scoring
    MAIN_TKN_POINTS: 5,
    MINI_TKN_POINTS: 2,
    TIME_BONUS_MULTIPLIER: 1,
    
    // Cyberpunk Colors
    COLORS: {
        BACKGROUND: 0x0A0A1A,    // Dark blue background
        WALL: 0x00CCFF,         // Neon blue walls
        PATH: 0x0A0A1A,         // Dark floor
        PLAYER: 0x6B7B8C,       // Gray-blue mouse
        MAIN_TKN: 0xFFAA00,     // Orange token
        MINI_TKN: 0x00CCFF,     // Blue token
        UI_PRIMARY: 0x00CCFF,   // Neon blue UI
        UI_SECONDARY: 0xFFAA00  // Orange accents
    },
    
    // Game balance
    DIFFICULTY_SCALING: {
        MAZE_COMPLEXITY_INCREASE: 0.2,
        DEAD_END_RATIO_INCREASE: 0.1,
        MINI_TKN_DECREASE: 1
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
