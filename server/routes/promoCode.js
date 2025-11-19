const express= require('express');
const authenticate = require('../middleware/authenticate');
const router = new express.Router();
const googledb = require("../models/googleSchema");
const userdb = require("../models/userSchema");
const promodb = require("../models/promoCodeModel");

router.post('/codeApply', authenticate, async (req, res) => {
  try {
    const { userId, promoCode } = req.body;

    if (!userId) {
      return res.status(400).json({ status: 400, message: "user not logged in" });
    }
    if (!promoCode) {
      
      return res.status(400).json({ status: 400, message: "promo code not provided" });
    }

    console.log("i m in applying")

    const user =
      await userdb.findById(userId) ||
      await googledb.findById(userId);

    if (!user) {
        console.log("i m failed here2");
      return res.status(404).json({ status: 404, message: "user not exist" });
    }

    // Find promo in promo collection
    const codeDoc = await promodb.findOne({ code: promoCode });

    if (!codeDoc) {
        console.log("i m failed here");
      return res.status(404).json({ status: 404, message: "promo code not found" });
    }

    // If promo has startDate/endDate, validate expiry
    const now = new Date();
    if (codeDoc.startDate && now < new Date(codeDoc.startDate)) {
      return res.status(400).json({ status: 400, message: "promo code not active yet" });
    }
    if (codeDoc.endDate && now > new Date(codeDoc.endDate)) {
      return res.status(400).json({ status: 400, message: "promo code expired" });
    }

    // Prevent applying the same code twice
    const alreadyApplied = (user.promoCode || []).some(pc => pc.code === promoCode);
    if (alreadyApplied) {
      return res.status(409).json({ status: 409, message: "promo code already applied" });
    }

    // Add to user.promoCode array (snapshotting priority and creditValue)
    user.promoCode.push({
      code: promoCode,
      priority: codeDoc.priority ?? 1,
      creditValue: codeDoc.creditValue ?? 0,
      appliedAt: new Date()
    });

    // Optionally: if you want to immediately update user's credit balance:
    user.credit =codeDoc.creditValue || user.credit;

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "code applied successfully",
      applied: {
        code: promoCode,
        priority: codeDoc.priority,
        creditValue: codeDoc.creditValue
      }
    });

  } catch (error) {
    console.error("POST /code error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
});



router.post("/promocode",async (req, res) => {
  try {
    console.log("i m going");
    const { code, startDate, endDate, creditValue, priority } = req.body;

    // field validation
    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end date are required" });
    }
    if (!creditValue) {
      return res.status(400).json({ message: "Credit value is required" });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (isNaN(sDate.getTime())) {
      return res.status(400).json({ message: "Invalid startDate" });
    }
    if (isNaN(eDate.getTime())) {
      return res.status(400).json({ message: "Invalid endDate" });
    }
    if (sDate > eDate) {
      return res.status(400).json({ message: "startDate must be earlier than endDate" });
    }

    // unique code check
    const existing = await promodb.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: "Promo code already exists" });
    }

    // create promo
    const newPromo = new promodb({
      code: code.toUpperCase(),
      startDate: sDate,
      endDate: eDate,
      creditValue: Number(creditValue),
      priority: priority ? Number(priority) : 1
    });

    await newPromo.save();

    return res.status(201).json({
      message: "Promo code created successfully",
      promo: newPromo
    });

  } catch (error) {
    console.error("Error creating promo code:", error);
    return res.status(500).json({ message: error.message });
  }
});





module.exports = router;



