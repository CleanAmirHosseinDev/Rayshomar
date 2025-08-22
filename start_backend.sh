#!/bin/bash
echo "--- Changing directory to /app/main_api_js ---"
cd /app/main_api_js
echo "--- Running npm install ---"
npm install
echo "--- Starting server with nodemon ---"
./node_modules/.bin/nodemon src/app.js
