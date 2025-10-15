const { sendReplyNotificationEmail } = require('./middleware/emailNotification');

// Test the email notification system
async function testEmailNotification() {
    console.log("🧪 Testing email notification system...");
    
    try {
        // Test data - replace with actual user IDs from your database
        const testData = {
            recipientUserId: "65f1234567890abcdef12345", // Replace with actual user ID
            replierUserId: "65f1234567890abcdef12346",   // Replace with actual user ID  
            replierUserName: "Test User",
            postId: "65f1234567890abcdef12347",          // Replace with actual post ID
            topicId: "",
            commentId: "",
            replyType: "post",
            replyContent: "This is a test reply to verify the email notification system is working correctly!"
        };

        console.log("📧 Sending test email notification...");
        const result = await sendReplyNotificationEmail(testData);
        
        if (result) {
            console.log("✅ Email notification test successful!");
            console.log("📬 Message ID:", result.messageId);
        } else {
            console.log("❌ Email notification test failed - no result returned");
        }
        
    } catch (error) {
        console.error("❌ Email notification test failed:", error);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testEmailNotification()
        .then(() => {
            console.log("🏁 Test completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Test failed:", error);
            process.exit(1);
        });
}

module.exports = { testEmailNotification };
