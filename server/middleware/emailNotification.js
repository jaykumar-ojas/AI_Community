const nodemailer = require("nodemailer");
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const { encodeId } = require("../utils/hashids");

// Reuse the same transporter config from nodemailer.js
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

/**
 * Send email notification when user receives a reply
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientUserId - ID of user receiving the notification
 * @param {string} params.replierUserId - ID of user who replied
 * @param {string} params.replierUserName - Name of user who replied
 * @param {string} params.postId - Post ID (if applicable)
 * @param {string} params.topicId - Topic ID (if applicable)
 * @param {string} params.commentId - Comment ID (if applicable)
 * @param {string} params.replyType - Type of reply: 'post', 'topic', 'comment', 'forum_reply'
 * @param {string} params.replyContent - Content of the reply (first 100 chars)
 */
const sendReplyNotificationEmail = async ({
    recipientUserId,
    replierUserId,
    replierUserName,
    postId = "",
    topicId = "",
    commentId = "",
    replyType,
    replyContent = ""
}) => {
    try {
        // Get recipient user details (check both user schemas)
        let recipientUser = await userdb.findById(recipientUserId) || await googledb.findById(recipientUserId);
        
        if (!recipientUser || !recipientUser.email) {
            console.log("Recipient user not found or has no email:", recipientUserId);
            return;
        }

        // Generate appropriate URL based on reply type
        let notificationUrl = "";
        let replyContext = "";

        if (replyType === "post") {
            // Direct post reply
            notificationUrl = `https://api.pixxelmind.com/postThread/${encodeId(commentId)}`;
            replyContext = "replied to your post";
        } else if (replyType === "topic") {
            // Direct topic reply
            notificationUrl = `https://api.pixxelmind.com/forumThread/${encodeId(commentId)}`;
            replyContext = "replied to your topic";
        } else if (replyType === "comment") {
            // Comment on post
            notificationUrl = `https://api.pixxelmind.com/postThread/${encodeId(commentId)}`;
            replyContext = "replied to your comment";
        } else if (replyType === "forum_reply") {
            // Reply to forum topic/comment
            notificationUrl = `https://api.pixxelmind.com/forumThread/${encodeId(commentId)}`;
            replyContext = "replied to your forum message";
        }

        // Truncate reply content for email preview
        const previewContent = replyContent.length > 100 
            ? replyContent.substring(0, 100) + "..." 
            : replyContent;

        // Create email HTML template
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply on Pixxelmind</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif; color:#f0f0f0;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0d0d0d; padding:20px 0;">
    <tr>
      <td align="center">

        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#1a1a1a; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(255,102,0,0.2);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#7a7672; padding:30px 20px;">
              <img src="https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/48926f359a03dabb7e9976759b69d5182477be7bc82b1fb41aacd5fa7ae4cc82.webp" width="90" height="90" alt="Pixxelmind Logo" style="display:block; margin-bottom:10px;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#f0f0f0;">
              <h2 style="margin-top:0;">Hello ${recipientUser.userName || 'there'}</h2>
              <p>You’ve received a new reply on <strong>Pixxelmind</strong>:</p>

              <div style="background-color:#262626; border:1px solid #333; border-radius:8px; padding:20px; margin:20px 0;">
                <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <div style="width:40px; height:40px; border-radius:50%; background-color:#ff6a00; color:white; font-weight:bold; display:flex; align-items:center; justify-content:center; margin-right:12px;">
                  </div>
                  <div>
                    <div style="font-weight:600; font-size:16px; color:#ffffff;">${replierUserName}</div>
                    <div style="color:#aaa; font-size:14px;">${replyContext}</div>
                  </div>
                </div>

                ${previewContent ? `
                <div style="background-color:#1f1f1f; border-left:4px solid #ff6a00; padding:15px; margin:15px 0; border-radius:0 8px 8px 0; font-style:italic; color:#cbd5e0;">
                  "${previewContent}"
                </div>` : ''}
              </div>

              <p>Click below to view the full conversation:</p>

              <a href="${notificationUrl}" style="display:inline-block; background-color:#ff6a00; color:white; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; margin:20px 0; transition:all 0.2s;">View Reply</a>

              <p style="color:#777; font-size:14px;">To change your notification preferences, visit your profile settings.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#111; padding:20px; text-align:center; color:#999; font-size:14px;">
              <p><strong>Pixxelmind Community</strong><br>
              <a href="https://www.pixxelmind.com" style="color:#f09819; text-decoration:none;">Visit Pixxelmind</a> |
              <a href="mailto:system.pixxelmind@gmail.com" style="color:#f09819; text-decoration:none;">Contact Support</a></p>
              <p style="font-size:12px; margin-top:15px;">This email was sent because you received a reply to your post on Pixxelmind.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>

`;

        // Email options
        const mailOptions = {
            from: `"Pixxelmind" <${process.env.EMAIL_USER}>`,
            to: recipientUser.email,
            subject: `New reply from ${replierUserName} on Pixxelmind`,
            html: emailHtml,
            text: `Hello ${recipientUser.userName || 'there'}!\n\n${replierUserName} ${replyContext} on Pixxelmind.\n\n${previewContent ? `Reply: "${previewContent}"` : ''}\n\nView the full conversation: ${notificationUrl}\n\nBest regards,\nPixxelmind Team`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Reply notification email sent successfully:", info.messageId);
        
        return info;
    } catch (error) {
        console.error("❌ Failed to send reply notification email:", error);
        // Don't throw error to avoid breaking the main flow
        return null;
    }
};

const sendWelcomeEmail = async ({ recipientEmail, recipientUserName }) => {
    try {
        if (!recipientEmail) return null;

        const safeName = recipientUserName || "there";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Pixxelmind</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; color:#f0f0f0;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0d0d0d; padding:24px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="background-color:#1a1a1a; border-radius:14px; overflow:hidden; box-shadow:0 8px 25px rgba(255,80,0,0.25);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#7a7672; padding:32px 24px 24px;">
              <!-- Add white circle background behind transparent logo -->
              <div style="background-color:#ffffff; border-radius:50%; display:inline-block; padding:6px;">
                <img src="https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/48926f359a03dabb7e9976759b69d5182477be7bc82b1fb41aacd5fa7ae4cc82.webp"
                     width="80"
                     height="80"
                     alt="Pixxelmind Logo"
                     style="display:block; border-radius:50%; background-color:#ffffff;">
              </div>
              <h1 style="margin:16px 0 0; font-size:24px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#ffffff;">Welcome to Pixxelmind</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px 24px; color:#f0f0f0;">
              <p style="font-size:16px; color:#e5e5e5; line-height:1.6; margin:0 0 12px;">Hi ${safeName},</p>
              <p style="font-size:16px; color:#e5e5e5; line-height:1.6; margin:0 0 18px;">You're in! Welcome to the new frontier of AI creation and community. Explore models, share ideas, and build amazing things with fellow creators.</p>

              <!-- Card -->
              <div style="background-color:#262626; border:1px solid #333; border-radius:10px; padding:16px; margin:18px 0;">
                <p style="margin:0 0 8px 0; font-weight:600; color:#f09819;">Get started:</p>
                <ul style="margin:0; padding-left:18px; color:#ccc;">
                  <li>Post your first creation in the community</li>
                  <li>Try AI image or text generation models</li>
                  <li>Ask or answer a question in the forum</li>
                </ul>
              </div>

              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                <tr>
                  <td align="center" bgcolor="#ff6a00" style="border-radius:10px;">
                    <a href="https://www.pixxelmind.com"
                       style="display:inline-block; padding:12px 22px; color:#ffffff; text-decoration:none; font-weight:600; letter-spacing:0.3px; border-radius:10px; background-color:#ff6a00;">Open Pixxelmind</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#111; padding:18px; color:#999; font-size:13px;">
              <div><strong>Pixxelmind Community</strong> · 
                <a href="https://www.pixxelmind.com" style="color:#f09819; text-decoration:none;">Website</a>
              </div>
              <div style="margin-top:6px;">Need help? Contact support at 
                <a href="mailto:system.pixxelmind@gmail.com" style="color:#f09819; text-decoration:none;">system.pixxelmind@gmail.com</a>
              </div>
            </td>
          </tr>

        </table>
        <!-- End Container -->
`;

        const info = await transporter.sendMail({
            from: `"Pixxelmind" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: "Welcome to Pixxelmind – Your AI Creator Hub",
            html: emailHtml,
            text: `Hi ${safeName}, welcome to Pixxelmind! Start creating and join discussions at https://www.pixxelmind.com`
        });
        console.log("✅ Welcome email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Failed to send welcome email:", error);
        return null;
    }
};

module.exports = {
    sendReplyNotificationEmail,
    sendWelcomeEmail
};
