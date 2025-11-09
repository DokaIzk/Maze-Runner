// Collision detection utilities
class CollisionSystem {
    static checkWallCollision(x, y, width, height, collisionGrid, cellSize, mazeGrid = null) {
        // x, y are CENTER positions from Phaser
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        // Calculate the grid cells this object occupies
        const left = Math.floor((x - halfWidth) / cellSize);
        const right = Math.floor((x + halfWidth - 1) / cellSize);
        const top = Math.floor((y - halfHeight) / cellSize);
        const bottom = Math.floor((y + halfHeight - 1) / cellSize);

        // Check bounds
        if (left < 0 || right >= collisionGrid[0].length || 
            top < 0 || bottom >= collisionGrid.length) {
            return true; // Collision with boundary
        }

        // If we have maze grid, check walls between cells
        if (mazeGrid) {
            // Get the center cell
            const centerX = Math.floor(x / cellSize);
            const centerY = Math.floor(y / cellSize);
            
            // Check if we're crossing into adjacent cells and hitting walls
            if (centerX >= 0 && centerX < mazeGrid[0].length && 
                centerY >= 0 && centerY < mazeGrid.length) {
                
                const currentCell = mazeGrid[centerY][centerX];
                
                // Check left wall
                if (left < centerX && currentCell.walls.left) {
                    return true;
                }
                // Check right wall
                if (right > centerX && currentCell.walls.right) {
                    return true;
                }
                // Check top wall
                if (top < centerY && currentCell.walls.top) {
                    return true;
                }
                // Check bottom wall
                if (bottom > centerY && currentCell.walls.bottom) {
                    return true;
                }
            }
        }

        return false; // No collision
    }

    static checkPointCollision(x1, y1, x2, y2, threshold = 20) {
        const distance = Math.sqrt(
            Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
        );
        return distance < threshold;
    }

    static checkRectangleCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static resolveWallCollision(player, newX, newY, collisionGrid, cellSize) {
        const playerSize = player.displayWidth;
        
        // Try X movement only
        if (!this.checkWallCollision(newX, player.y, playerSize, playerSize, collisionGrid, cellSize)) {
            return { x: newX, y: player.y };
        }
        
        // Try Y movement only
        if (!this.checkWallCollision(player.x, newY, playerSize, playerSize, collisionGrid, cellSize)) {
            return { x: player.x, y: newY };
        }
        
        // No movement possible
        return { x: player.x, y: player.y };
    }

    static getValidMovePosition(currentX, currentY, deltaX, deltaY, width, height, collisionGrid, cellSize, mazeGrid = null) {
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;

        // Check if new position is valid
        if (!this.checkWallCollision(newX, newY, width, height, collisionGrid, cellSize, mazeGrid)) {
            return { x: newX, y: newY, moved: true };
        }

        // Try sliding along walls
        // Try X movement only
        if (!this.checkWallCollision(newX, currentY, width, height, collisionGrid, cellSize, mazeGrid)) {
            return { x: newX, y: currentY, moved: true };
        }

        // Try Y movement only
        if (!this.checkWallCollision(currentX, newY, width, height, collisionGrid, cellSize, mazeGrid)) {
            return { x: currentX, y: newY, moved: true };
        }

        // No valid movement
        return { x: currentX, y: currentY, moved: false };
    }

    static findNearestWalkablePosition(targetX, targetY, collisionGrid, cellSize, searchRadius = 3) {
        const gridX = Math.floor(targetX / cellSize);
        const gridY = Math.floor(targetY / cellSize);

        // Check the target position first
        if (gridX >= 0 && gridX < collisionGrid[0].length &&
            gridY >= 0 && gridY < collisionGrid.length &&
            collisionGrid[gridY][gridX] === 0) {
            return { x: targetX, y: targetY };
        }

        // Spiral search outward
        for (let radius = 1; radius <= searchRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const checkX = gridX + dx;
                        const checkY = gridY + dy;

                        if (checkX >= 0 && checkX < collisionGrid[0].length &&
                            checkY >= 0 && checkY < collisionGrid.length &&
                            collisionGrid[checkY][checkX] === 0) {
                            return {
                                x: checkX * cellSize + cellSize / 2,
                                y: checkY * cellSize + cellSize / 2
                            };
                        }
                    }
                }
            }
        }

        // Fallback to original position
        return { x: targetX, y: targetY };
    }

    static isPositionWalkable(x, y, collisionGrid, cellSize) {
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        if (gridX < 0 || gridX >= collisionGrid[0].length ||
            gridY < 0 || gridY >= collisionGrid.length) {
            return false;
        }

        return collisionGrid[gridY][gridX] === 0;
    }

    static getGridPosition(worldX, worldY, cellSize) {
        return {
            x: Math.floor(worldX / cellSize),
            y: Math.floor(worldY / cellSize)
        };
    }

    static getWorldPosition(gridX, gridY, cellSize) {
        return {
            x: gridX * cellSize + cellSize / 2,
            y: gridY * cellSize + cellSize / 2
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSystem;
}
