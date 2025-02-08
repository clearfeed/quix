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
    if grep -q "@clearfeed/common-agent" package.json; then
      yarn link "@clearfeed/common-agent"
    fi

    # Register this package
    yarn link

    cd ../..
  fi
done

# Go back to root and link all packages except common
cd ..
echo "📦 Linking agent packages in root directory..."
yarn link "@clearfeed/github-agent"
yarn link "@clearfeed/hubspot-agent"
yarn link "@clearfeed/jira-agent"

echo "✅ All packages linked successfully in root and sub-packages!"
echo "To use these packages in another project, run:"
echo "  yarn link @clearfeed/github-agent"
echo "  yarn link @clearfeed/hubspot-agent"
echo "  yarn link @clearfeed/jira-agent"
echo "Note: @clearfeed/common-agent is an internal dependency and not needed in consuming projects"
