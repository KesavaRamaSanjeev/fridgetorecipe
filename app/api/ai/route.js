import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { prompt, refinementPrompt, currentData } = await req.json();

    const apiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let systemInstruction = "";

    if (refinementPrompt && currentData) {
      systemInstruction = `
        You are an elite culinary AI assistant. The user wants to modify an existing recipe.
        
        CURRENT RECIPE DATA (JSON):
        ${JSON.stringify(currentData)}
        
        USER REFINEMENT REQUEST:
        "${refinementPrompt}"
        
        INSTRUCTION:
        Modify the current recipe data according to the user's request. Keep as much of the original recipe as possible unless requested otherwise.
        Output a single, updated JSON object that conforms STRICTLY to the following schema.
        
        SCHEMA:
        {
          "recipeName": "Name of the modified recipe",
          "description": "Short explanation of the modifications made",
          "servings": 2, // (default is 2, integer)
          "prepTime": "e.g. 15 mins",
          "cookTime": "e.g. 20 mins",
          "difficulty": "Easy" | "Medium" | "Hard",
          "rating": 4.8, // (number between 4.0 and 5.0)
          "reviewsCount": 120, // (integer)
          "calories": 420, // (total calories, integer)
          "blocks": [
            {
              "type": "checklist",
              "title": "Ingredients",
              "items": [
                { "name": "Ingredient Name", "amount": "100", "unit": "g", "standardAmount": 100 }
              ]
            },
            {
              "type": "checklist",
              "title": "Steps",
              "items": [
                { "stepNumber": 1, "instruction": "Step 1 text", "tip": "Step 1 tip or technique" },
                { "stepNumber": 2, "instruction": "Step 2 text", "tip": "Step 2 tip or technique" }
              ]
            },
            {
              "type": "card",
              "title": "Ingredient Swaps",
              "swaps": [
                { "original": "Cheddar Cheese", "replacements": ["Mozzarella", "Swiss", "Feta"], "reason": "Alternative cheese options" }
              ]
            },
            {
              "type": "chart",
              "title": "Nutrition Information",
              "chartType": "bar",
              "data": [
                { "label": "Protein", "value": 30, "unit": "g" },
                { "label": "Carbs", "value": 20, "unit": "g" },
                { "label": "Fat", "value": 10, "unit": "g" }
              ]
            }
          ]
        }
        Return ONLY this JSON object. Do not include markdown code block syntax.
      `;
    } else {
      systemInstruction = `
        You are an elite culinary AI assistant. The user will list ingredients they have in their fridge.
        Create a creative, delicious, and realistic recipe using these ingredients. You may assume common pantry staples (salt, pepper, oil, water) are available.
        
        Output a single, detailed JSON object that conforms STRICTLY to the following schema.
        
        SCHEMA:
        {
          "recipeName": "Name of the recipe",
          "description": "Brief mouth-watering description of the dish",
          "servings": 2, // (integer)
          "prepTime": "e.g. 10 mins",
          "cookTime": "e.g. 15 mins",
          "difficulty": "Easy" | "Medium" | "Hard",
          "rating": 4.7, // (generate a rating between 4.3 and 5.0)
          "reviewsCount": 85, // (generate an integer number of reviews)
          "calories": 380, // (estimate total calories as integer)
          "blocks": [
            {
              "type": "checklist",
              "title": "Ingredients",
              "items": [
                { "name": "Ingredient Name", "amount": "number string", "unit": "e.g. g, ml, tbsp, pcs", "standardAmount": 100 }
              ]
            },
            {
              "type": "checklist",
              "title": "Steps",
              "items": [
                { "stepNumber": 1, "instruction": "Step 1 description", "tip": "Step 1 helper tip" },
                { "stepNumber": 2, "instruction": "Step 2 description", "tip": "Step 2 helper tip" }
              ]
            },
            {
              "type": "card",
              "title": "Ingredient Swaps",
              "swaps": [
                { "original": "Original ingredient", "replacements": ["Replacement option 1", "Replacement option 2"], "reason": "Why this swap works" }
              ]
            },
            {
              "type": "chart",
              "title": "Nutrition Information",
              "chartType": "bar",
              "data": [
                { "label": "Protein", "value": 25, "unit": "g" },
                { "label": "Carbs", "value": 30, "unit": "g" },
                { "label": "Fat", "value": 8, "unit": "g" }
              ]
            }
          ]
        }
        Ensure the data is accurate. Return ONLY this JSON object. Do not wrap in markdown code block ticks.
      `;
    }

    const userPrompt = refinementPrompt
      ? `Apply refinement: ${refinementPrompt}`
      : `Generate recipe for: ${prompt}`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will strictly return JSON matching the specified schemas. Let's begin." }],
        },
      ],
    });

    const result = await chat.sendMessageStream(userPrompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(chunkText));
          }
          controller.close();
        } catch (streamError) {
          console.error("Stream generation error:", streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
