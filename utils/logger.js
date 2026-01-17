const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../logs/adops-logs.json");

function logEvent(event) {
  const logs = JSON.parse(fs.readFileSync(logFilePath, "utf8"));

  logs.push({
    ...event,
    timestamp: new Date().toISOString(),
  });

  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
}

module.exports = { logEvent };
