#!/bin/bash

set -x

push_revision() {
    # update current version reference
    git tag -fa $CUR_VERSION -m "Updated to latest version"
    git push -d origin $CUR_VERSION
    git push --follow-tags $DRY_RUN -v
}

CUR_VERSION=${CUR_VERSION:-v1.0.1}
ncc build index.js --license licenses.txt
cp  settings.xml dist/
git update-index --refresh

git diff-index --quiet HEAD --  || {
    echo "release bundle changed"
    git commit -am '[skip ci] dist updated'
    push_revision
}

[[ $(git rev-list --count "${CUR_VERSION}".. -- action.yml) -eq 0 ]] || {
    echo "action descriptor changed..."
    push_revision
}
