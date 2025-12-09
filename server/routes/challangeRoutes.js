// routes/challenges.js
const express = require("express");
const router = new express.Router();
const Challenge = require("../models/challangeSchema"); // path to your model
const { v4: uuidv4 } = require("uuid");

/**
 * POST /api/challenges
 * Body: { type, title, description, rewardXP, estimatedTime, date, weekStart, formats, extraTips }
 */
router.post("/challenges/create", async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      rewardXP = 0,
      estimatedTime = "",
      date,
      weekStart,
      formats = {},
      extraTips = [],
    } = req.body;

    // Basic validation
    if (!type || !["daily", "weekly"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }
    if (type === "daily" && !date) {
      return res.status(400).json({ message: "Date required for daily challenge" });
    }
    if (type === "weekly" && !weekStart) {
      return res.status(400).json({ message: "weekStart required for weekly challenge" });
    }

    // generate a friendly challengeId (you can change format)
    const challengeId = `${type[0]}-${uuidv4().split("-")[0]}-${(date || weekStart || "").replace(/-/g, "")}`;

    const doc = new Challenge({
      challengeId,
      type,
      title,
      description,
      rewardXP,
      estimatedTime,
      date: type === "daily" ? new Date(date) : undefined,
      weekStart: type === "weekly" ? new Date(weekStart) : undefined,
      formats,
      extraTips,
    });

    await doc.save();
    return res.status(201).json({ message: "Challenge created", challenge: doc });
  } catch (err) {
    console.error("create challenge err", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/challenges/daily?date=YYYY-MM-DD

router.post("/challenges/daily", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date query param is required (YYYY-MM-DD)" });
    }

    // Convert string → proper Date
    const userDate = new Date(date);

    // Match EXACT date ignoring time-zone offsets
    const startOfDay = new Date(userDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(userDate.setHours(23, 59, 59, 999));

    const challenges = await Challenge.find({
      type: "daily",
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    if (!challenges.length) {
      return res.status(404).json({ message: "No daily challenge found for this date" });
    }

    return res.status(200).json({ date, challenges });
  } catch (err) {
    console.error("Fetch daily challenge error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});




function computeWeekStart(date) {
  const d = new Date(date);
  // JS getDay(): 0 = Sun, 1 = Mon, ... 6 = Sat
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7; // 0 if Monday, 1 if Tuesday, ... 6 if Sunday
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

router.post("/challenges/weekly", async (req, res) => {
  try {
    const { weekStart, date } = req.body; // expects JSON body

    if (!weekStart && !date) {
      return res.status(400).json({ message: "Provide weekStart or date in request body (YYYY-MM-DD)" });
    }

    const base = new Date(weekStart || date);
    if (isNaN(base.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfWeek = computeWeekStart(base); // Monday 00:00:00
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Find weekly challenges:
    //  - ones that explicitly have weekStart within the week
    //  - OR (fallback) ones that don't have weekStart set but were created during that week
    const challenges = await Challenge.find({
      type: "weekly",
      $or: [
        { weekStart: { $gte: startOfWeek, $lte: endOfWeek } },
        { weekStart: { $exists: false }, createdAt: { $gte: startOfWeek, $lte: endOfWeek } },
      ],
    }).sort({ createdAt: -1 });

    if (!challenges.length) {
      return res.status(404).json({ message: "No weekly challenges found for this week" });
    }

    // Return an ISO date string for clarity
    const weekStartIso = startOfWeek.toISOString().slice(0, 10);
    return res.status(200).json({ weekStart: weekStartIso, challenges });
  } catch (err) {
    console.error("Fetch weekly challenge error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/get/challenges/:id",async(req,res)=>{
  try{
    const {id} = req.params;
    if(!id){ throw new Error("no existing challange"); }

    const doc = await Challenge.findById(id);

    if(!doc){ throw new Error("this challenge not exist");}
    res.status(200).json({status : 200, challenge : doc});
  }
  catch(error){
    console.log("some error getting in fetching id");
  }
})




module.exports = router;
