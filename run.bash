#!/usr/bin/env bash

set -eu

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080

if [ ! -f /root/.config/linera/keystore.json ]; then
    linera wallet init --faucet="$LINERA_FAUCET_URL"
else
    echo "Wallet already initialized."
fi

linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Build and publish your backend

# Build and run your frontend, if any
cd /build/public
npm install
npm run dev -- --host 0.0.0.0 --port 5173