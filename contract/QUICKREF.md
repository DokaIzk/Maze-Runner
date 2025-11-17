# Quick Reference

## Chain ID

```
6cc084804f164e31243cab1d7ca8dcdcccdd43d1564254855a083c6bcd42c142
```

## Application ID

```
e8159aa0ef800de05d2be85e7942afe009fc33f77dea6c8424764f4fa240a5c5
```

## GraphQL URL

```
http://localhost:8080/chains/6cc084804f164e31243cab1d7ca8dcdcccdd43d1564254855a083c6bcd42c142/applications/e8159aa0ef800de05d2be85e7942afe009fc33f77dea6c8424764f4fa240a5c5
```

## Start Service

```bash
export LINERA_WALLET="/tmp/.tmpg72J7o/wallet_0.json"
export LINERA_KEYSTORE="/tmp/.tmpg72J7o/keystore_0.json"
export LINERA_STORAGE="rocksdb:/tmp/.tmpg72J7o/client_0.db"
linera service --port 8080
```

## Test Mutation

```graphql
mutation {
  submitScore(score: 1000, level: 1, gameId: "test-1")
}
```

## Test Query

```graphql
query {
  config {
    rewardAmount
    leaderboardSize
  }
}
```
