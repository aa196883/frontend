#!/usr/bin/env bash

# This script will download the data from the gitlab repository, and put the files in the right folder.

#---Get the repo
echo "==========================="
echo "Getting the data repository"
echo "==========================="

cd assets/

folder_name="data"

if [[ -d "$folder_name" ]]; then
    echo "Already cloned. Getting the last updates from main ..."
    cd "$folder_name"
    git checkout main
    git pull

else
    git clone --depth=1 https://gitlab.inria.fr/skrid/data.git
    cd "$folder_name"
fi
