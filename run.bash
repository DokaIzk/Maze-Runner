#!/usr/bin/env bash

# set -eu

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080

if [ ! -f /root/.config/linera/keystore.json ]; then
    linera wallet init --faucet="$LINERA_FAUCET_URL"
else
    echo "Wallet already initialized."
fi

# Request a new chain and capture its ID
CHAIN_ID=$(linera wallet request-chain --faucet="$LINERA_FAUCET_URL" | tail -n 1)

# Build and publish your backend
cd /build/contract
cargo build --release --target wasm32-unknown-unknown

# Publish contract and capture output
PUBLISH_OUTPUT=$(linera publish-and-create --json-argument '["100",10]' target/wasm32-unknown-unknown/release/maze_runner_contract.wasm target/wasm32-unknown-unknown/release/maze_runner_service.wasm 2>&1)

echo "DEBUG: PUBLISH_OUTPUT=$PUBLISH_OUTPUT"

# Extract chain and application IDs from output
PUBLISH_CHAIN_ID=$(echo "$PUBLISH_OUTPUT" | grep -oP 'application on chain \K[0-9a-f]+')
APPLICATION_ID=$(echo "$PUBLISH_OUTPUT" | tail -n 1)

# Write valid deployment.json for frontend
echo "{\"chain_id\":\"$PUBLISH_CHAIN_ID\",\"application_id\":\"$APPLICATION_ID\"}" > /build/public/deployment.json

# Build and run your frontend, if any
cd /build/public
npm install
npm run dev -- --host 0.0.0.0 --port 5173

tail -f /dev/null