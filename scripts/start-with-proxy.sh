#!/bin/bash
echo "Starting development server with Clash proxy..."
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897
npm run dev
