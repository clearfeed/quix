#!/bin/bash

# Exit on error
set -e

echo "🔗 Linking packages for local development..."

# Navigate to the agent-packages directory
cd agent-packages

# First link the common package since others may depend on it
echo "📦 Linking common package..."
cd packages/common
yarn link
cd ../..

# Link other packages and their dependencies
for package in packages/github packages/hubspot packages/jira; do
  if [ -d "$package" ]; then
    echo "📦 Linking $package..."
    cd $package

    # Link common package if it's a dependency
    if grep -q "quix-common-agent" package.json; then
      yarn link "quix-common-agent"
    fi

    # Register this package
    yarn link

    cd ../..
  fi
done

# Go back to root and link all packages except common
cd ..
echo "📦 Linking agent packages in root directory..."
yarn link "quix-github-agent"
yarn link "quix-hubspot-agent"
yarn link "quix-jira-agent"

echo "✅ All packages linked successfully in root and sub-packages!"
echo "To use these packages in another project, run:"
echo "  yarn link quix-github-agent"
echo "  yarn link quix-hubspot-agent"
echo "  yarn link quix-jira-agent"
echo "Note: quix-common-agent is an internal dependency and not needed in consuming projects"
