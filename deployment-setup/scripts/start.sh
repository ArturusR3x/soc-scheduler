#!/bin/bash

# Navigate to the application directory
cd /path/to/your/application

# Start the application using PM2
pm2 start pm2/ecosystem.config.js --env production

# Optionally, you can add logging or other commands here
echo "Application started successfully."