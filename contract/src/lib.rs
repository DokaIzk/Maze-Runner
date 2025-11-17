use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, Amount, ContractAbi, ServiceAbi, Timestamp},
};
use serde::{Deserialize, Serialize};

pub struct MazeRunnerAbi;

impl ContractAbi for MazeRunnerAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for MazeRunnerAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Operations that can be executed on the contract
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Submit a game score
    SubmitScore {
        score: u64,
        level: u32,
        game_id: String,
    },
    /// Claim a reward for a completed game
    ClaimReward { game_id: String },
    /// Admin: set the reward amount (restricted to application creator)
    AdminSetRewardAmount { amount: Amount },
}

/// Response types for operations
#[derive(Debug, Deserialize, Serialize)]
pub enum OperationResponse {
    Ok,
    RewardClaimed(RewardStatus),
}

/// Cross-chain messages for leaderboard updates
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    LeaderboardUpdate {
        player: AccountOwner,
        score: u64,
        level: u32,
        timestamp: Timestamp,
    },
}

/// Player statistics
#[derive(Debug, Default, Clone, Serialize, Deserialize, SimpleObject)]
pub struct PlayerStats {
    pub high_score: u64,
    pub games_played: u32,
    pub last_played: Option<Timestamp>,
    pub recent_scores: Vec<u64>,
    pub total_rewards_claimed: Amount,
}

/// Game result record
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct GameResult {
    pub score: u64,
    pub level: u32,
    pub timestamp: Timestamp,
    pub game_id: String,
}

/// Reward claim status
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct RewardStatus {
    pub claimed: bool,
    pub claimed_at: Option<Timestamp>,
    pub amount: Amount,
}

/// Leaderboard entry
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct LeaderboardEntry {
    pub player: AccountOwner,
    pub score: u64,
    pub level: u32,
    pub timestamp: Timestamp,
}

/// Contract configuration
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct Config {
    pub reward_amount: Amount,
    pub leaderboard_size: u32,
}
