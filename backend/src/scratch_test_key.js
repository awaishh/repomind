import { GoogleGenAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});

async function test() {
  try {
    console.log("Testing with key:", process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent("Hello! Response in 3 words.");
    console.log("Response text:", response.response.text());
    console.log("✅ Key is valid!");
  } catch (err) {
    console.error("❌ Key is invalid or error occurred:", err);
  }
}

test();
