#!/bin/bash

set -x
ncc build index.js --license licenses.txt
git update-index --refresh
git diff-index HEAD -- || {
    git commit -am '[skip ci] dist updated'
    npm version patch
    git push --follow-tags
}
