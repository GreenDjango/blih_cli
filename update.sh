#!/bin/sh

# Update script for blih_cli
current_tag=$(git rev-list --tags --max-count=1)

# Loader
loader()
{
    PID=$!
    i=1
    sp="/-\|"
    printf '\33[3m%s\33[0m  ' "$1"
    while [ -d /proc/$PID ]
    do
        printf "\b${sp:i++%${#sp}:1}"
    done
    echo ''
} 

# Get new tags from the remote
git fetch --tags &
loader "Fetch repo"
latest_tag=$(git rev-list --tags --max-count=1)
if [ "$latest_tag" != "$current_tag" ]
then
    # Get the latest tag name, assign it to a variable
    latest_tag_name=$(git describe --tags $latest_tag)
    # Checkout the latest tag
    git reset --hard
    git checkout $latest_tag
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