#!/bin/bash

set -e # Exit on error

# Build and link common package
cd packages/common
yarn install
yarn build
yarn link

# Link and build hubspot package
cd ../hubspot
yarn install
yarn link "@clearfeed-ai/quix-common-agent"
yarn build

# Link and build github package
cd ../github
yarn install
yarn link "@clearfeed-ai/quix-common-agent"
yarn build

# Link and build jira package
cd ../jira
yarn install
yarn link "@clearfeed-ai/quix-common-agent"
yarn build

# Link and build zendesk package
cd ../zendesk
yarn install
yarn link "@clearfeed-ai/quix-common-agent"
yarn build

echo "All packages built successfully!"
