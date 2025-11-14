#!/usr/bin/env bash
set -euo pipefail

function log_section() {
    echo "==========================="
    echo "$1"
    echo "==========================="
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
    require_command python3 || missing=1
    require_command make || missing=1

    return $missing
}

if [[ "${1:-}" == "--verify" ]]; then
    if verify_preconditions; then
        echo "install_data.sh: preconditions satisfied."
        exit 0
    fi
    exit 1
fi

verify_preconditions

# This script will download the data from the gitlab repository, put the files in the right folder, and generate the other formats.

#---Get the repo
log_section "Getting the data repository"

cd assets/

folder_name="data"

if [[ -d "$folder_name" ]]; then
    echo "Already cloned. Getting the last updates from main ..."
    cd "$folder_name"
    git checkout main
    git pull

else
    git clone --depth=1 https://gitlab.inria.fr/skrid/data.git
    cd "$folder_name"
fi

#---Generate the other formats
# Make a python virtual environment
python3 -m venv venv
source venv/bin/activate

# Generate all the formats
make
