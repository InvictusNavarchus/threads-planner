import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateThreadIdeas = async (topic: string, context: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return ["Error: API Key missing"];

  try {
    const prompt = `
      You are a social media expert for the platform Threads.
      Generate 3 distinct, engaging thread ideas based on the topic: "${topic}".
      Context/Audience: ${context}.
      
      Return ONLY a JSON array of strings. Example: ["Idea 1...", "Idea 2...", "Idea 3..."].
      Do not include markdown code blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) return [];

    // Simple cleanup if model returns markdown despite instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Idea Gen Error:", error);
    return ["Failed to generate ideas. Please try again."];
  }
};

export const splitIntoChain = async (longText: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return [longText];

  try {
    const prompt = `
      You are a Threads formatting expert.
      Take the following text and split it into a "Thread Chain" (a series of connected posts).
      
      Rules:
      1. Each post must be under 500 characters.
      2. The flow must be logical and engaging (hook in first post).
      3. Maintain the original meaning.
      
      Text to split:
      "${longText}"

      Return ONLY a JSON array of strings, where each string is one post in the chain.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) return [longText];

     const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Split Error:", error);
    return [longText]; // Fallback to original
  }
};

export const polishContent = async (content: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return content;

  try {
    const prompt = `
      Rewrite the following social media post to be more engaging, concise, and viral-worthy for Threads.
      Keep it under 500 characters.
      
      Content: "${content}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || content;
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return content;
  }
};