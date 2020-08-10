#!/bin/sh
#**
#* Copyright (c) 2020 Blih CLI
#*
#* Update script for blih_cli
#*
#* @summary Update script for blih_cli
#* @author Theo <@GreenDjango>
#*
#* Created at     : 2020-02-25 15:19:31 
#**

# Repo path
repo_name="blih_cli"
share_path="/usr/local/share"

# Test if script is run as root
if [ "$EUID" -ne 0 ]
then
    printf '\33[31m%s\33[0m\n' \
    "Error: Please run as root"
    exit 2
fi

# Test network and repo
## use http instead of 'git@github.com:GreenDjango/blih_cli.git' because
## no need to add the RSA key fingerprint (cf: SSH deadlock issue #13)
git ls-remote -h "https://github.com/GreenDjango/$repo_name.git" &> /dev/null
if [ "$?" -ne 0 ]
then
    printf '\33[31m%s\33[0m\n' \
    "Error: Please check your network connection"
    exit 2
fi

cd "$share_path/$repo_name"
current_tag=$(git show --format="%H" --no-patch)

# Get new tags from the remote
printf "Fetch repo...\n"
git fetch --tags
if [ "$1" == "snapshot" ]
then
    latest_tag=$(git rev-list --all --max-count=1)
else
    latest_tag=$(git rev-list --tags --max-count=1)
fi
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
        npm i --production --no-fund -g
        cp -u "./man/manpage.1.gz" "$share_path/man/man1/blih_cli.1.gz"
        printf '\33[32m%s\33[0m\n' "Update to -> $latest_tag_name"
    fi
else
    printf '\33[32m%s\33[0m\n' "Already up-to-date"
fi