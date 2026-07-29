# Fridge-to-Recipe AI Planner

A premium, interactive AI application built for the Frontend Internship Assignment. It translates a list of ingredients in a user's fridge into a structured, highly interactive cooking recipe.

This app features **streaming structured JSON**, **robust error fallbacks**, **servings scaling**, **ingredient swaps**, **refinement loops**, **session saving**, and a **custom nutrition chart**.

---

## 🚀 Getting Started

### 1. Installation
Clone or open the project folder in your terminal, then install the dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (or rename the included `.env.local.example`):
```bash
cp .env.local.example .env.local
```
Open `.env.local` and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note**: This API Key is handled strictly server-side inside Next.js API Routes and is never leaked to the client browser.

### 3. Run the App
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🎨 Key Features & Architecture Details

### 1. Non-Chatbot Interactive Structured UI
Instead of simple markdown printouts in a chat bubble, this application mandates that the AI return a rigid JSON object representing modular blocks. The frontend reads, validates, and renders these blocks into interactive components:
- **Servings Scaler**: Multiplies ingredient ratios dynamically on the fly based on user selection.
- **Checklist Blocks**: Interactive checkoff components for ingredients and recipe steps.
- **Substitutions Card**: Displays swapping lists for dietary options or missing items.
- **Macronutrient Chart**: Custom-rendered CSS layout component displaying relative nutrition balances (protein, fat, carbs) as a horizontal bar graph.

### 2. Real-time Streaming JSON Repair
When streaming structured output, standard `JSON.parse` crashes because the text stream is cut off mid-way. We implemented a custom **JSON repair utility** (`utils/jsonRepair.js`):
- It scans the stream character-by-character, balancing open braces, brackets, and quotes.
- If a token is cut off in a syntax-breaking state (e.g. `{"key": val`), it backtracks character-by-character to locate the last complete JSON fragment, closes the tree safely, and returns a valid partial object.
- This results in a premium **real-time rendering effect** where elements emerge and update smoothly as the AI is generating.

### 3. Stale Response Protection & Race-Condition Handling
To prevent slow, out-of-order, or overlapping API calls from corrupting the application state:
- Each streaming request receives a unique timestamp-based `requestId`.
- As stream chunks arrive, the client compares the incoming data's `requestId` against the currently active ref ID.
- If the user starts a new search before the previous one completes, the old stream is safely discarded and cannot overwrite the newer state.

### 4. Refinement Loop
Allows users to modify recipes using follow-up prompts (e.g. *"make it spicy"*, *"swap chicken for tofu"*, *"add side dish ideas"*). The backend receives the current state JSON, applies the modifications using context-aware prompts, and streams back the revised schema.

### 5. Session Saving
Saves recipe sessions (title, raw prompt, parsed data) in `localStorage`. The sidebar lists all saved recipe sessions, allowing users to reload or delete them, persisting cooking checklists between reloads.

---

## 📝 AI-Usage Note
- **API Model**: `gemini-3.5-flash` was selected due to its fast generation speed, low latency streaming, and native support for structured JSON matching.
- **System Constraints**: The API route sets `responseMimeType: "application/json"` in Gemini's configuration. This enforces that the model outputs syntax conforming to a valid JSON shape. We use complex system prompts detailing exact JSON schemas to enforce structural layouts.

---

## ⚠️ Known Limitations
1. **Model Hallucinations**: Rarely, the AI might misplace an ingredient swap or format nutrition calories slightly incorrectly depending on inputs.
2. **Local Storage Size limits**: `localStorage` has a limit of ~5MB. Storing dozens of complex recipes could eventually exceed this limit.
3. **API Key Dependency**: The application requires a valid `GEMINI_API_KEY` to run. A local health indicator displays the connection status.

---

## ⏱️ Time Spent
- **Total Time Spent**: Approximately **3.5 hours**
  - Project planning & bootstrap: 30 minutes
  - Backend streaming API & prompts layout: 45 minutes
  - Custom partial JSON repair script: 45 minutes
  - Component building (recipe servings scaler, checklists, swaps): 1 hour
  - Styling (dark/light themes, responsiveness, glassmorphism) & polish: 30 minutes
