module.exports = {
  apps: [
    {
      name: "online voting system",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
      error_file: "logs/error.log",
      out_file: "logs/output.log",
      merge_logs: true,
      env_production: {
        PORT: process.env.PORT || 7000,
      },
    },
  ],
};
