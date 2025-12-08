const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const modelCreditConfig = require("../config/modelCreditConfig");

// Middleware to validate user's credit
const validateCredit = async (req, res, next) => {
    try {
        const {model,type} = req.body;
        const userId= req.userId;
        const modelCredit = modelCreditConfig[type][model].cost;

        // Find user in either collection
        console.log("i got credit alos",modelCredit);
        const user = await userdb.findById(userId) || await googledb.findById(userId);

        if (!user) {
            return res.status(400).json({ 
                status: 400, 
                message: "User does not exist" 
            });
        }

        // Check if user has enough credit
        if (user.credit >= modelCredit) {
            req.user = user; // attach user to req for later use
            next();
        } else {
            return res.status(403).json({
                status: 403,
                message: user.credit === 0
                ? "You have 0 credits left. Your credits will refresh at 12 AM IST."
                : `Insufficient credit. You have ${user.credit} credits left, but this model requires ${modelCredit}.`,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 500, 
            error: "Internal server error" 
        });
    }
};


const reduceCredit = async (userId,credit) => {
    try {
        const user = await userdb.findById(userId) || await googledb.findById(userId);
        if (!user) return;

        user.credit = Math.max(0, user.credit - credit); 
        await user.save();




        console.log(`Credit reduced. New credit: ${user.credit}`);
        return user.credit;
    } catch (error) {
        console.error("Error reducing credit:", error);
    }
};

const DEFAULT_CREDIT = 100;
const DEFAULT_CHUNK_SIZE = 500;


async function resetCreditsForModel(model, opts = {}) {
  const DEFAULT_CREDIT = 100;
  const DEFAULT_CHUNK_SIZE = 500;

  const defaultCredit = typeof opts.defaultCredit === "number" ? opts.defaultCredit : DEFAULT_CREDIT;
  const chunkSize = typeof opts.chunkSize === "number" ? opts.chunkSize : DEFAULT_CHUNK_SIZE;

  const pipeline = [
    { $project: { _id: 1, promoCode: 1, credit: 1 } }, // include current credit to avoid extra reads
    {
      $addFields: {
        sortedPromos: {
          $cond: [
            { $isArray: "$promoCode" },
            {
              $sortArray: {
                input: "$promoCode",
                sortBy: { priority: -1, appliedAt: -1 }
              }
            },
            []
          ]
        }
      }
    },
    { $project: { topPromo: { $arrayElemAt: ["$sortedPromos", 0] }, credit: 1 } }
  ];

  const ops = [];
  let processed = 0;
  let toUpdate = 0;
  let updated = 0;

  try {
    // build aggregation
    const agg = model.aggregate(pipeline);

    // Try to get a cursor (supported by mongoose aggregate)
    let cursor;
    try {
      cursor = agg.cursor({ batchSize: 500 }); // DO NOT call .exec() on the cursor
    } catch (e) {
      // Some older setups may throw here; we'll handle fallback below
      cursor = null;
    }

    if (cursor) {
      // Preferred: use async iterator if available
      if (typeof cursor[Symbol.asyncIterator] === "function") {
        for await (const doc of cursor) {
          processed++;
          const top = doc.topPromo || null;
          const currentCredit = typeof doc.credit === "number" ? doc.credit : null;

          const newCredit =
            top && typeof top.creditValue === "number" && !Number.isNaN(top.creditValue)
              ? top.creditValue
              : defaultCredit;

          if (currentCredit !== null && currentCredit === newCredit) continue;

          toUpdate++;
          ops.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { credit: newCredit } }
            }
          });

          if (ops.length >= chunkSize) {
            const res = await model.bulkWrite(ops, { ordered: false });
            updated += (res.modifiedCount ?? res.nModified ?? 0);
            ops.length = 0;
          }
        }
      } else if (typeof cursor.eachAsync === "function") {
        // Older cursor API: use eachAsync
        await cursor.eachAsync(async (doc) => {
          processed++;
          const top = doc.topPromo || null;
          const currentCredit = typeof doc.credit === "number" ? doc.credit : null;

          const newCredit =
            top && typeof top.creditValue === "number" && !Number.isNaN(top.creditValue)
              ? top.creditValue
              : defaultCredit;

          if (currentCredit !== null && currentCredit === newCredit) return;

          toUpdate++;
          ops.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { credit: newCredit } }
            }
          });

          if (ops.length >= chunkSize) {
            const res = await model.bulkWrite(ops, { ordered: false });
            updated += (res.modifiedCount ?? res.nModified ?? 0);
            ops.length = 0;
          }
        });
      } else {
        // Last-resort: load small batches via aggregate().exec() if cursor lacks useful iteration
        const docs = await model.aggregate(pipeline).exec();
        for (const doc of docs) {
          processed++;
          const top = doc.topPromo || null;
          const currentCredit = typeof doc.credit === "number" ? doc.credit : null;

          const newCredit =
            top && typeof top.creditValue === "number" && !Number.isNaN(top.creditValue)
              ? top.creditValue
              : defaultCredit;

          if (currentCredit !== null && currentCredit === newCredit) continue;

          toUpdate++;
          ops.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { credit: newCredit } }
            }
          });

          if (ops.length >= chunkSize) {
            const res = await model.bulkWrite(ops, { ordered: false });
            updated += (res.modifiedCount ?? res.nModified ?? 0);
            ops.length = 0;
          }
        }
      }
    } else {
      // If .cursor() failed earlier, fallback to aggregation exec (may be memory heavy)
      const docs = await model.aggregate(pipeline).exec();
      for (const doc of docs) {
        processed++;
        const top = doc.topPromo || null;
        const currentCredit = typeof doc.credit === "number" ? doc.credit : null;

        const newCredit =
          top && typeof top.creditValue === "number" && !Number.isNaN(top.creditValue)
            ? top.creditValue
            : defaultCredit;

        if (currentCredit !== null && currentCredit === newCredit) continue;

        toUpdate++;
        ops.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { credit: newCredit } }
          }
        });

        if (ops.length >= chunkSize) {
          const res = await model.bulkWrite(ops, { ordered: false });
          updated += (res.modifiedCount ?? res.nModified ?? 0);
          ops.length = 0;
        }
      }
    }

    // flush remaining ops
    if (ops.length > 0) {
      const res = await model.bulkWrite(ops, { ordered: false });
      updated += (res.modifiedCount ?? res.nModified ?? 0);
      ops.length = 0;
    }

    return { success: true, processed, toUpdate, updated };
  } catch (err) {
    console.error("resetCreditsForModel error:", err);
    return { success: false, error: err.message || String(err), processed, toUpdate, updated };
  }
}


async function resetAllCredits() {
  const userModel = userdb;
  const googleModel = googledb;

  try {
    const tasks = [];
    if (userModel) tasks.push(resetCreditsForModel(userModel));   // <-- opts removed
    if (googleModel) tasks.push(resetCreditsForModel(googleModel)); // <-- opts removed

    const [userRes, googleRes] = await Promise.all(tasks);

    console.log("✅ User collection:", userRes);
    console.log("✅ Google collection:", googleRes);

    return { user: userRes, google: googleRes };
  } catch (err) {
    console.error("❌ Error resetting credits for collections:", err);
    throw err;
  }
}





module.exports = { validateCredit, reduceCredit,resetAllCredits };
