#!/bin/sh

# Uninstall script for blih_cli
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

# Get new tags from the remote
printf "Uninstall blih_cli...\n"
if [ "$PWD" == "$share_path/$repo_name" ]
then
    npm un blih_cli -g
    rm -f "$share_path/man/man1/blih_cli.1.gz"
    rm -rf "$share_path/$repo_name"
    printf '\33[32m%s\33[0m\n' "Blih is done :("
else
    printf '\33[31m%s\33[0m\n' \
    "Error: Blih_cli files not found"
fi