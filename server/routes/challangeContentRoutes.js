const express = require('express');
const router = new express.Router();
const DailyChallangeDb = require("../models/dailyChallangeSchema");
const WeekelyChallangeDb = require("../models/weeklyChallangeSchema");


router.post("/challenges/data", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id is required in body" });

    // find by challangeId field in your schema
    const doc = await DailyChallengeDb.find({ challangeId: id });
    if (!doc) return res.status(404).json({ message: "Challenge data not found" });

    return res.status(200).json({ data: doc });
  } catch (err) {
    console.error("POST /challenges/data error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = router;