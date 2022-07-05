#!/bin/bash

set -x
CUR_VERSION=${CUR_VERSION:-v1.0.1}
ncc build index.js --license licenses.txt
cp  settings.xml dist/
git update-index --refresh
git diff-index --quiet HEAD --  || {
    git commit -am '[skip ci] dist updated'
    npm version patch
    # update current version reference
    git tag -fa $CUR_VERSION -m "Updated to latest version"
    git push -d origin $CUR_VERSION
    git push --follow-tags
}
