const GRAPHQL_URL = "http://localhost:8080/chains/6cc084804f164e31243cab1d7ca8dcdcccdd43d1564254855a083c6bcd42c142/applications/e8159aa0ef800de05d2be85e7942afe009fc33f77dea6c8424764f4fa240a5c5";

async function graphqlRequest(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables })
    });
    const data = await res.json();
    if (data.errors) throw new Error(JSON.stringify(data.errors));
    return data.data;
}

export async function submitScore(score, level, gameId) {
    const query = `mutation SubmitScore($score: Int!, $level: Int!, $gameId: String!) {\n  submitScore(score: $score, level: $level, gameId: $gameId)\n}`;
    return graphqlRequest(query, { score, level, gameId });
}

export async function claimReward(gameId) {
    const query = `mutation ClaimReward($gameId: String!) {\n  claimReward(gameId: $gameId) {\n    claimed\n    claimedAt\n    amount\n  }\n}`;
    return graphqlRequest(query, { gameId });
}

export async function getLeaderboard(limit = 10) {
    const query = `query GetLeaderboard($limit: Int!) {\n  leaderboard(limit: $limit) {\n    player\n    score\n    level\n    timestamp\n  }\n}`;
    return graphqlRequest(query, { limit });
}

export async function getPlayerStats(player) {
    const query = `query GetPlayerStats($player: String!) {\n  playerStats(player: $player) {\n    highScore\n    gamesPlayed\n    lastPlayed\n    recentScores\n    totalRewardsClaimed\n  }\n}`;
    return graphqlRequest(query, { player });
}

export async function getGameHistory(player, limit = 10) {
    const query = `query GetGameHistory($player: String!, $limit: Int!) {\n  gameHistory(player: $player, limit: $limit) {\n    score\n    level\n    timestamp\n    gameId\n  }\n}`;
    return graphqlRequest(query, { player, limit });
}

export async function getRewardStatus(player, gameId) {
    const query = `query GetRewardStatus($player: String!, $gameId: String!) {\n  rewardStatus(player: $player, gameId: $gameId) {\n    claimed\n    claimedAt\n    amount\n  }\n}`;
    return graphqlRequest(query, { player, gameId });
}

export async function getConfig() {
    const query = `query {\n  config {\n    rewardAmount\n    leaderboardSize\n  }\n}`;
    return graphqlRequest(query);
}

export async function adminSetRewardAmount(amount) {
    const query = `mutation AdminSetRewardAmount($amount: String!) {\n  adminSetRewardAmount(amount: $amount)\n}`;
    return graphqlRequest(query, { amount });
}
