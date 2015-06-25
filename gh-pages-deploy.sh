#!/bin/bash

set -e

npm run gh-pages

git config --global user.name "Jake Lee Kennedy"
git config --global user.email "jake@bodhi.io"
git config --global push.default simple

git push "https://${DEPLOY_KEY}@${GH_REF}" `git subtree split --prefix build_folder master`:gh-pages --force
