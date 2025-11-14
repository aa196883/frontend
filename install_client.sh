#!/usr/bin/env bash
set -euo pipefail

function log_section() {
    echo "=================="
    echo "$1"
    echo "=================="
}

function require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        return 1
    fi
    return 0
}

function verify_preconditions() {
    local missing=0

    if [[ ! -d "assets" ]]; then
        echo "Expected assets directory to exist in $(pwd)" >&2
        missing=1
    fi

    require_command git || missing=1
    require_command npm || missing=1

    return $missing
}

if [[ "${1:-}" == "--verify" ]]; then
    if verify_preconditions; then
        echo "install_client.sh: preconditions satisfied."
        exit 0
    fi
    exit 1
fi

verify_preconditions

# This script will download the vueJS client from the gitlab, build it, and put the files in the right place for the production.

#---Get the repo
log_section "Getting the client"

cd assets/

if [[ -d "client/" ]]; then
    echo "Already cloned. Getting the last updates from main ..."
    cd client/
    git checkout main
    git pull

else
    git clone --depth=1 https://gitlab.inria.fr/skrid/client.git
    cd client/
fi

#---Install the dependencies
log_section "Installing the dependencies"

npm install

#---Build the vue client
log_section "Building the vueJS app"

rm -rf build/*
npm run build

#---Clean the installation folder, just in case
log_section "Moving the files"

cd ..
rm -rf vuejs/*

#---Move the files
mv client/build/* vuejs/

#---Copy the .env file
cp ../.env vuejs/ || echo "Missing .env file in the frontend repo!"
