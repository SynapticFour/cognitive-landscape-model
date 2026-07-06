#!/bin/bash
# CLM setup script — Cognitive Landscape Model

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

require_node() {
  if ! command -v node &>/dev/null; then
    print_error "Node.js 18+ is required. Install from https://nodejs.org"
    exit 1
  fi
  local major
  major=$(node --version | sed 's/^v//' | cut -d. -f1)
  if [ "$major" -lt 18 ]; then
    print_error "Node.js 18+ required (found $(node --version))"
    exit 1
  fi
  print_success "Node $(node --version)"
}

cmd_install() {
  require_node
  print_status "Installing dependencies..."
  npm install
  print_success "Dependencies installed"
}

cmd_check() {
  print_status "Running type-check..."
  npm run type-check
  print_status "Running tests..."
  npm run test
  print_success "Quality checks passed"
}

cmd_verify() {
  if [ -x ./verify-gitignore.sh ]; then
    ./verify-gitignore.sh
  else
    print_warning "verify-gitignore.sh not executable; skipping"
  fi
}

cmd_setup() {
  cmd_install
  cmd_check
  cmd_verify
  print_success "CLM setup complete"
}

cmd_clean() {
  print_status "Cleaning build artifacts..."
  rm -rf coverage dist packages/*/dist
  find . -name '*.tsbuildinfo' -delete 2>/dev/null || true
  print_success "Clean complete"
}

cmd_status() {
  require_node
  echo "Directory: $ROOT"
  echo "Node: $(node --version)"
  echo "npm: $(npm --version)"
  git status -sb 2>/dev/null || print_warning "Not a git repository"
}

cmd_help() {
  cat <<EOF
CLM setup script

Usage: ./setup.sh [command]

Commands:
  setup (default)  Install, test, and verify
  install          npm install
  check            type-check + test
  verify           gitignore verification
  clean            remove build/coverage artifacts
  status           show environment status
  help             show this help
EOF
}

case "${1:-setup}" in
  setup) cmd_setup ;;
  install) cmd_install ;;
  check) cmd_check ;;
  verify) cmd_verify ;;
  clean) cmd_clean ;;
  status) cmd_status ;;
  help|-h|--help) cmd_help ;;
  *)
    print_error "Unknown command: $1"
    cmd_help
    exit 1
    ;;
esac
