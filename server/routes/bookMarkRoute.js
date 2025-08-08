const express = require('express');
const router = new express.Router();
const userdb = require("../models/userSchema");
const postdb = require("../models/postSchema");
const googledb = require("../models/googleSchema");
const bookMarkdb = require("../models/BookMark");
const authenticate = require('../middleware/authenticate');
const { decodeId, encodeId } = require('../utils/hashids');

router.post('/bookMark/:userId/:postId', authenticate, async (req, res) => {
  try {
    console.log("1");
    const { userId, postId } = req.params;
    console.log(2);
    if (!userId || !postId) {
      console.log(10);
      return res.status(400).json({ error: "Missing userId or postId" });
    }
    console.log(4);

    const userData = await userdb.findById(userId)  || await googledb.findOne({_id:userId});
    const postData = await postdb.findById(postId);
    console.log(5);

    if (!userData || !postData) {
      return res.status(404).json({ error: "User or Post not found" });
    }
    console.log(3);

    console.log("2");

    let bookMarkData = await bookMarkdb.findOne({ userId });

    let message = "";
    console.log(3);

    if (bookMarkData) {
      const index = bookMarkData.savedPostId.indexOf(postId);

      if (index !== -1) {
        // Post already bookmarked → remove it from user's list
        bookMarkData.savedPostId.splice(index, 1);

        // Remove userId from post's bookMark array
        const postIndex = postData.bookMark.indexOf(userId);
        if (postIndex !== -1) {
          postData.bookMark.splice(postIndex, 1);
        }

        message = "Bookmark removed";
      } else {
        // Post not bookmarked → add to user's list
        bookMarkData.savedPostId.push(postId);

        // Add userId to post's bookMark array
        if (!postData.bookMark.includes(userId)) {
          postData.bookMark.push(userId);
        }

        message = "Bookmark added";
      }

      await bookMarkData.save();
    } else {
      // No bookmark record → create one and add post
      bookMarkData = new bookMarkdb({
        userId,
        savedPostId: [postId]
      });

      await bookMarkData.save();

      // Add userId to post's bookMark array
      if (!postData.bookMark.includes(userId)) {
        postData.bookMark.push(userId);
      }

      message = "Bookmark created and post added";
    }

    await postData.save(); // Save updated postData with updated bookMark array
    console.log("i m going");
    res.status(200).json({ message, data: bookMarkData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while toggling bookmark" });
  }
});




router.get("/savedPost/:userId", authenticate, async (req, res) => {
  console.log("i m coming here");
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ status: "fail", error: "User ID not provided" });
    }

    const realUserId = decodeId(userId);
    if (!realUserId) {
      return res.status(400).json({ status: "fail", error: "Invalid user ID" });
    }

    console.log("i go for fining bookMark data");

    const userBookmarks = await bookMarkdb.findOne({ "userId": realUserId });

        console.log("i go for fining bookMark  back data",userBookmarks);

    if (!userBookmarks || !userBookmarks.savedPostId || userBookmarks.savedPostId.length === 0) {
      return res.status(200).json({ status: "success", savedPost: [] });
    }
    
        console.log("i get it for fining bookMark data");

    // Assuming `postIds` is an array of post IDs
    const savedPost = await Promise.all(
      userBookmarks.savedPostId.map((id) => postdb.findById(id))
    );

    res.status(200).json({ status: "success", savedPost });
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

module.exports = router;
