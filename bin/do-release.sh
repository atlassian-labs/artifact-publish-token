#!/bin/bash

set -x
ncc build index.js --license licenses.txt
cp  settings.xml dist/
git update-index --refresh
git diff-index --quiet HEAD --  || {
    git commit -am '[skip ci] dist updated'
    npm version patch
    git push --follow-tags
}
