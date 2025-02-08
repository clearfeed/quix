#!/bin/bash

set -e # Exit on error

# Build and link common package
cd packages/common
yarn install
$(yarn global bin)/tsc
yarn link

# Link and build hubspot package
cd ../hubspot
yarn install
yarn link @clearfeed/common-agent
$(yarn global bin)/tsc

# Link and build github package
cd ../github
yarn install
yarn link @clearfeed/common-agent
$(yarn global bin)/tsc

# Link and build jira package
cd ../jira
yarn install
yarn link @clearfeed/common-agent
$(yarn global bin)/tsc

echo "All packages built successfully!"
