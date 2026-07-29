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

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    console.log("Listing available models from API...");
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Supported Models:");
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName}) - Supported Actions: ${m.supportedGenerationMethods.join(", ")}`);
      });
    } else {
      console.log("API response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

run();
