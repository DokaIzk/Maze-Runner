#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{AccountOwner, Amount, Timestamp, WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
};

use maze_runner::{GameResult, Message, Operation, OperationResponse, RewardStatus};

use self::state::MazeRunnerState;

pub struct MazeRunnerContract {
    state: MazeRunnerState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MazeRunnerContract);

impl WithContractAbi for MazeRunnerContract {
    type Abi = maze_runner::MazeRunnerAbi;
}

impl Contract for MazeRunnerContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = (Amount, u32); // (reward_amount, leaderboard_size)
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MazeRunnerState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MazeRunnerContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        let (reward_amount, leaderboard_size) = argument;
        self.state.reward_amount.set(reward_amount);
        self.state.leaderboard_size.set(leaderboard_size);
        self.state.leaderboard.set(Vec::new());
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::SubmitScore {
                score,
                level,
                game_id,
            } => {
                self.submit_score(score, level, game_id).await;
                OperationResponse::Ok
            }
            Operation::ClaimReward { game_id } => {
                let status = self.claim_reward(game_id).await;
                OperationResponse::RewardClaimed(status)
            }
            Operation::AdminSetRewardAmount { amount } => {
                self.admin_set_reward_amount(amount).await;
                OperationResponse::Ok
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::LeaderboardUpdate {
                player,
                score,
                level,
                timestamp,
            } => {
                self.update_leaderboard(player, score, level, timestamp)
                    .await;
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl MazeRunnerContract {
    /// Submit a score and update player stats
    async fn submit_score(&mut self, score: u64, level: u32, game_id: String) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Operation must be authenticated");
        let now = self.runtime.system_time();

        // Load or create player stats
        let mut stats = self
            .state
            .player_stats
            .get(&player)
            .await
            .expect("Failed to load player stats")
            .unwrap_or_default();

        // Update stats
        stats.high_score = stats.high_score.max(score);
        stats.games_played += 1;
        stats.last_played = Some(now);

        // Update recent scores (keep last 10)
        stats.recent_scores.push(score);
        if stats.recent_scores.len() > 10 {
            stats.recent_scores.remove(0);
        }

        // Add to game history (keep last 10)
        stats.game_history.push(GameResult {
            score,
            level,
            timestamp: now,
            game_id: game_id.clone(),
        });
        if stats.game_history.len() > 10 {
            stats.game_history.remove(0);
        }

        // Save updated stats
        self.state
            .player_stats
            .insert(&player, stats)
            .expect("Failed to save player stats");

        // Send cross-chain message to update global leaderboard
        // In a multi-chain setup, this would go to the root chain
        // For now, we update locally
        self.update_leaderboard(player, score, level, now).await;
    }

    /// Claim a reward for a completed game
    async fn claim_reward(&mut self, game_id: String) -> RewardStatus {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Operation must be authenticated");
        let now = self.runtime.system_time();

        // Load player stats
        let mut stats = self
            .state
            .player_stats
            .get(&player)
            .await
            .expect("Failed to load player stats")
            .unwrap_or_default();

        // Check if already claimed
        if let Some(status) = stats.claimed_rewards.get(&game_id) {
            return status.clone();
        }

        // Get reward amount
        let reward_amount = *self.state.reward_amount.get();

        // Create reward status
        let status = RewardStatus {
            claimed: true,
            claimed_at: Some(now),
            amount: reward_amount,
        };

        // Update stats
        stats
            .claimed_rewards
            .insert(game_id.clone(), status.clone());
        stats.total_rewards_claimed = stats.total_rewards_claimed.saturating_add(reward_amount);

        // Save updated stats
        self.state
            .player_stats
            .insert(&player, stats)
            .expect("Failed to save player stats");

        // TODO: Integrate with Linera token system to actually transfer tokens
        // For now, we just track the reward in state

        status
    }

    /// Admin operation to set reward amount
    async fn admin_set_reward_amount(&mut self, amount: Amount) {
        let creator_chain = self.runtime.application_creator_chain_id();
        let current_chain = self.runtime.chain_id();

        // Only allow operations from the creator chain
        assert_eq!(
            current_chain, creator_chain,
            "Only the application creator chain can set reward amount"
        );

        self.state.reward_amount.set(amount);
    }

    /// Update the global leaderboard
    async fn update_leaderboard(
        &mut self,
        player: AccountOwner,
        score: u64,
        level: u32,
        timestamp: Timestamp,
    ) {
        let mut leaderboard = self.state.leaderboard.get().clone();

        // Add new entry
        leaderboard.push((player, score, level, timestamp));

        // Sort by score descending
        leaderboard.sort_by(|a, b| b.1.cmp(&a.1));

        // Keep only top N entries
        let max_size = *self.state.leaderboard_size.get() as usize;

        if leaderboard.len() > max_size {
            leaderboard.truncate(max_size);
        }

        self.state.leaderboard.set(leaderboard);
    }
}

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{
        linera_base_types::Amount, util::BlockingWait, views::View, Contract, ContractRuntime,
    };

    use super::{MazeRunnerContract, MazeRunnerState};

    #[test]
    fn instantiate_contract() {
        let reward_amount = Amount::from_tokens(100);
        let leaderboard_size = 10u32;
        let app = create_and_instantiate_app((reward_amount, leaderboard_size));

        assert_eq!(*app.state.reward_amount.get(), reward_amount);
        assert_eq!(*app.state.leaderboard_size.get(), leaderboard_size);
    }

    fn create_and_instantiate_app(argument: (Amount, u32)) -> MazeRunnerContract {
        let runtime = ContractRuntime::new().with_application_parameters(());
        let mut contract = MazeRunnerContract {
            state: MazeRunnerState::load(runtime.root_view_storage_context())
                .blocking_wait()
                .expect("Failed to read from mock key value store"),
            runtime,
        };

        contract
            .instantiate(argument)
            .now_or_never()
            .expect("Initialization of application state should not await anything");

        contract
    }
}
