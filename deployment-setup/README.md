# Deployment Setup for SOC Scheduler

This document provides instructions for deploying the SOC Scheduler web application using Nginx and PM2 on an internal machine.

## Prerequisites

- Node.js and npm installed on the server.
- PM2 installed globally. You can install it using the following command:
  ```
  npm install -g pm2
  ```
- Nginx installed on the server.

## Nginx Configuration

1. Copy the Nginx configuration file `nginx/soc-scheduler.conf` to the Nginx configuration directory, typically located at `/etc/nginx/sites-available/`.
2. Create a symbolic link to the configuration file in the `sites-enabled` directory:
   ```
   sudo ln -s /etc/nginx/sites-available/soc-scheduler.conf /etc/nginx/sites-enabled/
   ```
3. Test the Nginx configuration for syntax errors:
   ```
   sudo nginx -t
   ```
4. Restart Nginx to apply the changes:
   ```
   sudo systemctl restart nginx
   ```

## PM2 Configuration

1. Navigate to the `pm2` directory and review the `ecosystem.config.js` file to ensure it is configured correctly for your application.
2. Start the application using PM2 with the following command:
   ```
   pm2 start pm2/ecosystem.config.js
   ```

## Starting and Stopping the Application

- To start the application, run the start script:
  ```
  ./scripts/start.sh
  ```

- To stop the application, run the stop script:
  ```
  ./scripts/stop.sh
  ```

## Monitoring the Application

You can monitor the application using PM2 with the following command:
```
pm2 monit
```

## Conclusion

This setup allows you to deploy and manage the SOC Scheduler web application efficiently using Nginx and PM2. For further assistance, please refer to the official documentation of Nginx and PM2.