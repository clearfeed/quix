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
for package in packages/github packages/hubspot packages/jira packages/postgres packages/salesforce packages/slack packages/zendesk packages/notion packages/okta packages/jumpcloud packages/assetpanda; do
  if [ -d "$package" ]; then
    echo "📦 Linking $package..."
    cd $package

    # Link common package if it's a dependency
    if grep -q "@clearfeed-ai/quix-common-agent" package.json; then
      yarn link "@clearfeed-ai/quix-common-agent"
    fi

    # Register this package
    yarn link

    cd ../..
  fi
done

# Go back to root and link all packages except common
cd ..
echo "📦 Linking agent packages in root directory..."
yarn link "@clearfeed-ai/quix-common-agent"
yarn link "@clearfeed-ai/quix-github-agent"
yarn link "@clearfeed-ai/quix-hubspot-agent"
yarn link "@clearfeed-ai/quix-jira-agent"
yarn link "@clearfeed-ai/quix-postgres-agent"
yarn link "@clearfeed-ai/quix-salesforce-agent"
yarn link "@clearfeed-ai/quix-slack-agent"
yarn link "@clearfeed-ai/quix-zendesk-agent"
yarn link "@clearfeed-ai/quix-notion-agent"
yarn link "@clearfeed-ai/quix-okta-agent"
yarn link "@clearfeed-ai/quix-jumpcloud-agent"
yarn link "@clearfeed-ai/quix-assetpanda-agent"
yarn link "@clearfeed-ai/quix-bamboohr-agent"

echo "✅ All packages linked successfully in root and sub-packages!"
echo "To use these packages in another project, run:"
echo "  yarn link @clearfeed-ai/quix-common-agent"
echo "  yarn link @clearfeed-ai/quix-github-agent"
echo "  yarn link @clearfeed-ai/quix-hubspot-agent"
echo "  yarn link @clearfeed-ai/quix-jira-agent"
echo "  yarn link @clearfeed-ai/quix-postgres-agent"
echo "  yarn link @clearfeed-ai/quix-salesforce-agent"
echo "  yarn link @clearfeed-ai/quix-slack-agent"
echo "  yarn link @clearfeed-ai/quix-zendesk-agent"
echo "  yarn link @clearfeed-ai/quix-notion-agent"
echo "  yarn link @clearfeed-ai/quix-okta-agent"
echo "  yarn link @clearfeed-ai/quix-jumpcloud-agent"
echo "  yarn link @clearfeed-ai/quix-assetpanda-agent"
echo "  yarn link @clearfeed-ai/quix-bamboohr-agent"
