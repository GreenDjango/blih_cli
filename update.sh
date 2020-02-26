#!/bin/sh

# Update script for blih_cli
repo_name="blih_cli"
share_path="/usr/local/share"

# Test if script is run as root
if [ "$EUID" -ne 0 ]
then
    printf '\33[31m%s\33[0m\n' \
    "Error: Please run as root"
    exit 2
fi

cd "$share_path/$repo_name"
current_tag=$(git show --format="%H" --no-patch)

# Get new tags from the remote
printf "Fetch repo...\n"
git fetch --tags
latest_tag=$(git rev-list --tags --max-count=1)
if [ "$latest_tag" != "$current_tag" ]
then
    # Get the latest tag name, assign it to a variable
    latest_tag_name=$(git describe --tags $latest_tag)
    # Checkout the latest tag
    git reset --hard > /dev/null
    git checkout "$latest_tag" 2> /dev/null
    if [ $? -ne 0 ]
    then
        printf '\33[31m%s\33[0m\n' "Error: Update fail"
    else
        npm i --production -g
        printf '\33[32m%s\33[0m\n' "Update to -> $latest_tag_name"
    fi
else
    printf '\33[32m%s\33[0m\n' "Already up-to-date"
fi