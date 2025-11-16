# MazeRunner Smart Contract Deployment

## Deployment Information

### Network Details
- **Network**: Linera Local Test Network
- **Deployed**: November 16, 2025

### Chain Information

**Primary Chain ID**:
```
6cc084804f164e31243cab1d7ca8dcdcccdd43d1564254855a083c6bcd42c142
```

**Chain Owner**:
```
0xde112e32e5dd0c086c01f984277c302fe1878b35b8ff2b63e21193f2b037359b
```

### Application Details

**Application ID**:
```
e8159aa0ef800de05d2be85e7942afe009fc33f77dea6c8424764f4fa240a5c5
```

**Bytecode Hashes**:
- Contract Bytecode: `1f59151a44ee300b65125fa20f62b47592e3adb67e572a0bb7383d02229cf8ea`
- Service Bytecode: `949f72537fb5310dd95b7f79b1b2f00b366e7c69dd7debc7b298fd228183a910`

**Initial Configuration**:
- Reward Amount: `100000000` (100 tokens)
- Leaderboard Size: `10` entries

## Environment Variables

To interact with this deployment, set the following environment variables:

```bash
export LINERA_WALLET="/tmp/.tmpg72J7o/wallet_0.json"
export LINERA_KEYSTORE="/tmp/.tmpg72J7o/keystore_0.json"
export LINERA_STORAGE="rocksdb:/tmp/.tmpg72J7o/client_0.db"
```

## GraphQL Endpoint

Start the service:
```bash
linera service --port 8080
```

Access the GraphQL playground at:
```
http://localhost:8080/chains/<CHAIN_ID>/applications/<APPLICATION_ID>
```

Full URL:
```
http://localhost:8080/chains/6cc084804f164e31243cab1d7ca8dcdcccdd43d1564254855a083c6bcd42c142/applications/e8159aa0ef800de05d2be85e7942afe009fc33f77dea6c8424764f4fa240a5c5
```

## Available Operations

### Mutations

#### 1. Submit Score
```graphql
mutation {
  submitScore(score: 1500, level: 5, gameId: "game-123")
}
```

#### 2. Claim Reward
```graphql
mutation {
  claimReward(gameId: "game-123") {
    claimed
    claimedAt
    amount
  }
}
```

#### 3. Admin: Set Reward Amount (Creator chain only)
```graphql
mutation {
  adminSetRewardAmount(amount: "200000000")
}
```

### Queries

#### 1. Get Leaderboard
```graphql
query {
  leaderboard(limit: 10) {
    player
    score
    level
    timestamp
  }
}
```

#### 2. Get Player Stats
```graphql
query {
  playerStats(player: "0xYOUR_ADDRESS") {
    highScore
    gamesPlayed
    lastPlayed
    recentScores
    totalRewardsClaimed
  }
}
```

#### 3. Get Game History
```graphql
query {
  gameHistory(player: "0xYOUR_ADDRESS", limit: 10) {
    score
    level
    timestamp
    gameId
  }
}
```

#### 4. Get Reward Status
```graphql
query {
  rewardStatus(player: "0xYOUR_ADDRESS", gameId: "game-123") {
    claimed
    claimedAt
    amount
  }
}
```

#### 5. Get Configuration
```graphql
query {
  config {
    rewardAmount
    leaderboardSize
  }
}
```

## Contract Features

### Implemented Functionality

1. **Score Submission**
   - Records game results on-chain
   - Updates player statistics
   - Maintains game history (last 10 games)
   - Tracks recent scores (last 10)
   - Updates global leaderboard

2. **Reward System**
   - Claim rewards for completed games
   - Duplicate claim prevention
   - Tracks total rewards claimed
   - Configurable reward amounts

3. **Leaderboard**
   - Global top-N leaderboard
   - Sorted by score (descending)
   - Configurable size
   - Cross-chain message support for updates

4. **Player Stats**
   - High score tracking
   - Games played counter
   - Last played timestamp
   - Recent score history
   - Game result history

5. **Admin Functions**
   - Set reward amount (creator chain only)
   - Configure leaderboard size

### State Structure

- **Player Stats**: MapView indexed by AccountOwner
- **Leaderboard**: RegisterView of top scores
- **Reward Config**: RegisterView for reward amount
- **Leaderboard Size**: RegisterView for max entries

## Testing

Run the included tests:
```bash
cargo test
```

Build for WASM:
```bash
cargo build --release --target wasm32-unknown-unknown
```

## Files

- `src/lib.rs` - Type definitions and ABI
- `src/state.rs` - State structure
- `src/contract.rs` - Contract logic
- `src/service.rs` - GraphQL service
- `Cargo.toml` - Dependencies

## Notes

- This deployment is on a **local test network** - data will be lost when the network is stopped
- For production deployment, use a persistent Linera network
- The application creator chain can modify reward amounts
- All timestamps are in Unix time
- Scores and levels are stored as u64 and u32 respectively

## Next Steps

To integrate with your Phaser frontend:

1. Start the Linera service
2. Connect from your JavaScript/React code using GraphQL
3. Use the wallet address from Dynamic SDK as the `player` parameter
4. Call mutations after game completion
5. Query stats and leaderboard for display

## Support

For issues or questions about Linera development:
- Documentation: https://linera.dev
- GitHub: https://github.com/linera-io/linera-protocol
