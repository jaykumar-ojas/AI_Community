const Groq = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // put GROQ_API_KEY in your .env
});

/**
 * Generate a chat completion with Groq
 * @param {string} model - Model name (e.g. "llama-3.1-8b-instant")
 * @param {string} prompt - User input text
 * @returns {Promise<string>} - Model response text
 */
async function metagen(prompt, model) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0]?.message?.content || "";
}

module.exports = { metagen };
