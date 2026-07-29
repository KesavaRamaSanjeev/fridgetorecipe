const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

async function run() {
  let apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    try {
      const envLocal = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
      const match = envLocal.match(/GEMINI_API_KEY\s*=\s*(.*)/);
      if (match && match[1]) {
        apiKey = match[1].trim();
      }
    } catch (e) {
      console.error("Could not read .env.local file", e.message);
    }
  }

  if (!apiKey) {
    console.error("No API key found in process.env or .env.local");
    return;
  }

  console.log("Using API Key:", apiKey.substring(0, 8) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Testing API key with gemini-3.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Response text:", result.response.text());
  } catch (err) {
    console.error("Error generated during test:", err);
  }
}

run();
