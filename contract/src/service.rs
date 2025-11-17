#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{Context, EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, WithServiceAbi},
    views::View,
    Service, ServiceRuntime,
};

use maze_runner::{Config, GameResult, LeaderboardEntry, Operation, PlayerStats, RewardStatus};

use self::state::{MazeRunnerState, PlayerStatsRecord};

pub struct MazeRunnerService {
    state: Arc<MazeRunnerState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(MazeRunnerService);

impl WithServiceAbi for MazeRunnerService {
    type Abi = maze_runner::MazeRunnerAbi;
}

impl Service for MazeRunnerService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MazeRunnerState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MazeRunnerService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        Schema::build(
            QueryRoot,
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .data(self.state.clone())
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get the global leaderboard
    async fn leaderboard(&self, ctx: &Context<'_>, limit: Option<u32>) -> Vec<LeaderboardEntry> {
        let state = ctx.data::<Arc<MazeRunnerState>>().expect("State not found");
        let leaderboard_size = *state.leaderboard_size.get();
        let leaderboard_data = state.leaderboard.get();
        
        let limit = limit.unwrap_or(leaderboard_size) as usize;
        leaderboard_data
            .iter()
            .take(limit)
            .map(|(player, score, level, timestamp)| LeaderboardEntry {
                player: *player,
                score: *score,
                level: *level,
                timestamp: *timestamp,
            })
            .collect()
    }

    /// Get player statistics
    async fn player_stats(&self, ctx: &Context<'_>, player: AccountOwner) -> Option<PlayerStats> {
        let state = ctx.data::<Arc<MazeRunnerState>>().expect("State not found");
        let stats: Option<PlayerStatsRecord> = state.player_stats
            .get(&player)
            .await
            .ok()
            .flatten();

        stats.map(|s| PlayerStats {
            high_score: s.high_score,
            games_played: s.games_played,
            last_played: s.last_played,
            recent_scores: s.recent_scores,
            total_rewards_claimed: s.total_rewards_claimed,
        })
    }

    /// Get game history for a player
    async fn game_history(&self, ctx: &Context<'_>, player: AccountOwner, limit: Option<u32>) -> Vec<GameResult> {
        let state = ctx.data::<Arc<MazeRunnerState>>().expect("State not found");
        let stats: Option<PlayerStatsRecord> = state.player_stats
            .get(&player)
            .await
            .ok()
            .flatten();

        match stats {
            Some(s) => {
                let limit = limit.unwrap_or(10) as usize;
                s.game_history.into_iter().rev().take(limit).collect()
            }
            None => Vec::new(),
        }
    }

    /// Get reward status for a specific game
    async fn reward_status(&self, ctx: &Context<'_>, player: AccountOwner, game_id: String) -> RewardStatus {
        let state = ctx.data::<Arc<MazeRunnerState>>().expect("State not found");
        let reward_amount = *state.reward_amount.get();
        let stats: Option<PlayerStatsRecord> = state.player_stats
            .get(&player)
            .await
            .ok()
            .flatten();

        match stats {
            Some(s) => s.claimed_rewards.get(&game_id).cloned().unwrap_or(RewardStatus {
                claimed: false,
                claimed_at: None,
                amount: reward_amount,
            }),
            None => RewardStatus {
                claimed: false,
                claimed_at: None,
                amount: reward_amount,
            },
        }
    }

    /// Get contract configuration
    async fn config(&self, ctx: &Context<'_>) -> Config {
        let state = ctx.data::<Arc<MazeRunnerState>>().expect("State not found");
        Config {
            reward_amount: *state.reward_amount.get(),
            leaderboard_size: *state.leaderboard_size.get(),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use async_graphql::Request;
    use futures::FutureExt as _;
    use linera_sdk::{
        linera_base_types::Amount,
        util::BlockingWait, 
        views::View, 
        Service, 
        ServiceRuntime
    };

    use super::{MazeRunnerService, MazeRunnerState};

    #[test]
    fn query_config() {
        let runtime = Arc::new(ServiceRuntime::<MazeRunnerService>::new());
        let mut state = MazeRunnerState::load(runtime.root_view_storage_context())
            .blocking_wait()
            .expect("Failed to read from mock key value store");
        
        let reward_amount = Amount::from_tokens(100);
        let leaderboard_size = 10u32;
        
        state.reward_amount.set(reward_amount);
        state.leaderboard_size.set(leaderboard_size);
        state.leaderboard.set(Vec::new());

        let service = MazeRunnerService { 
            state: Arc::new(state), 
            runtime: runtime.clone()
        };
        let request = Request::new("{ config { rewardAmount leaderboardSize } }");

        let response = service
            .handle_query(request)
            .now_or_never()
            .expect("Query should not await anything");

        // Just verify we get a response without errors
        assert!(!response.is_err());
    }
}
