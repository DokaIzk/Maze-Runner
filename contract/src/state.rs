use linera_sdk::{
    linera_base_types::{AccountOwner, Amount, Timestamp},
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::{GameResult, RewardStatus};

/// Player statistics stored per owner
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct PlayerStatsRecord {
    pub high_score: u64,
    pub games_played: u32,
    pub last_played: Option<Timestamp>,
    pub recent_scores: Vec<u64>,
    pub total_rewards_claimed: Amount,
    pub game_history: Vec<GameResult>,
    pub claimed_rewards: BTreeMap<String, RewardStatus>,
}

/// Main application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MazeRunnerState {
    /// Player stats indexed by owner
    pub player_stats: MapView<AccountOwner, PlayerStatsRecord>,

    /// Global leaderboard entries (stored as vec for simplicity)
    pub leaderboard: RegisterView<Vec<(AccountOwner, u64, u32, Timestamp)>>,
    /// Configurable reward amount
    pub reward_amount: RegisterView<Amount>,

    /// Maximum leaderboard size
    pub leaderboard_size: RegisterView<u32>,
}
