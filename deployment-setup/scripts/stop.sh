#!/bin/bash

# Stop the application using PM2
pm2 stop all

# Optionally, you can also delete the application from PM2
# pm2 delete all

echo "Application stopped successfully."