module.exports = {
  apps: [
    {
      name: "soc-scheduler",
      script: "../src/index.js", // Adjust the path to your application's entry point
      instances: "max", // Use maximum instances
      exec_mode: "cluster", // Enable cluster mode
      env: {
        NODE_ENV: "production",
        PORT: 3000, // Change to your desired port
      },
      log_file: "../logs/combined.log", // Path for log files
      out_file: "../logs/out.log", // Path for standard output logs
      error_file: "../logs/error.log", // Path for error logs
      merge_logs: true, // Merge logs from all instances
      autorestart: true, // Automatically restart the app if it crashes
      watch: false, // Disable watch mode for production
    },
  ],
};