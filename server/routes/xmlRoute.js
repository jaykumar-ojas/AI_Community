

const express = require("express");
const router = new express.Router();
const { format } = require("date-fns");

// Import Mongoose models
const postdb = require("../models/postSchema");
const topicdb = require("../models/forumTopicSchema");
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const {encodeId} = require('../utils/hashids');



router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://pixxelmind.com";
    const now = format(new Date(), "yyyy-MM-dd");

    // ---- STATIC ROUTES ----
    const staticRoutes = [
      "/", "/forgot-password", "/login", "/register",
      "/update-password/placeholder", "/post", "/forum", "/feedback"
    ];

    let urls = staticRoutes.map(
      (path) => `<url><loc>${baseUrl}${path}</loc><lastmod>${now}</lastmod></url>`
    );

    // ---- FETCH DYNAMIC DATA FROM DATABASE ----
    const [users, posts, topics, googleUsers] = await Promise.all([
      userdb.find({}, "_id updatedAt"),
      postdb.find({}, "_id updatedAt"),
      topicdb.find({}, "topicId updatedAt"),
      googledb.find({}, "_id updatedAt")
    ]);

    // ---- USERS ----
    users.forEach(u => {
      const lastMod = u.updatedAt ? format(u.updatedAt, "yyyy-MM-dd") : now;
      urls.push(`<url><loc>${baseUrl}/userprofile/${encodeId(u._id)}</loc><lastmod>${lastMod}</lastmod></url>`);
    });

    // ---- GOOGLE USERS (if you use a different model for social logins) ----
    googleUsers.forEach(g => {
      const lastMod = g.updatedAt ? format(g.updatedAt, "yyyy-MM-dd") : now;
      urls.push(`<url><loc>${baseUrl}/userprofile/${encodeId(g._id)}</loc><lastmod>${lastMod}</lastmod></url>`);
    });

    // ---- POSTS ----
    posts.forEach(p => {
      const lastMod = p.updatedAt ? format(p.updatedAt, "yyyy-MM-dd") : now;
      urls.push(`<url><loc>${baseUrl}/userPost/${p._id}</loc><lastmod>${lastMod}</lastmod></url>`);
      urls.push(`<url><loc>${baseUrl}/userPost/edit/${p._id}</loc><lastmod>${lastMod}</lastmod></url>`);
    });

    // ---- FORUM TOPICS ----
    topics.forEach(t => {
      const lastMod = t.updatedAt ? format(t.updatedAt, "yyyy-MM-dd") : now;
      urls.push(`<url><loc>${baseUrl}/forum/topic/${encodeId(t._id)}</loc><lastmod>${lastMod}</lastmod></url>`);
    });

    // ---- FINAL XML OUTPUT ----
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.join("\n")}
    </urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);

  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;
