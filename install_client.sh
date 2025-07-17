#!/usr/bin/env bash

# This script will download the vueJS client from the gitlab, build it, and put the files in the right place for the production.

#---Get the repo
echo "=================="
echo "Getting the client"
echo "=================="

cd assets/

if [[ -d "client/" ]]; then
    echo "Already clonned. Getting the last updates from main ..."
    cd client/
    git checkout main
    git pull

else
    git clone --depth=1 https://gitlab.inria.fr/skrid/client.git
    cd client/
fi

#---Install the dependencies
echo "==========================="
echo "Installing the dependencies"
echo "==========================="

npm install

#---Build the vue client
echo "======================"
echo "Building the vueJS app"
echo "======================"

rm -r build/*
npm run build

#---Clean the installation folder, just in case
echo "================"
echo "Moving the files"
echo "================"

cd ..
rm -r vuejs/*

#---Move the files
mv client/build/* vuejs/

#---Copy the .env file
cp ../.env vuejs/ || echo "Missing .env file in the frontend repo!"
