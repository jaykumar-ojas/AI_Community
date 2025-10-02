const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Reuse the same transporter config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail() {
  try {
    let info = await transporter.sendMail({
      from: `"Pixxelmind" <${process.env.EMAIL_USER}>`,
      to: "rohitmishra051000@gmail.com", // 👈 Replace with recipient
      subject: " WellCome back to Pixxelmind ",
      html: `
   <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your Founders Batch Awaits | Pixxelmind</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 640px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    .header {
      background: linear-gradient(135deg, #6d28d9, #0ea5e9);
      text-align: center;
      padding: 35px 20px;
    }
    .header img {
      width: 70px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      color: #fff;
      font-weight: 600;
    }
    .content {
      padding: 35px 28px;
      text-align: center;
    }
    .content h2 {
      color: #6d28d9;
      font-size: 22px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 12px 0;
      color: #555;
    }
    .badge-box {
      background: #f9f5ff;
      border: 1px solid #e3d8ff;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }
    .badge-box p {
      margin: 8px 0;
      color: #444;
    }
    .btn {
      display: inline-block;
      margin-top: 22px;
      padding: 14px 28px;
      background: #fd8f00ff;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 30px;
    }
    .btn:hover {
      background: #5b21b6;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #888;
      background: #fafafa;
    }
    .footer a {
      color: #0ea5e9;
      text-decoration: none;
    }
  </style>
</head>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pixxelmind – Founders Batch Invitation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 620px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
      overflow: hidden;
    }
    .header {
      background: #6d28d9;
      text-align: center;
      padding: 28px 20px;
    }
    .header img {
      width: 65px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      color: #fff;
      font-weight: 500;
    }
    .content {
      padding: 28px 24px;
      text-align: left;
      font-size: 15px;
      line-height: 1.6;
    }
    .content h2 {
      color: #6d28d9;
      font-size: 18px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .badge-box {
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 18px 0;
    }
    .badge-box p {
      margin: 6px 0;
      color: #444;
      font-size: 14px;
    }
    .btn {
      display: inline-block;
      margin-top: 18px;
      padding: 12px 24px;
      background: #6d28d9;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      border-radius: 6px;
    }
    .btn:hover {
      background: #5b21b6;
    }
    .footer {
      padding: 18px;
      text-align: center;
      font-size: 12px;
      color: #888;
      background: #f9f9f9;
    }
    .footer a {
      color: #6d28d9;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/eb5ecd50474f01e59ef25e58c9e8c20ee48ccf512bed6284970320dcf26c2ed0.webp" alt="Pixxelmind Logo">
      <h1>Pixxelmind Community Update</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Hello Creator,</h2>
      <p>We’re inviting you to be part of the <b>Founders Batch</b> on Pixxelmind.  
      As an early member, you’ll receive additional credits and early access to our models.</p>

      <div class="badge-box">
        <p>• Extra 500 credits added to your account</p>
        <p>• Use across Stable Diffusion and GPT-Image One imagen-4 ultra</p>
        <p>• Early access to new features</p>
      </div>

      <p>To get extra credit and Founders Batch, simply reply to this email with the word <b>"pixxelmind"</b>.  
      We’ll update your account once we hear from you.</p>
      
      <a href="https://www.pixxelmind.com" class="btn">Visit Pixxelmind</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>You’re receiving this because you joined <a href="https://www.pixxelmind.com">Pixxelmind</a>.</p>
      <p>If you’d prefer not to receive updates, you can unsubscribe anytime.</p>
    </div>
  </div>
</body>
</html>

      `,
    });

    console.log("✅ Message sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

sendMail();
