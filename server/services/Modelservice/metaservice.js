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
async function metagen(prompt, model, aspectRatio) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return {text : completion.choices[0]?.message?.content || ""};
}

async function* metagenStream(prompt, model, aspectRatio) {
  const stream = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      yield { delta };
    }
  }
}

module.exports = { metagen, metagenStream };
