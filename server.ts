import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env file if present
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing for incoming request bodies
app.use(express.json());

// Initialize the GoogleGenAI client securely on the server
// Note: We include the 'aistudio-build' User-Agent for telemetry as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * API Route: /api/coach
 * Analyzes the student's task list and returns productivity recommendations,
 * task prioritization, and a personalized study plan using Gemini.
 */
app.post("/api/coach", async (req, res) => {
  try {
    const { tasks, timeLimit } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks data. Please provide an array of tasks." });
    }

    if (tasks.length === 0) {
      return res.json({
        recommendation: "Your task list is empty! Add some school assignments or tasks to get started, and I will help you create a highly efficient study plan."
      });
    }

    // Format tasks neatly into a text prompt for Gemini to analyze
    const formattedTasks = tasks.map((task, idx) => {
      return `${idx + 1}. [${task.completed ? "COMPLETED" : "PENDING"}]
   - Name: ${task.name}
   - Description: ${task.desc}
   - Priority: ${task.priority}
   - Due Date: ${task.dueDate}
   - Due Time: ${task.taskTime || "Not specified"}`;
    }).join("\n\n");

    const systemInstruction = `You are an encouraging, friendly, and highly structured AI Mentor for high school and university students.
Your goal is to help them manage their homework, study schedules, and assignments efficiently, while keeping stress low.

Analyze their current task list and provide a comprehensive recommendation focusing on:
1. "Task to Do First": Which PENDING task should they start right away, with clear reasons based on its priority (High/Medium/Low), due date, and due time.
2. "Personalized Study Plan": A step-by-step tactical approach for their pending tasks, dividing study blocks logically.
3. "Time-Optimized Recommendations": If the student specified a time limit (e.g. they only have 30 minutes or 2 hours), recommend the absolute best subset of tasks they can finish to build momentum. If no time limit is specified, assume a general day schedule of 2 hours.

Output your response using clean, beautiful Markdown. Use bullet points, bold text for headings, and positive, motivating language. Do not output raw HTML tags or mention any system-internal details. Keep formatting easy to read for a student.`;

    let timeContext = timeLimit ? `The student has a limited study window of only: ${timeLimit}.` : "No specific study window was entered (assume a standard daily schedule of 120 minutes).";

    const prompt = `Here is my current task list:

${formattedTasks}

${timeContext}

Please analyze these tasks, recommend what to prioritize first, draft a structured study plan, and suggest the best way to spend my available time.`;

    // Generate the content from Gemini 3.5 Flash (best for basic text & reasoning tasks)
   const response = await ai.models.generateContent({
  model: "gemini-3.1-flash",
  contents: prompt,
  config: {
    systemInstruction,
    temperature: 0.7,
  },
});

    const recommendationText = response.text || "Could not generate advice. Please try again.";
    res.json({ recommendation: recommendationText });

  } catch (error: any) {
    console.error("Error in AI Mentor service:", error);
    res.status(500).json({ error: error.message || "An error occurred while communicating with the AI Mentor." });
  }
});

/**
 * Vite Dev Middleware & SPA Static Router Setup
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware so that root level index.html, styles, and js files are compiled/served live in dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve bundled client assets from the dist directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Mentor Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
