// Maze generation utility using recursive backtracking algorithm
class MazeGenerator {
    constructor(width, height, removeWallsRatio = 0) {
        this.width = width;
        this.height = height;
        this.removeWallsRatio = removeWallsRatio; // 0 = complex, higher = simpler
        this.grid = [];
        this.initialize();
    }

    initialize() {
        // Create grid filled with walls
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = {
                    x: x,
                    y: y,
                    walls: {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true
                    },
                    visited: false
                };
            }
        }
    }

    generate() {
        const stack = [];
        let current = this.grid[0][0];
        current.visited = true;

        while (true) {
            const next = this.getRandomUnvisitedNeighbor(current);
            
            if (next) {
                stack.push(current);
                this.removeWallBetween(current, next);
                next.visited = true;
                current = next;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }

        // For simpler mazes, remove additional walls to create more open paths
        if (this.removeWallsRatio > 0) {
            this.removeAdditionalWalls(this.removeWallsRatio);
        }

        return this.grid;
    }

    removeAdditionalWalls(ratio) {
        // Remove a percentage of walls to make maze simpler
        const totalCells = this.width * this.height;
        const wallsToRemove = Math.floor(totalCells * ratio);
        
        for (let i = 0; i < wallsToRemove; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const cell = this.grid[y][x];
            
            // Try to remove a random wall
            const walls = ['top', 'right', 'bottom', 'left'];
            const randomWall = walls[Math.floor(Math.random() * walls.length)];
            
            // Remove wall if it exists and has a neighbor
            if (cell.walls[randomWall]) {
                const neighbor = this.getNeighborInDirection(cell, randomWall);
                if (neighbor) {
                    this.removeWallBetween(cell, neighbor);
                }
            }
        }
    }

    getNeighborInDirection(cell, direction) {
        const { x, y } = cell;
        
        switch(direction) {
            case 'top':
                return y > 0 ? this.grid[y - 1][x] : null;
            case 'right':
                return x < this.width - 1 ? this.grid[y][x + 1] : null;
            case 'bottom':
                return y < this.height - 1 ? this.grid[y + 1][x] : null;
            case 'left':
                return x > 0 ? this.grid[y][x - 1] : null;
            default:
                return null;
        }
    }

    getRandomUnvisitedNeighbor(cell) {
        const neighbors = [];
        const { x, y } = cell;

        // Check all four directions
        if (y > 0 && !this.grid[y - 1][x].visited) {
            neighbors.push(this.grid[y - 1][x]); // Top
        }
        if (x < this.width - 1 && !this.grid[y][x + 1].visited) {
            neighbors.push(this.grid[y][x + 1]); // Right
        }
        if (y < this.height - 1 && !this.grid[y + 1][x].visited) {
            neighbors.push(this.grid[y + 1][x]); // Bottom
        }
        if (x > 0 && !this.grid[y][x - 1].visited) {
            neighbors.push(this.grid[y][x - 1]); // Left
        }

        return neighbors.length > 0 ? 
            neighbors[Math.floor(Math.random() * neighbors.length)] : 
            null;
    }

    removeWallBetween(current, next) {
        const dx = current.x - next.x;
        const dy = current.y - next.y;

        if (dx === 1) {
            // Current is to the right of next
            current.walls.left = false;
            next.walls.right = false;
        } else if (dx === -1) {
            // Current is to the left of next
            current.walls.right = false;
            next.walls.left = false;
        } else if (dy === 1) {
            // Current is below next
            current.walls.top = false;
            next.walls.bottom = false;
        } else if (dy === -1) {
            // Current is above next
            current.walls.bottom = false;
            next.walls.top = false;
        }
    }

    // Convert maze to simple 2D array for collision detection
    toCollisionGrid() {
        // Return a simple grid where all cells are walkable
        // Wall checking will be done by the collision system using the maze grid
        const collisionGrid = [];
        
        for (let y = 0; y < this.height; y++) {
            collisionGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                // All cells are walkable (0)
                collisionGrid[y][x] = 0;
            }
        }

        return collisionGrid;
    }

    // Get random empty position for placing items
    getRandomEmptyPosition(collisionGrid) {
        const emptyPositions = [];
        
        for (let y = 0; y < collisionGrid.length; y++) {
            for (let x = 0; x < collisionGrid[y].length; x++) {
                if (collisionGrid[y][x] === 0) {
                    emptyPositions.push({ x, y });
                }
            }
        }

        return emptyPositions.length > 0 ? 
            emptyPositions[Math.floor(Math.random() * emptyPositions.length)] : 
            { x: 1, y: 1 };
    }

    // Find path from start to end (for ensuring solvability)
    findPath(start, end, collisionGrid) {
        // Simple breadth-first search
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (current.x === end.x && current.y === end.y) {
                return current.path.length;
            }

            // Check all four directions
            const directions = [
                { dx: 0, dy: -1 }, // Up
                { dx: 1, dy: 0 },  // Right
                { dx: 0, dy: 1 },  // Down
                { dx: -1, dy: 0 }  // Left
            ];

            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;

                if (newX >= 0 && newX < collisionGrid[0].length &&
                    newY >= 0 && newY < collisionGrid.length &&
                    collisionGrid[newY][newX] === 0) {
                    
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }]
                    });
                }
            }
        }

        return -1; // No path found
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGenerator;
}
