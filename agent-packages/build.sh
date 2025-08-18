#!/bin/bash

set -e # Exit on error

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# Build and link common package first (other packages depend on it)
echo "Building common package..."
cd "$PACKAGES_DIR/common"
yarn install
yarn build
yarn link

# Get all directories in packages folder except common (already built)
PACKAGE_DIRS=($(find "$PACKAGES_DIR" -mindepth 1 -maxdepth 1 -type d -not -name "common" | sort))

# Build all other packages
for package_path in "${PACKAGE_DIRS[@]}"; do
    package_name=$(basename "$package_path")
    echo "Building $package_name package..."
    
    cd "$package_path"
    yarn install
    yarn link "@clearfeed-ai/quix-common-agent"
    yarn build
done

echo "All packages built successfully!"
