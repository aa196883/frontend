#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="assets/data"
DATA_REPO="https://gitlab.inria.fr/skrid/data.git"
DATA_BRANCH="main"

SKIP_FETCH=0
SKIP_VENV=0
SKIP_MAKE=0

function usage() {
    cat <<'USAGE'
Usage: ./install_data.sh [options]

Options:
  --skip-fetch     Skip cloning/pulling the GitLab repository (requires an existing checkout).
  --skip-venv      Skip creating/activating the Python virtual environment.
  --skip-make      Skip running the Makefile (assumes derived artefacts already exist).
  --data-dir PATH  Location of the cloned repository (default: assets/data).
  --branch NAME    Git branch to checkout (default: main).
  --verify         Only verify that the required tooling is available.
  -h, --help       Show this help message and exit.
USAGE
}

function log_section() {
    echo "==========================="
    echo "$1"
    echo "==========================="
}

function log_info() {
    echo "[install_data] $1"
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

    if (( !SKIP_FETCH )); then
        if ! require_command git; then
            if [[ -d "$DATA_DIR/.git" ]]; then
                log_info "git not available but existing checkout found; skipping fetch."
                SKIP_FETCH=1
            else
                missing=1
            fi
        fi
    fi

    if (( !SKIP_VENV )); then
        require_command python3 || missing=1
    fi

    if (( !SKIP_MAKE )); then
        require_command make || missing=1
    fi

    return $missing
}

function parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --skip-fetch)
                SKIP_FETCH=1
                shift
                ;;
            --skip-venv)
                SKIP_VENV=1
                shift
                ;;
            --skip-make)
                SKIP_MAKE=1
                shift
                ;;
            --data-dir)
                DATA_DIR="$2"
                shift 2
                ;;
            --branch)
                DATA_BRANCH="$2"
                shift 2
                ;;
            --verify)
                if verify_preconditions; then
                    echo "install_data.sh: preconditions satisfied."
                    exit 0
                else
                    exit 1
                fi
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1" >&2
                usage
                exit 1
                ;;
        esac
    done
}

parse_args "$@"

if verify_preconditions; then
    :
else
    exit 1
fi

# This script will download the data from the gitlab repository, put the files in the right folder, and generate the other formats.

#---Get the repo
log_section "Getting the data repository"

if (( SKIP_FETCH )); then
    if [[ ! -d "$DATA_DIR" ]]; then
        echo "Data directory '$DATA_DIR' does not exist but --skip-fetch was supplied." >&2
        exit 1
    fi
else
    if [[ -d "$DATA_DIR/.git" ]]; then
        log_info "Already cloned. Getting the last updates from $DATA_BRANCH ..."
        git -C "$DATA_DIR" fetch --depth=1 origin "$DATA_BRANCH"
        git -C "$DATA_DIR" checkout "$DATA_BRANCH"
        git -C "$DATA_DIR" pull --ff-only origin "$DATA_BRANCH"
    elif [[ -d "$DATA_DIR" ]]; then
        echo "Directory '$DATA_DIR' exists but is not a git repository. Use --skip-fetch if that's intentional." >&2
        exit 1
    else
        git clone --depth=1 --branch "$DATA_BRANCH" "$DATA_REPO" "$DATA_DIR"
    fi
fi

pushd "$DATA_DIR" >/dev/null

#---Generate the other formats
if (( SKIP_VENV )); then
    log_section "Skipping virtual environment setup"
else
    log_section "Setting up virtual environment"
    python3 -m venv venv
    # shellcheck disable=SC1091
    source venv/bin/activate
fi

if (( SKIP_MAKE )); then
    log_section "Skipping make targets"
else
    log_section "Generating the other formats"
    make
fi

popd >/dev/null
