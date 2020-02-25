#!/bin/sh

# Install script for blih_cli
owner="GreenDjango"
repo_name="blih_cli"
bin_path="/usr/local/bin"
bin_name="blih_cli"
share_path="/usr/local/share"

# Test if script is run as root
if [ "$EUID" -ne 0 ]
then
    printf '\33[31m%s\33[0m\n' \
    "Error: Please run as root"
    exit 2
fi

# Test if npm is installed
type npm &> /dev/null
if [ $? -ne 0 ]
then
    printf '\33[31m%s\33[0m\n%s\n' \
    "Error: Npm is not installed" \
    "Use \`sudo apt-get node\` for ubuntu or \`sudo dnf install node\` for fedora"
    exit 2
fi

# Test if path exist
if [ ! -d "$bin_path" ] || [ ! -d "$share_path" ]
then
    printf '\33[31m%s\33[0m %s or %s\n' \
    "Error: missing folder:" "$bin_path" "$share_path"
    exit 2
fi

cd "$share_path"

# Test if program already exist
if [ -f "$repo_name" ] || [ -d "$repo_name" ]
then
    read -p "$repo_name already exist, overwrite? [y/N] " -n 1 -r
    if [[ $REPLY =~ ^[YyOo]$ ]]
    then
        echo ''
        rm -rf blih_cli
    else
        printf "Stop $repo_name install\n"
        exit 1
    fi
fi

# Git clone blih_cli repositorie
printf '\33[32m%s\33[0m\n' "Git clone repo..."
if git clone --depth 1 "https://github.com/$owner/$repo_name.git"
then
    printf '\33[32m%s\33[0m\n' "Install in $share_path..."
    cd "$repo_name"
    npm i --production

    printf '\33[32m%s\33[0m\n' "Coping $repo_name to $bin_path/$repo_name"
    index=`cat package.json | grep -m 1 '"main"' | cut -d$'\"' -f4`
    index_path="$PWD/$index"
    cd "$bin_path"
    yes | sudo cp -sf "$index_path" "./$bin_name"
    sudo chmod a+x "./$bin_name"

    printf '\33[32m%s\33[0m\n' "Adding manpage"
    #sudo cp $HOME/norminette/manpage.1.gz /usr/share/man/man1/norminette.1.gz
    #sudo cp $HOME/norminette/manpage.1f.gz /usr/share/man/man1/norminette.1f.gz

    printf '\33[32m\n%s\n%s\33[0m\n' "Done !" "Use $repo_name"
else
    printf '\33[31m%s\33[0m\n' \
    "Error: could not clone repository"
fi