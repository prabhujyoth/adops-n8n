const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { logEvent } = require("./utils/logger");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const logFilePath = path.join(__dirname, "logs/adops-logs.json");


app.use(cors());
app.use(express.json());

// ---- In-memory campaigns store ----
const campaigns = [
  {
    id: "cmp_1",
    name: "Search_US",
    budget: 1000,
    spend: 420,
    status: "ACTIVE",
    startDate: "2026-01-01",
    endDate: "2026-01-10",
  },
];

// ---- GET campaigns (used by n8n + Angular) ----
app.get("/campaigns", (req, res) => {
  campaigns.forEach((campaign) => {
    if (campaign.status === "ACTIVE") {
      campaign.spend += Math.floor(Math.random() * 20);
    }
  });

  res.status(200).json(campaigns);
});

// ---- Pause campaign ----
app.post("/campaigns/:id/pause", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  if (campaign.status === "PAUSED") {
    return res.json({ success: true, message: "Already paused", campaign });
  }

  campaign.status = "PAUSED";

  logEvent({
    type: "CAMPAIGN_PAUSED",
    campaignId: campaign.id,
    spend: campaign.spend,
    budget: campaign.budget,
  });
  res.json({ success: true, campaign });
});

// ---- Resume campaign ----
app.post("/campaigns/:id/resume", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  if (campaign.status === "ACTIVE") {
    return res.json({ success: true, message: "Already active", campaign });
  }

  campaign.status = "ACTIVE";

  logEvent({
    type: "CAMPAIGN_RESUMED",
    campaignId: campaign.id,
    spend: campaign.spend,
    budget: campaign.budget,
  });
  res.json({ success: true, campaign });
});

// ---- Update budget ----
app.post("/campaigns/:id/budget", (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);
  const { budget } = req.body;

  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  if (typeof budget !== "number" || budget <= 0) {
    return res.status(400).json({ message: "Invalid budget value" });
  }

  logEvent({
    type: "CAMPAIGN_BUDGET UPDATED",
    campaignId: campaign.id,
    spend: campaign.spend,
    budget: campaign.budget,
  });

  campaign.budget = budget;
  res.json({ success: true, campaign });
});

// ----Server Logs

app.get("/logs", (req, res) => {
  try {
    if (!fs.existsSync(logFilePath)) {
      return res.json([]);
    }

    const fileData = fs.readFileSync(logFilePath, "utf8");

    if (!fileData) {
      return res.json([]);
    }

    const logs = JSON.parse(fileData);
    res.status(200).json(logs);
  } catch (err) {
    console.error("Failed to read logs", err);
    res.status(500).json({
      message: "Could not read logs",
    });
  }
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Ad Ops API running on PORT ${PORT}`);
});
