const express = require("express");
const router = express.Router();
const postdb = require("../models/postSchema");
const postReplydb = require("../models/commentsModel");
const forumdb = require("../models/forumTopicSchema");
const forumReplydb = require("../models/forumReplySchema");

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { decodeId } = require("../utils/hashids");


router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  id = decodeId(id);
  let data, meta;

  try {
    console.log("i m coming hee");

    // Fetch data based on type
    if (type === "post") data = await postdb.findById(id);
    else if (type === "postThread") data = await postReplydb.findById(id);
    else if (type === "forum") data = await forumdb.findById(id);
    else if (type === "forumThread") data = await forumReplydb.findById(id);
    else return res.status(404).send("Type not found");

    if (!data) return res.status(404).send("Content not found");
    // console.log("this is my data", data);

   

    // Assign meta using your helper functions
    if (type === "post") meta = postData(data, id);
    else if (type === "postThread") meta = postComment(data, id);
    else if (type === "forum") meta = forumTopicData(data, id);
    else if (type === "forumThread") meta = forumReplyData(data, id);

    //  meta.image = await convertToJpegAndSave(meta?.image);
    //  console.log("i m coming back from meta data",meta?.image);

    // Generate HTML with dynamic meta tags
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <!-- Open Graph -->
        <meta property="og:title" content="${meta.title}" />
        <meta property="og:description" content="${meta.description}" />
        <meta property="og:image" content="${meta.image}" />
        <meta property="og:url" content="${meta.url}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="${meta.siteName}" />

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${meta.title}" />
        <meta name="twitter:description" content="${meta.description}" />
        <meta name="twitter:image" content="${meta.image}" />
        <meta name="twitter:url" content="${meta.url}" />

        <title>${meta.title}</title>
      </head>
      <body>
        <div id="root"></div>
        <script src="/static/js/bundle.js"></script>
        <script>
          // Redirect to actual page
          window.location.href = "${meta.url}";
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


module.exports = router;

const postData = (data, id) => {
  return {
    title: data.title || "PixxelMind Post",
    description: (data.desc || "Join the discussion on PixxelMind!").substring(0, 150),
    image: data?.imgUrl || "https://pixxelmind.com/default-preview.jpg", // fallback image
    url: `https://pixxelmind.com/userPost/${id}`,
    siteName: "PixxelMind"
  };
};

const postComment = (data, id) => {
  // First AI-generated image
  let image = data?.content?.[0]?.imageUrl?.fileUrl;

  // If no AI image, use first media attachment
  if (!image && data?.mediaAttachments?.length > 0) {
    image = data.mediaAttachments[0].fileUrl;
  }

  return {
    title: data?.content?.[0]?.userText || "PixxelMind thread",
    description: (data?.content?.[0]?.aiText || "Join the discussion on PixxelMind!").substring(0, 150),
    image,
    url: `https://pixxelmind.com/userPost/${data.postId}/${id}`,
    siteName: "PixxelMind"
  };
};


const forumTopicData = (data, id) => {
  // Pick the first image: topic image, or first media attachment, or default
  let image = data?.imageUrl;

  if (!image && data?.mediaAttachments?.length > 0) {
    image = data.mediaAttachments[0].fileUrl;
  }

  if (!image) {
    image = "https://pixxelmind.com/default-preview.jpg";
  }

  return {
    title: data?.title || "PixxelMind Forum Topic",
    description: (data?.content || "Join the discussion on PixxelMind!").substring(0, 150),
    image,
    url: `https://pixxelmind.com/forum/topic/${id}`,
    siteName: "PixxelMind"
  };
};


const forumReplyData = (data, id) => {
  // Pick the first image
  let image = data?.content?.[0]?.imageUrl?.fileUrl;

  if (!image && data?.mediaAttachments?.length > 0) {
    image = data.mediaAttachments[0].fileUrl;
  }

  if (!image) {
    image = "https://pixxelmind.com/default-preview.jpg";
  }

  return {
    title: data?.content?.[0]?.userText || "PixxelMind Forum Reply",
    description: (data?.content?.[0]?.aiText || data?.description || "Join the discussion on PixxelMind!").substring(0, 150),
    image,
    url: `https://pixxelmind.com/forum/topic/${data.topicId}/${id}`,
    siteName: "PixxelMind"
  };
};


async function convertToJpegAndSave(url) {
  try {
    // Fetch the image
    const response = await axios({ url, responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // Convert to JPEG
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate a unique filename
    const fileName = `${uuidv4()}.jpg`;
    const publicDir = path.join(__dirname, "../public/uploads"); // make sure folder exists
    const filePath = path.join(publicDir, fileName);

    // Save the file
    fs.writeFileSync(filePath, jpegBuffer);

    // Return a public URL
    return `https://pixxelmind.com/uploads/${fileName}`;
  } catch (err) {
    console.error("Image conversion failed:", err);
    return url; // fallback to original
  }
}


