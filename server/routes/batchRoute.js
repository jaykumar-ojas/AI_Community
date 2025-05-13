const cron = require('node-cron');
// global.crypto = require('crypto').webcrypto;
const {
    updateUrlFromUserPost,
    updateUrlFromReplies,
    updateUrlFromTopic,
    updateUrlFromComment
} = require('../middleware/batchJob');

const express = require("express");
const router = express.Router();





async function runBatchJob(batchSize = 10) {
    await updateUrlFromUserPost();
    await updateUrlFromReplies();
    await updateUrlFromTopic();
    await updateUrlFromComment();
}



cron.schedule('0 9,18 * * *', async () => {
  console.log('Starting batch job...');
  await runBatchJob();
});


router.get('/startBatchJob',async(req,res)=>{
 try {
    await runBatchJob();
    res.status(200).json({ message: "Batch job completed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Batch job failed." });
  }
})

module.exports = router;