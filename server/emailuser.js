/**
 * Pixxelmind Community Digest Email Sender
 * 
 * This script sends community digest emails to users with updates about:
 * - Today's posts, comments, forum topics, and replies
 * - Popular communities they might like
 * - Custom founder messages
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Send to all users (today's content):
 *    node emailuser.js --all
 * 
 * 2. Send to specific users by email:
 *    node emailuser.js --users user@example.com,another@example.com
 * 
 * 3. Send to specific users by user ID:
 *    node emailuser.js --users 507f1f77bcf86cd799439011,507f191e810c19729de860ea
 * 
 * 4. Send to all users with specific content types (last 7 days):
 *    node emailuser.js --all --content posts,comments,topics --days 7
 * 
 * 5. Send with founder message:
 *    node emailuser.js --all --founder-message "Welcome to our community! We're excited to have you here."
 * 
 * 6. Send with custom limit and days:
 *    node emailuser.js --all --limit 5 --days 3
 * 
 * 7. Complete example:
 *    node emailuser.js --users user@example.com --content all --days 1 --limit 10 --founder-message "Check out today's discussions!"
 * 
 * OPTIONS:
 *   --all                    Send to all users
 *   --users <list>           Comma-separated list of emails or user IDs
 *   --content <types>        Content types: posts,comments,topics,replies,all (default: all)
 *   --days <number>          Number of days to look back (default: 1)
 *   --limit <number>         Number of items per content type (default: 10)
 *   --founder-message <text> Custom founder message to include in email
 * 
 * REQUIREMENTS:
 *   - Valid .env file with EMAIL_USER, EMAIL_PASS, and MONGODB_URL
 *   - Database connection
 */

const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const userdb = require("./models/userSchema");
const googledb = require("./models/googleSchema");
const postdb = require("./models/postSchema");
const Comment = require("./models/commentsModel");
const ForumTopic = require("./models/forumTopicSchema");
const ForumReply = require("./models/forumReplySchema");
const { encodeId } = require("./utils/hashids");

// Load environment variables
dotenv.config();

// Database connection
const DB = process.env.MONGODB_URL;
const BASE_URL = "https://www.pixxelmind.com";

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  sendToAll: args.includes("--all"),
  userEmails: [],
  userIds: [],
  contentTypes: ["all"], // posts, comments, topics, replies, all
  days: 1,
  founderMessage: null,
  limit: 10, // Number of items per content type
};

// Parse user emails or IDs
const usersIndex = args.indexOf("--users");
if (usersIndex !== -1 && args[usersIndex + 1]) {
  const userList = args[usersIndex + 1].split(",").map((u) => u.trim());
  userList.forEach((user) => {
    if (user.includes("@")) {
      config.userEmails.push(user);
    } else {
      config.userIds.push(user);
    }
  });
}

// Parse content types
const contentIndex = args.indexOf("--content");
if (contentIndex !== -1 && args[contentIndex + 1]) {
  config.contentTypes = args[contentIndex + 1]
    .split(",")
    .map((c) => c.trim().toLowerCase());
}

// Parse days
const daysIndex = args.indexOf("--days");
if (daysIndex !== -1 && args[daysIndex + 1]) {
  config.days = parseInt(args[daysIndex + 1]) || 1;
}

// Parse founder message
const founderIndex = args.indexOf("--founder-message");
if (founderIndex !== -1 && args[founderIndex + 1]) {
  config.founderMessage = args[founderIndex + 1];
}

// Parse limit
const limitIndex = args.indexOf("--limit");
if (limitIndex !== -1 && args[limitIndex + 1]) {
  config.limit = parseInt(args[limitIndex + 1]) || 10;
}

// Helper function to get date range
function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}

// Fetch today's posts
async function getTodayPosts(limit = 10) {
  const { startDate, endDate } = getDateRange(config.days);
  try {
    const posts = await postdb
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch user info for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        let userName = "Unknown";
        try {
          // userId is stored as a string, try to find user
          const userId = post.userId;
          if (userId) {
            // Try to find user by ID (handle both ObjectId and string)
            let user = null;
            try {
              user = await userdb.findById(userId).select("userName").lean();
            } catch (e) {
              // If not found, try google users
              try {
                user = await googledb.findById(userId).select("userName").lean();
              } catch (e2) {
                // User not found, use default
              }
            }
            if (user) {
              userName = user.userName || "Unknown";
            }
          }
        } catch (error) {
          // If error fetching user, use default
          console.error(`Error fetching user for post ${post._id}:`, error.message);
        }

        return {
          id: post._id,
          description: post.desc || "",
          imgUrl: post.imgUrl || "",
          userName: userName,
          userId: post.userId,
          likes: post.likes?.length || 0,
          createdAt: post.createdAt,
          url: `${BASE_URL}/userPost/${encodeId(post._id.toString())}`,
          isAIGenerated: post.isAIGenerated || false,
          aiModel: post.aiModel || "",
        };
      })
    );

    return postsWithUsers;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Fetch today's comments
async function getTodayComments(limit = 10) {
  const { startDate, endDate } = getDateRange(config.days);
  try {
    const comments = await Comment.find({
      createdAt: { $gte: startDate, $lte: endDate },
      parentReplyId: null, // Only top-level comments
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("postId", "desc imgUrl")
      .populate("userId", "userName email")
      .lean();

    return comments.map((comment) => {
      const firstContent = comment.content?.[0] || {};
      const textContent =
        firstContent.userText ||
        firstContent.aiText ||
        firstContent.prompt ||
        "";
      return {
        id: comment._id,
        content: textContent.substring(0, 150) + (textContent.length > 150 ? "..." : ""),
        userName: comment.userName || "Unknown",
        postId: comment.postId?._id,
        postDesc: comment.postId?.desc || "",
        likes: comment.likes?.length || 0,
        createdAt: comment.createdAt,
        url: `${BASE_URL}/userPost/${encodeId(comment.postId?._id?.toString() || "")}/${encodeId(comment._id.toString())}`,
      };
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

// Fetch today's forum topics (communities)
async function getTodayTopics(limit = 10) {
  const { startDate, endDate } = getDateRange(config.days);
  try {
    const topics = await ForumTopic.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "userName email")
      .lean();

    return topics.map((topic) => ({
      id: topic._id,
      title: topic.title,
      content: (topic.content || "").substring(0, 200) + (topic.content?.length > 200 ? "..." : ""),
      userName: topic.userName || "Unknown",
      viewCount: topic.viewCount || 0,
      replyCount: topic.replyCount || 0,
      likes: topic.likes?.length || 0,
      tags: topic.tags || [],
      joined: topic.joined?.length || 0,
      createdAt: topic.createdAt,
      url: `${BASE_URL}/forum/topic/${encodeId(topic._id.toString())}`,
    }));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
}

// Fetch today's forum replies
async function getTodayForumReplies(limit = 10) {
  const { startDate, endDate } = getDateRange(config.days);
  try {
    const replies = await ForumReply.find({
      createdAt: { $gte: startDate, $lte: endDate },
      parentReplyId: null, // Only top-level replies
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("topicId", "title")
      .populate("userId", "userName email")
      .lean();

    return replies.map((reply) => {
      const firstContent = reply.content?.[0] || {};
      const textContent =
        firstContent.userText ||
        firstContent.aiText ||
        firstContent.prompt ||
        reply.description ||
        "";
      return {
        id: reply._id,
        content: textContent.substring(0, 150) + (textContent.length > 150 ? "..." : ""),
        userName: reply.userName || "Unknown",
        topicId: reply.topicId?._id,
        topicTitle: reply.topicId?.title || "",
        likes: reply.likes?.length || 0,
        isAnswer: reply.isAnswer || false,
        createdAt: reply.createdAt,
        url: `${BASE_URL}/forum/topic/${encodeId(reply.topicId?._id?.toString() || "")}/${encodeId(reply._id.toString())}`,
      };
    });
  } catch (error) {
    console.error("Error fetching forum replies:", error);
    return [];
  }
}

// Get popular communities (topics with most members)
async function getPopularCommunities(limit = 5) {
  try {
    const topics = await ForumTopic.find({
      "joined.0": { $exists: true }, // Has at least one member
    })
      .sort({ joined: -1 })
      .limit(limit)
      .select("title joined replyCount viewCount tags")
      .lean();

    return topics.map((topic) => ({
      id: topic._id,
      title: topic.title,
      members: topic.joined?.length || 0,
      replies: topic.replyCount || 0,
      views: topic.viewCount || 0,
      tags: topic.tags || [],
      url: `${BASE_URL}/forum/topic/${encodeId(topic._id.toString())}`,
    }));
  } catch (error) {
    console.error("Error fetching popular communities:", error);
    return [];
  }
}

// Generate email HTML content
function generateEmailHTML(userName, data) {
  const {
    posts,
    comments,
    topics,
    forumReplies,
    popularCommunities,
    founderMessage,
  } = data;

  const hasContent = posts.length > 0 || comments.length > 0 || topics.length > 0 || forumReplies.length > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pixxelmind Community Digest</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #ff6a00, #ff8c42); padding:30px 20px;">
              <!-- Logo with table wrapper for better email client support -->
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:15px;">
                <tr>
                  <td align="center" style="background-color:#ffffff; padding:8px;">
                    <img src="https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/48926f359a03dabb7e9976759b69d5182477be7bc82b1fb41aacd5fa7ae4cc82.webp" width="80" height="80" alt="Pixxelmind Logo" style="display:block; width:80px; height:80px; border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic;">
                  </td>
                </tr>
              </table>
              <h1 style="margin:0; font-size:24px; color:#ffffff; font-weight:600;">Community Digest</h1>
              <p style="margin:10px 0 0; font-size:14px; color:#fff8f0;">What's happening in your community</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:30px; color:#333333;">
              <h2 style="margin-top:0; color:#ff6a00; font-size:20px;">Hello ${userName || "there"},</h2>
              <p style="font-size:16px; line-height:1.6; color:#555555;">
                Here's what's been happening in the Pixxelmind community ${config.days === 1 ? 'today' : `in the last ${config.days} days`}:
              </p>
            </td>
          </tr>

          ${founderMessage ? `
          <!-- Founder Message -->
          <tr>
            <td style="padding:0 30px;">
              <div style="background:linear-gradient(135deg, #fef3c7, #fde68a); border-left:4px solid #f59e0b; border-radius:8px; padding:20px; margin-bottom:25px;">
                <h3 style="margin-top:0; color:#92400e; font-size:18px;">💬 Message from the Founder</h3>
                <p style="margin:10px 0 0; color:#78350f; font-size:15px; line-height:1.6;">${founderMessage}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${!hasContent ? `
          <!-- No Content -->
          <tr>
            <td style="padding:0 30px 30px;">
              <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:30px; text-align:center;">
                <p style="margin:0; color:#6b7280; font-size:16px;">No new activity to share ${config.days === 1 ? 'today' : `in the last ${config.days} days`}. Check back soon!</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${topics.length > 0 && (config.contentTypes.includes("all") || config.contentTypes.includes("topics")) ? `
          <!-- Today's Communities -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px; color:#ff6a00; font-size:18px; border-bottom:2px solid #ffe5d4; padding-bottom:10px;">
                🔥 Trending Communities
              </h3>
              ${topics.slice(0, config.limit).map((topic) => `
                <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:15px; margin-bottom:12px;">
                  <h4 style="margin:0 0 8px; color:#1f2937; font-size:16px;">
                    <a href="${topic.url}" style="color:#ff6a00; text-decoration:none; font-weight:600;">${topic.title}</a>
                  </h4>
                  <p style="margin:0 0 10px; color:#6b7280; font-size:14px; line-height:1.5;">${topic.content}</p>
                  <div style="font-size:12px; color:#9ca3af; line-height:1.8;">
                    <span>👤 ${topic.userName}</span>
                    <span style="margin-left:15px;">👁️ ${topic.viewCount} views</span>
                    <span style="margin-left:15px;">💬 ${topic.replyCount} replies</span>
                    <span style="margin-left:15px;">❤️ ${topic.likes} likes</span>
                    ${topic.tags.length > 0 ? `<br><span style="margin-top:8px; display:inline-block;">🏷️ ${topic.tags.slice(0, 3).join(", ")}</span>` : ''}
                  </div>
                </div>
              `).join("")}
              ${topics.length > config.limit ? `<p style="text-align:center; margin-top:15px;"><a href="${BASE_URL}/community" style="color:#ff6a00; text-decoration:none; font-weight:600;">View All Communities →</a></p>` : ''}
            </td>
          </tr>
          ` : ''}

          ${posts.length > 0 && (config.contentTypes.includes("all") || config.contentTypes.includes("posts")) ? `
          <!-- Today's Posts -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px; color:#ff6a00; font-size:18px; border-bottom:2px solid #ffe5d4; padding-bottom:10px;">
                📸 Latest Posts
              </h3>
              ${posts.slice(0, config.limit).map((post) => `
                <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:15px; margin-bottom:12px;">
                  ${post.imgUrl ? `
                    <div style="margin-bottom:10px;">
                      <img src="${post.imgUrl}" alt="Post image" style="max-width:100%; height:auto; border-radius:6px; display:block; border:0;">
                    </div>
                  ` : ''}
                  ${post.description ? `<p style="margin:0 0 10px; color:#374151; font-size:14px; line-height:1.5;">${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}</p>` : ''}
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                    <tr>
                      <td style="font-size:12px; color:#9ca3af;">
                        <span>👤 ${post.userName}</span>
                        <span style="margin-left:15px;">❤️ ${post.likes}</span>
                        ${post.isAIGenerated ? `<span style="margin-left:15px;">🤖 ${post.aiModel}</span>` : ''}
                      </td>
                      <td align="right">
                        <a href="${post.url}" style="color:#ff6a00; text-decoration:none; font-weight:600; font-size:13px;">View Post →</a>
                      </td>
                    </tr>
                  </table>
                </div>
              `).join("")}
            </td>
          </tr>
          ` : ''}

          ${comments.length > 0 && (config.contentTypes.includes("all") || config.contentTypes.includes("comments")) ? `
          <!-- Today's Comments -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px; color:#ff6a00; font-size:18px; border-bottom:2px solid #ffe5d4; padding-bottom:10px;">
                💬 Hot Comments
              </h3>
              ${comments.slice(0, config.limit).map((comment) => `
                <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:15px; margin-bottom:12px;">
                  <p style="margin:0 0 8px; color:#374151; font-size:14px; line-height:1.5; font-style:italic;">"${comment.content}"</p>
                  ${comment.postDesc ? `<p style="margin:0 0 10px; color:#6b7280; font-size:12px;">On: ${comment.postDesc.substring(0, 100)}${comment.postDesc.length > 100 ? '...' : ''}</p>` : ''}
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                    <tr>
                      <td style="font-size:12px; color:#9ca3af;">
                        <span>👤 ${comment.userName}</span>
                        <span style="margin-left:15px;">❤️ ${comment.likes}</span>
                      </td>
                      <td align="right">
                        <a href="${comment.url}" style="color:#ff6a00; text-decoration:none; font-weight:600; font-size:13px;">View Comment →</a>
                      </td>
                    </tr>
                  </table>
                </div>
              `).join("")}
            </td>
          </tr>
          ` : ''}

          ${forumReplies.length > 0 && (config.contentTypes.includes("all") || config.contentTypes.includes("replies")) ? `
          <!-- Today's Forum Replies -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px; color:#ff6a00; font-size:18px; border-bottom:2px solid #ffe5d4; padding-bottom:10px;">
                💭 Forum Discussions
              </h3>
              ${forumReplies.slice(0, config.limit).map((reply) => `
                <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:15px; margin-bottom:12px;">
                  ${reply.isAnswer ? `<span style="background-color:#10b981; color:#ffffff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; margin-bottom:8px; display:inline-block;">✓ Accepted Answer</span>` : ''}
                  <h4 style="margin:${reply.isAnswer ? '8px 0 8px' : '0 0 8px'}; color:#1f2937; font-size:15px;">
                    <a href="${reply.url}" style="color:#ff6a00; text-decoration:none; font-weight:600;">${reply.topicTitle || "Discussion"}</a>
                  </h4>
                  <p style="margin:0 0 10px; color:#374151; font-size:14px; line-height:1.5;">${reply.content}</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                    <tr>
                      <td style="font-size:12px; color:#9ca3af;">
                        <span>👤 ${reply.userName}</span>
                        <span style="margin-left:15px;">❤️ ${reply.likes}</span>
                      </td>
                      <td align="right">
                        <a href="${reply.url}" style="color:#ff6a00; text-decoration:none; font-weight:600; font-size:13px;">View Reply →</a>
                      </td>
                    </tr>
                  </table>
                </div>
              `).join("")}
            </td>
          </tr>
          ` : ''}

          ${popularCommunities.length > 0 ? `
          <!-- Popular Communities You Might Like -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px; color:#ff6a00; font-size:18px; border-bottom:2px solid #ffe5d4; padding-bottom:10px;">
                🌟 Communities You Might Like
              </h3>
              ${popularCommunities.slice(0, 5).map((community) => `
                <div style="background-color:#fff8f0; border:1px solid #ffe5d4; border-radius:8px; padding:15px; margin-bottom:12px;">
                  <h4 style="margin:0 0 8px; color:#1f2937; font-size:16px;">
                    <a href="${community.url}" style="color:#ff6a00; text-decoration:none; font-weight:600;">${community.title}</a>
                  </h4>
                  <div style="font-size:12px; color:#9ca3af; line-height:1.8;">
                    <span>👥 ${community.members} members</span>
                    <span style="margin-left:15px;">💬 ${community.replies} replies</span>
                    <span style="margin-left:15px;">👁️ ${community.views} views</span>
                    ${community.tags.length > 0 ? `<br><span style="margin-top:8px; display:inline-block;">🏷️ ${community.tags.slice(0, 3).join(", ")}</span>` : ''}
                  </div>
                </div>
              `).join("")}
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 30px 30px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg, #ff6a00, #ff8c42); border-radius:8px;">
                    <a href="${BASE_URL}" style="display:inline-block; color:#ffffff; text-decoration:none; padding:14px 28px; font-weight:600; font-size:16px; border-radius:8px;">Visit Pixxelmind</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fff8f0; padding:20px 30px; text-align:center; border-top:1px solid #ffe5d4;">
              <p style="margin:0 0 10px; color:#6b7280; font-size:14px;">
                <strong>Pixxelmind Community</strong>
              </p>
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                <a href="${BASE_URL}" style="color:#ff6a00; text-decoration:none;">Website</a> |
                <a href="mailto:system.pixxelmind@gmail.com" style="color:#ff6a00; text-decoration:none;">Contact Support</a>
              </p>
              <p style="margin:15px 0 0; font-size:11px; color:#9ca3af;">
                You're receiving this because you're part of the Pixxelmind community.<br>
                You can manage your email preferences in your account settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send email to a single user
async function sendEmailToUser(user) {
  try {
    const email = user.email || user.userName + "@unknown.com";
    const userName = user.userName || "there";

    // Fetch all content based on config
    const contentPromises = [];
    
    if (config.contentTypes.includes("all") || config.contentTypes.includes("posts")) {
      contentPromises.push(getTodayPosts(config.limit));
    } else {
      contentPromises.push(Promise.resolve([]));
    }

    if (config.contentTypes.includes("all") || config.contentTypes.includes("comments")) {
      contentPromises.push(getTodayComments(config.limit));
    } else {
      contentPromises.push(Promise.resolve([]));
    }

    if (config.contentTypes.includes("all") || config.contentTypes.includes("topics")) {
      contentPromises.push(getTodayTopics(config.limit));
      contentPromises.push(getPopularCommunities(5));
    } else {
      contentPromises.push(Promise.resolve([]));
      contentPromises.push(Promise.resolve([]));
    }

    if (config.contentTypes.includes("all") || config.contentTypes.includes("replies")) {
      contentPromises.push(getTodayForumReplies(config.limit));
    } else {
      contentPromises.push(Promise.resolve([]));
    }

    const [posts, comments, topics, popularCommunities, forumReplies] = await Promise.all(contentPromises);

    const emailHTML = generateEmailHTML(userName, {
      posts,
      comments,
      topics,
      forumReplies,
      popularCommunities,
      founderMessage: config.founderMessage,
    });

    const mailOptions = {
      from: `"Pixxelmind" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📬 Pixxelmind Community Digest ${config.days === 1 ? '- Today' : `- Last ${config.days} Days`}`,
      html: emailHTML,
      text: `Hello ${userName},\n\nHere's what's been happening in the Pixxelmind community. Visit ${BASE_URL} to see more!\n\nBest regards,\nPixxelmind Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email} (${info.messageId})`);
    return { success: true, email, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email || user.userName}:`, error.message);
    return { success: false, email: user.email || user.userName, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log("🚀 Starting email digest script...\n");

    // Connect to database
    console.log("📡 Connecting to database...");
    await mongoose.connect(DB, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("✅ Database connected\n");

    // Get users to send emails to
    let users = [];

    if (config.sendToAll) {
      console.log("📧 Fetching all users...");
      const regularUsers = await userdb.find({ email: { $exists: true, $ne: "" } }).select("email userName").lean();
      const googleUsers = await googledb.find({ email: { $exists: true, $ne: "" } }).select("email userName").lean();
      users = [...regularUsers, ...googleUsers];
      console.log(`✅ Found ${users.length} users\n`);
    } else if (config.userEmails.length > 0 || config.userIds.length > 0) {
      console.log("📧 Fetching specific users...");
      const userPromises = [];

      if (config.userEmails.length > 0) {
        userPromises.push(
          userdb.find({ email: { $in: config.userEmails } }).select("email userName").lean(),
          googledb.find({ email: { $in: config.userEmails } }).select("email userName").lean()
        );
      }

      if (config.userIds.length > 0) {
        userPromises.push(
          userdb.find({ _id: { $in: config.userIds } }).select("email userName").lean(),
          googledb.find({ _id: { $in: config.userIds } }).select("email userName").lean()
        );
      }

      const userResults = await Promise.all(userPromises);
      users = userResults.flat().filter((user, index, self) => 
        index === self.findIndex((u) => u.email === user.email)
      );
      console.log(`✅ Found ${users.length} users\n`);
    } else {
      console.log("❌ Error: Please specify --all or --users <emails/ids>");
      console.log("\nUsage examples:");
      console.log("  node emailuser.js --all");
      console.log("  node emailuser.js --users user@example.com,another@example.com");
      console.log("  node emailuser.js --all --content posts,comments --days 7");
      console.log("  node emailuser.js --users user@example.com --founder-message \"Welcome to our community!\"");
      process.exit(1);
    }

    if (users.length === 0) {
      console.log("❌ No users found to send emails to");
      process.exit(1);
    }

    // Display configuration
    console.log("⚙️  Configuration:");
    console.log(`   - Sending to: ${config.sendToAll ? "All users" : "Specific users"}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Content types: ${config.contentTypes.join(", ")}`);
    console.log(`   - Days: ${config.days}`);
    console.log(`   - Limit per type: ${config.limit}`);
    if (config.founderMessage) {
      console.log(`   - Founder message: ${config.founderMessage.substring(0, 50)}...`);
    }
    console.log("");

    // Send emails with delay to avoid rate limiting
    console.log("📨 Sending emails...\n");
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.email) {
        console.log(`⚠️  Skipping user ${user.userName || user._id} - no email`);
        results.failed++;
        continue;
      }

      const result = await sendEmailToUser(user);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ email: result.email, error: result.error });
      }

      // Add delay between emails (500ms) to avoid rate limiting
      if (i < users.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    console.log(`   ✅ Success: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    if (results.errors.length > 0) {
      console.log("\n❌ Errors:");
      results.errors.forEach((err) => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }
    console.log("=".repeat(50));

    // Close database connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    console.log("🎉 Email digest script completed!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, sendEmailToUser, getTodayPosts, getTodayComments, getTodayTopics, getTodayForumReplies };

