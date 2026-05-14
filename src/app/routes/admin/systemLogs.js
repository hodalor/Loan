const express = require("express");
const SystemLog = require("../../models/systemLog");

const router = express.Router();

const toStringList = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

router.get("/system-logs", async (req, res) => {
  try {
    const { level = "", category = "", status = "", search = "", limit = "200" } = req.query;
    const query = {};
    const levels = toStringList(level);
    const categories = toStringList(category);
    const statuses = toStringList(status);
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 500);

    if (levels.length > 0) {
      query.level = { $in: levels };
    }

    if (categories.length > 0) {
      query.category = { $in: categories };
    }

    if (statuses.length > 0) {
      query.status = { $in: statuses };
    }

    if (String(search || "").trim()) {
      const expression = new RegExp(String(search).trim(), "i");
      query.$or = [
        { message: expression },
        { source: expression },
        { action: expression },
        { requestPath: expression },
        { "actor.userName": expression },
        { "actor.userId": expression },
      ];
    }

    const logs = await SystemLog.find(query).sort({ createdAt: -1 }).limit(parsedLimit).lean();

    return res.status(200).json({
      success: 1,
      data: logs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.get("/system-logs/errors", async (req, res) => {
  try {
    const { search = "", limit = "200" } = req.query;
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 500);
    const query = {
      level: { $in: ["warn", "error", "fatal"] },
    };

    if (String(search || "").trim()) {
      const expression = new RegExp(String(search).trim(), "i");
      query.$or = [
        { message: expression },
        { source: expression },
        { action: expression },
        { requestPath: expression },
        { "actor.userName": expression },
        { "actor.userId": expression },
      ];
    }

    const logs = await SystemLog.find(query).sort({ createdAt: -1 }).limit(parsedLimit).lean();

    return res.status(200).json({
      success: 1,
      data: logs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
