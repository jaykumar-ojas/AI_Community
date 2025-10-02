// routes/seedUsers.js
const express = require("express");
const router = express.Router();
const userdb = require('../models/userSchema'); // adjust path to your mongoose model

// Test users
const users = [
  "HaoChenLogic", "PriyaKinetics", "Kenji_Sato_AI", "MateoVega_Net", "Svetlana_AI",
  "KwameSynthesizes", "ElaraVoss", "OmarAlghoritm", "Ji-Hoon_Core", "AaravSyntax",
  "Fatima.Kernel", "LarsErikssonAI", "Yuki_Tensor", "Adebola_Nexus", "IsabelaReyes",
  "MarekPetrov", "Ananya_Rao", "JeanLuc_Augment", "DaoOfData", "HikmaCode"
];

// Seed route
router.get("/seed-users", async (req, res) => {
  try {
    let inserted = [];

    // for (const u of users) {
    //   const email = `${u}@gmail.com`;
    //   const exists = await userdb.findOne({ email });

    //   if (!exists) {
    //     // Create new user instance - pre("save") hook will hash password
    //     const newUser = new userdb({
    //       userName: u,
    //       email,
    //       password: `${u}@tumkoram`,
    //       confirmPassword:`${u}@tumkoram` // confirmPassword not stored
    //     });

    //     const saved = await newUser.save();
    //     inserted.push(saved.userName);
    //   }
    // }

    res.status(201).json({
      message: "✅ Test users seeded successfully with hashed passwords",
      insertedCount: inserted.length,
      insertedUsers: inserted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to seed users" });
  }
});


router.get("/delete-test-users", async (req, res) => {
  try {
    const emails = users.map(u => `${u}@gmail.com`);
    const result = await userdb.deleteMany({ email: { $in: emails } });
    res.json({ message: "🗑️ Test users deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete test users" });
  }
});


module.exports = router;
