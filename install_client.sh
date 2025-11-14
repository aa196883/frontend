#!/usr/bin/env bash
set -euo pipefail

CLIENT_DIR="assets/client"
OUTPUT_DIR="assets/vuejs"
CLIENT_REPO="https://gitlab.inria.fr/skrid/client.git"
CLIENT_BRANCH="main"

SKIP_FETCH=0
SKIP_INSTALL=0
SKIP_BUILD=0
USE_PREBUILT=0
PREBUILT_DIR="${CLIENT_DIST_DIR:-}" # environment override
PREBUILT_ARCHIVE="${CLIENT_DIST_ARCHIVE:-}"

function usage() {
    cat <<'USAGE'
Usage: ./install_client.sh [options]

Options:
  --skip-fetch          Skip cloning/pulling the GitLab repository (expects an existing checkout).
  --skip-install        Skip installing npm dependencies inside the client directory.
  --skip-build          Skip running the Vue build (requires pre-built artefacts).
  --prebuilt-dir PATH   Copy an existing build directory instead of cloning/building the client.
  --prebuilt-archive FILE
                        Extract an archive containing the built assets instead of cloning/building.
  --output-dir PATH     Destination directory for the built artefacts (default: assets/vuejs).
  --client-dir PATH     Location of the cloned repository (default: assets/client).
  --branch NAME         Git branch to checkout before building (default: main).
  --verify              Only verify that the required tooling is available.
  -h, --help            Show this help message and exit.

Environment overrides:
  CLIENT_DIST_DIR       Same as --prebuilt-dir.
  CLIENT_DIST_ARCHIVE   Same as --prebuilt-archive.
USAGE
}

function log_section() {
    echo "=================="
    echo "$1"
    echo "=================="
}

function log_info() {
    echo "[install_client] $1"
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

    if (( USE_PREBUILT )); then
        if [[ -n "$PREBUILT_DIR" && ! -d "$PREBUILT_DIR" ]]; then
            echo "Prebuilt directory not found: $PREBUILT_DIR" >&2
            missing=1
        fi
        if [[ -n "$PREBUILT_ARCHIVE" ]]; then
            if [[ ! -f "$PREBUILT_ARCHIVE" ]]; then
                echo "Prebuilt archive not found: $PREBUILT_ARCHIVE" >&2
                missing=1
            else
                require_command tar || missing=1
            fi
        fi
    fi

    if (( !SKIP_FETCH )); then
        if ! require_command git; then
            if [[ -d "$CLIENT_DIR/.git" ]]; then
                log_info "git not available but existing checkout found; skipping fetch."
                SKIP_FETCH=1
            else
                missing=1
            fi
        fi
    fi

    if (( !USE_PREBUILT )); then
        if (( !SKIP_INSTALL || !SKIP_BUILD )); then
            require_command npm || missing=1
        fi
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
            --skip-install)
                SKIP_INSTALL=1
                shift
                ;;
            --skip-build)
                SKIP_BUILD=1
                shift
                ;;
            --prebuilt-dir)
                PREBUILT_DIR="$2"
                USE_PREBUILT=1
                SKIP_FETCH=1
                SKIP_INSTALL=1
                SKIP_BUILD=1
                shift 2
                ;;
            --prebuilt-archive)
                PREBUILT_ARCHIVE="$2"
                USE_PREBUILT=1
                SKIP_FETCH=1
                SKIP_INSTALL=1
                SKIP_BUILD=1
                shift 2
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --client-dir)
                CLIENT_DIR="$2"
                shift 2
                ;;
            --branch)
                CLIENT_BRANCH="$2"
                shift 2
                ;;
            --verify)
                if verify_preconditions; then
                    echo "install_client.sh: preconditions satisfied."
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

    if [[ -n "$PREBUILT_DIR" ]]; then
        USE_PREBUILT=1
        SKIP_FETCH=1
        SKIP_INSTALL=1
        SKIP_BUILD=1
    fi

    if [[ -n "$PREBUILT_ARCHIVE" ]]; then
        USE_PREBUILT=1
        SKIP_FETCH=1
        SKIP_INSTALL=1
        SKIP_BUILD=1
    fi
}

parse_args "$@"

if (( USE_PREBUILT )) && [[ -n "$PREBUILT_DIR" && -n "$PREBUILT_ARCHIVE" ]]; then
    echo "Cannot use both --prebuilt-dir and --prebuilt-archive simultaneously." >&2
    exit 1
fi

if verify_preconditions; then
    :
else
    exit 1
fi

# This script will download the vueJS client from the gitlab, build it, and put the files in the right place for the production.

if (( USE_PREBUILT )); then
    log_section "Using prebuilt client assets"
    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"

    if [[ -n "$PREBUILT_DIR" ]]; then
        shopt -s dotglob
        cp -a "$PREBUILT_DIR"/* "$OUTPUT_DIR"/
        shopt -u dotglob
    elif [[ -n "$PREBUILT_ARCHIVE" ]]; then
        tmp_dir="$(mktemp -d)"
        tar -xf "$PREBUILT_ARCHIVE" -C "$tmp_dir"
        shopt -s dotglob
        cp -a "$tmp_dir"/* "$OUTPUT_DIR"/
        shopt -u dotglob
        rm -rf "$tmp_dir"
    else
        echo "No prebuilt artefacts provided." >&2
        exit 1
    fi
else
    #---Get the repo
    log_section "Getting the client"

    if (( SKIP_FETCH )); then
        if [[ ! -d "$CLIENT_DIR" ]]; then
            echo "Client directory '$CLIENT_DIR' does not exist but --skip-fetch was supplied." >&2
            exit 1
        fi
    else
        if [[ -d "$CLIENT_DIR/.git" ]]; then
            log_info "Already cloned. Getting the last updates from $CLIENT_BRANCH ..."
            git -C "$CLIENT_DIR" fetch --depth=1 origin "$CLIENT_BRANCH"
            git -C "$CLIENT_DIR" checkout "$CLIENT_BRANCH"
            git -C "$CLIENT_DIR" pull --ff-only origin "$CLIENT_BRANCH"
        elif [[ -d "$CLIENT_DIR" ]]; then
            echo "Directory '$CLIENT_DIR' exists but is not a git repository. Use --skip-fetch if that's intentional." >&2
            exit 1
        else
            git clone --depth=1 --branch "$CLIENT_BRANCH" "$CLIENT_REPO" "$CLIENT_DIR"
        fi
    fi

    #---Install the dependencies
    if (( SKIP_INSTALL )); then
        log_section "Skipping dependency installation"
    else
        log_section "Installing the dependencies"
        (cd "$CLIENT_DIR" && npm install)
    fi

    #---Build the vue client
    if (( SKIP_BUILD )); then
        log_section "Skipping build step"
    else
        log_section "Building the vueJS app"
        (cd "$CLIENT_DIR" && rm -rf build/* && npm run build)
    fi

    #---Clean the installation folder, just in case
    log_section "Moving the files"

    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"

    if [[ -d "$CLIENT_DIR/build" ]]; then
        shopt -s dotglob
        cp -a "$CLIENT_DIR"/build/* "$OUTPUT_DIR"/
        shopt -u dotglob
    else
        echo "Expected build output in '$CLIENT_DIR/build'." >&2
        exit 1
    fi
fi

#---Copy the .env file
if [[ -f ./.env ]]; then
    cp ./.env "$OUTPUT_DIR"/ || log_info "Unable to copy .env into $OUTPUT_DIR"
else
    log_info "Missing .env file in the frontend repo; skipping copy."
fi
