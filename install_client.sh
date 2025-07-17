#!/usr/bin/env bash

# This script will download the vueJS client from the gitlab, build it, and put the files in the right place for the production.

#---Get the repo
cd assets/
git clone https://gitlab.inria.fr/skrid/client.git
cd client/

#---Install the dependencies
npm install

#---Build the vue client
npm run build

#---Clean the installation folder, just in case
cd ..
rm -r vuejs/*

#---Move the files
mv client/build/* vuejs/

#---Copy the .env file
cp ../.env vuejs/ || echo "Missing .env file in the frontend repo!"
