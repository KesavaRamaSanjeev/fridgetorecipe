/**
 * jsonRepair.js
 * A robust utility to parse incomplete JSON strings during streaming.
 * It tracks open brackets, braces, and strings, and appends the necessary
 * closing tokens to construct a valid JSON object.
 */

export function repairJson(jsonStr) {
  if (!jsonStr) return {};
  let cleanStr = jsonStr.trim();
  
  // Remove markdown JSON code blocks if present
  if (cleanStr.startsWith("```json")) {
    cleanStr = cleanStr.substring(7);
  } else if (cleanStr.startsWith("```")) {
    cleanStr = cleanStr.substring(3);
  }
  if (cleanStr.endsWith("```")) {
    cleanStr = cleanStr.substring(0, cleanStr.length - 3);
  }
  cleanStr = cleanStr.trim();

  let result = "";
  let stack = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    result += char;

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === "}" || char === "]") {
        stack.pop();
      }
    }
  }

  // Handle case where we end inside a string
  if (inString) {
    if (result.endsWith("\\")) {
      result = result.substring(0, result.length - 1);
    }
    result += '"';
  }

  // Remove trailing commas or colons which cause syntax errors in JSON
  let cleanResult = result.trim();
  while (cleanResult.endsWith(":") || cleanResult.endsWith(",")) {
    cleanResult = cleanResult.substring(0, cleanResult.length - 1).trim();
  }

  // Add the closing symbols
  let suffix = "";
  for (let i = stack.length - 1; i >= 0; i--) {
    suffix += stack[i];
  }

  const finalString = cleanResult + suffix;

  try {
    return JSON.parse(finalString);
  } catch (e) {
    // If parsing fails, attempt to backtrack character by character to find the last valid state
    return tryLaxParse(cleanResult, stack);
  }
}

function tryLaxParse(text, stack) {
  let t = text.trim();
  
  for (let len = t.length; len > 0; len--) {
    let sub = t.substring(0, len).trim();
    if (sub.endsWith(",") || sub.endsWith(":")) {
      sub = sub.substring(0, sub.length - 1).trim();
    }
    
    let subStack = [];
    let inStr = false;
    let esc = false;
    let ok = true;
    
    for (let j = 0; j < sub.length; j++) {
      const c = sub[j];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (c === "{" || c === "[") {
          subStack.push(c === "{" ? "}" : "]");
        } else if (c === "}" || c === "]") {
          if (subStack.length === 0 || subStack.pop() !== c) {
            ok = false;
            break;
          }
        }
      }
    }
    
    if (!ok) continue;
    if (inStr) {
      if (sub.endsWith("\\")) sub = sub.substring(0, sub.length - 1);
      sub += '"';
    }
    
    let suf = "";
    for (let k = subStack.length - 1; k >= 0; k--) {
      suf += subStack[k];
    }
    
    try {
      return JSON.parse(sub + suf);
    } catch (err) {
      // Continue backtracking
    }
  }
  return {};
}
