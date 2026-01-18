import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not set in environment variables.");
    return;
  }

  const bot = new TelegramBot(token, { polling: true });

  // 🟢 /start handler
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from?.first_name || "there";

    try {
      // 🖼️ Welcome image with fallback
      let imagePath = path.join(__dirname, 'assets', 'welcome.jpg');
      if (!fs.existsSync(imagePath)) {
        imagePath = 'https://www.zaycommerce.com/logo.png';
      }

      await bot.sendPhoto(chatId, imagePath, {
        caption: `👋 *Welcome to ZayCommerce*, ${user}!\n\n🛍️ Discover Ethiopia's most reliable online shopping experience — right here in Telegram.`,
        parse_mode: 'Markdown',
      });

      // 📚 Intro message
      await bot.sendMessage(chatId, `
⚡ *What you can do with ZayCommerce:*

🛒 Shop products in 10+ categories\n  
🧾 Upload bank receipts after ordering\n
💸 Earn ZCoins via referrals (not purchases)\n
👥 Share your referral link & build a network\n
📦 Track orders easily\n
📲 All inside Telegram or browser!

👇 Explore below:
      `.trim(), { parse_mode: 'Markdown' });

      // 🧠 Full menu
      const keyboard = {
        keyboard: [
          [
            {
              text: "🛍️ Launch App",
              web_app: { url: "https://zaycommerce.com" }
            }
          ],
          [
            { text: "📋 How It Works" },
            { text: "🎁 ZCoin Rewards" }
          ],
          [
            { text: "👤 My Referrals" },
            { text: "📞 Contact Support" }
          ],
          [
            { text: "❓ FAQ" },
            { text: "🆘 Help" }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      };

      await bot.sendMessage(chatId, "👇 Choose an option below:", {
        reply_markup: keyboard
      });

      console.log(`✅ Sent welcome flow to ${user} (${chatId})`);

    } catch (err) {
      console.error("❌ Error in /start:", err);
      await bot.sendMessage(chatId, "⚠️ Something went wrong. Please try again later.");
    }
  });

  // 🧠 Button response logic
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (text) {
      case "📋 How It Works":
        return bot.sendMessage(chatId, `
🧾 *How ZayCommerce Works:*

1️⃣ Browse & select products\n
2️⃣ Place your order\n
3️⃣ Upload your bank receipt\n 
4️⃣ We verify, fulfill, and you earn ZCoins if referred someone\n
5️⃣ Track all inside your account
        `.trim(), { parse_mode: 'Markdown' });

      case "🎁 ZCoin Rewards":
        return bot.sendMessage(chatId, `
💰 *ZCoin Reward System*

ZCoins are earned *through referrals*, not purchases.

Example:
- 👤 MSY refers MSX → MSX buys → MSY gets *5% of profit*
- 👤 MSX refers MSZ → MSZ buys → MSX gets *5%*, MSY still earns *3%*

🎯 ZCoins are calculated from net profit — and stack passively through your network.

Your referral link is inside the app!
        `.trim(), { parse_mode: 'Markdown' });

      case "👤 My Referrals":
        return bot.sendMessage(chatId, `
👥 *ZayReferral System*

📈 Build your network & earn ZCoins every time someone you refer buys.

🪙 *Multi-level Reward Structure*:
- MSX buys → MSY earns *5%* of profit
- MSZ buys → MSX earns *5%*, MSY still earns *3%*

📲 *To Share:*
1️⃣ Tap profile icon (top right in app)\n 
2️⃣ Tap *My Profile*\n  
3️⃣ Tap *Share* to copy your referral link  
(Users are redirected to login if not authenticated)

🔗 zaycommerce.com/profile
        `.trim(), { parse_mode: 'Markdown' });

      case "📞 Contact Support":
        return bot.sendMessage(chatId, `
📞 *Need Help?*

🧠 Ask your question or reach out:
📞 Contact: zaycommerce.com/contact\n
📧 Email: support@zaycommerce.com\n
⏱️ Response within minutes!
        `.trim(), { parse_mode: 'Markdown' });

      case "❓ FAQ":
        return bot.sendMessage(chatId, `
📚 *Frequently Asked Questions*\n

❓ _How do I upload a receipt?_ 
🧾 After placing an order, go to *My Orders* → *Upload Receipt*\n

❓ _Can I shop without login?_  
🔐 No, login is required to order and earn rewards.\n

❓ _Where is my ZCoin balance?_  
💰 Check it in your profile inside the app.\n

More FAQs coming soon!
        `.trim(), { parse_mode: 'Markdown' });

      case "🆘 Help":
        return bot.sendMessage(chatId, `
🆘 *Need Assistance?*

Tap a button or type one of these:
- 📋 *How It Works*\n
- 🎁 *ZCoin Rewards*\n
- 👤 *My Referrals*\n
- 📞 *Contact Support*

We’re here to help you get the best out of ZayCommerce 💡
        `.trim(), { parse_mode: 'Markdown' });
    }
  });

  bot.on("polling_error", (err) => {
    console.error("📡 Polling Error:", err?.response?.body || err.message || err);
  });

  console.log("🤖 ZayCommerce Telegram Bot is fully running.");
}

export default startBot;
