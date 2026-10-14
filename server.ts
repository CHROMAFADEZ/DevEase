import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Generous body limit for high-resolution timetable images and PDF base64 payloads
app.use(express.json({ limit: '30mb' }));

// Helper to sanitize Gemini JSON response
function extractJsonFromText(rawText: string): any {
  let cleaned = rawText.trim();
  // Strip markdown code block if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

// Sanitize model name to ensure stable, active Gemini models are used
function getValidGeminiModel(customModel?: string): string {
  if (!customModel) return 'gemini-3.1-flash-lite';
  const trimmed = customModel.trim();
  // Map deprecated or unavailable models directly to stable gemini-3.1-flash-lite
  if (
    trimmed === 'gemini-2.5-flash' ||
    trimmed === 'gemini-3.1-flash' ||
    trimmed === 'models/gemini-2.5-flash' ||
    trimmed === 'models/gemini-3.1-flash'
  ) {
    return 'gemini-3.1-flash-lite';
  }
  return trimmed;
}

// Format API errors into user-friendly messages for students
function formatGeminiError(err: any): { error: string; statusCode: number; needsApiKey?: boolean } {
  const errMsg = err?.message || String(err);
  const status = err?.status || err?.code;

  if (status === 401 || errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
    return {
      error: 'Invalid or unauthorized GEMINI_API_KEY. Please verify your API key in the AI Studio Secrets panel.',
      statusCode: 401,
      needsApiKey: true,
    };
  }

  if (status === 403 || errMsg.includes('PERMISSION_DENIED')) {
    return {
      error: 'Access denied for the Gemini API. Please check your API key permissions.',
      statusCode: 403,
    };
  }

  if (status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded') || errMsg.includes('quota')) {
    return {
      error: 'Gemini API quota exceeded. Please wait a minute before making another request, or check your rate limits.',
      statusCode: 429,
    };
  }

  if (status === 503 || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
    return {
      error: 'Gemini models are currently experiencing temporary high demand. Please try again in a moment.',
      statusCode: 503,
    };
  }

  if (status === 404 || errMsg.includes('NOT_FOUND') || errMsg.includes('is no longer available')) {
    return {
      error: 'The requested model is no longer available. DayEase has switched to the stable gemini-3.1-flash-lite model.',
      statusCode: 404,
    };
  }

  return {
    error: errMsg || 'An error occurred while communicating with DayEase AI.',
    statusCode: 500,
  };
}

// Call Gemini with intelligent fallback across available models (never attempts deprecated models)
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  request: {
    contents: any[];
    config?: any;
    preferredModel?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  const preferred = getValidGeminiModel(request.preferredModel || process.env.GEMINI_MODEL);
  // Sequence of valid, active models to try
  const candidateModels = Array.from(
    new Set([
      preferred,
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ])
  ).filter(
    (m) =>
      m !== 'gemini-2.5-flash' &&
      m !== 'gemini-3.1-flash' &&
      m !== 'models/gemini-2.5-flash' &&
      m !== 'models/gemini-3.1-flash'
  );

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: request.contents,
        config: request.config,
      });
      return { text: response.text || '', modelUsed: model };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, attempting next candidate:`, err?.message || err);
      // Fast-fail if authentication or permissions are invalid
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('API_KEY_INVALID') ||
        err?.message?.includes('API key not valid')
      ) {
        throw err;
      }
    }
  }
  throw lastError;
}

// API Route for Timetable AI Vision & Document Extraction
app.post('/api/extract-timetable', async (req, res) => {
  try {
    const { fileData, mimeType, fileName } = req.body;

    if (!fileData || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a valid PDF document or image file.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error:
          'GEMINI_API_KEY is not configured on the server. Please set your GEMINI_API_KEY in .env or the AI Studio Secrets panel to enable AI document extraction.',
        needsApiKey: true,
      });
    }

    // Initialize @google/genai SDK with mandatory User-Agent
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const extractionPrompt = `
You are an expert college academic schedule and timetable parser.
Analyze this uploaded college timetable (${fileName || 'document'}) carefully.

The document may be:
- A grid where days of the week (Monday to Sunday) are column headers and time slots are rows.
- A grid where days are rows and time slots are columns.
- A list of courses with meeting days, rooms, and hours.
- A timetable with merged cells representing 2-hour or 3-hour lectures, lab sessions, or practicals.
- Multiple classes or sections per day.

Extract every single scheduled class and return strict JSON with this exact structure:
{
  "summary": "Short 1-sentence summary of the extracted schedule (e.g. Found 8 classes including 2 labs across Mon-Fri)",
  "semesterOrTerm": "Optional term/semester name if visible",
  "classes": [
    {
      "subject": "Full course name or code (e.g. CS 101: Computer Programming, MATH 201: Calculus)",
      "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
      "startTime": "HH:mm" (24-hour time format, e.g. "09:00", "13:30"),
      "endTime": "HH:mm" (24-hour time format, e.g. "10:30", "16:00"),
      "room": "Room number, building, lab name, or 'Online' if remote",
      "instructor": "Teacher / Professor / TA name if visible, or null",
      "notes": "Any special notes visible like 'Lab Section B', 'Alternate weeks', etc., or null",
      "isLabOrPractical": boolean (true if marked as lab, practical, workshop, studio),
      "isUncertain": boolean (true if text was partially cut off, ambiguous, or inferred),
      "uncertainReason": "Explanation if uncertain, otherwise null",
      "accentColor": "sage" | "lavender" | "blue" | "amber"
    }
  ]
}

CRITICAL RULES:
1. Always convert times into standard 24-hour HH:mm strings (e.g., 9:00 AM -> "09:00", 2:15 PM -> "14:15", 4:00 PM -> "16:00").
2. Days must strictly match one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
3. If a merged cell spans 2 hours (e.g. 10:00 to 12:00), set startTime="10:00" and endTime="12:00".
4. If an entry is blurry or you are not 100% confident, set "isUncertain": true and describe why in "uncertainReason" so the student can verify it. Never guess silently.
5. If no classes can be detected at all in the document, return an empty array for "classes" and explain in "summary".
`;

    // Clean base64 data if it contains data URI prefix
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');

    const { text: responseText, modelUsed } = await callGeminiWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: extractionPrompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedResult = extractJsonFromText(responseText);

    if (!parsedResult || !Array.isArray(parsedResult.classes)) {
      return res.status(422).json({
        success: false,
        error: 'Unable to parse timetable format from document. Please review the image clarity.',
      });
    }

    return res.json({
      success: true,
      modelUsed,
      summary: parsedResult.summary || `Extracted ${parsedResult.classes.length} classes`,
      semesterOrTerm: parsedResult.semesterOrTerm || null,
      classes: parsedResult.classes,
    });
  } catch (err: any) {
    console.error('Timetable Extraction API Error:', err);
    const formatted = formatGeminiError(err);
    return res.status(formatted.statusCode).json({
      success: false,
      error: formatted.error,
      needsApiKey: formatted.needsApiKey,
    });
  }
});

// ==========================================
// Central DayEase AI College Assistant API
// ==========================================
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { messages = [], file, context = {} } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        needsApiKey: true,
        error:
          'GEMINI_API_KEY is not configured on the server. Please set your GEMINI_API_KEY in the AI Studio Secrets panel or .env file to enable DayEase AI.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const studentName = context.studentName || 'Student';
    const todayDate = context.todayDate || new Date().toISOString().split('T')[0];
    const dayOfWeek = context.dayOfWeek || 'Today';

    const systemPrompt = `
You are DayEase AI, the calm, intelligent, and warm personal college assistant integrated into DayEase.
Your mission: Help the student organize college life, eliminate academic paralysis, understand schedules and documents, and take clear, guilt-free steps forward.

STUDENT PROFILE & LIVE CONTEXT:
- Student Name: ${studentName}
- Current Date: ${todayDate} (${dayOfWeek})
- College/Program: ${context.collegeName || 'College'} (${context.major || 'Undergraduate'})
- Today's Classes in Timetable: ${JSON.stringify(context.todayClasses || [])}
- Active Pending Assignments: ${JSON.stringify(context.activeAssignments || [])}
- Upcoming / Pending Tasks: ${JSON.stringify(context.pendingTasks || [])}
- Overdue Tasks: ${JSON.stringify(context.overdueTasks || [])}

WHAT YOU CAN DO:
1. "timetable": If the student shares a routine, class timetable, photo, PDF, or asks to add/change classes, extract/prepare the classes.
2. "assignments": If the student shares a syllabus, homework brief, project deadline, or asks to track assignments, extract/prepare the assignments.
3. "tasks": If the student mentions to-dos, study tasks, exam preparation, or asks to create action items, break them down into realistic, manageable tasks.
4. "study_plan": If the student asks for study time planning, exam revision schedule, or time-blocking for today or next week, generate realistic focus and break blocks.
5. "general": If the student asks questions ("What classes do I have today?", "Which assignment should I start first?", "Can you explain this syllabus?"), provide a direct, warm, and helpful answer.

CRITICAL INSTRUCTIONS & RESPONSE FORMAT:
You MUST respond with valid, parseable JSON conforming strictly to this format:
{
  "reply": "Your conversational answer to the student. Be warm, supportive, concise, and articulate. If you extracted or organized data, explain what you found. If an uploaded document was cut off, blurry, or missing key details (e.g., room number or due time), politely mention it and ask a follow-up question here.",
  "destination": "timetable" | "assignments" | "tasks" | "study_plan" | "general",
  "proposedActions": {
    "summary": "Short 1-line title of proposed changes (e.g. 'Found 4 classes in Monday routine' or 'Created 2 tasks for C programming assignment'), or null if pure Q&A",
    "classes": [
      {
        "subject": "string",
        "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
        "startTime": "HH:mm" (24h format),
        "endTime": "HH:mm" (24h format),
        "room": "string",
        "instructor": "string or null",
        "notes": "string or null",
        "isLabOrPractical": boolean,
        "accentColor": "sage" | "lavender" | "blue" | "amber",
        "isUncertain": boolean,
        "uncertainReason": "string or null"
      }
    ],
    "assignments": [
      {
        "title": "string",
        "subject": "string",
        "assignedDate": "YYYY-MM-DD",
        "dueDate": "YYYY-MM-DD",
        "dueTime": "HH:mm",
        "description": "string",
        "status": "not_started"
      }
    ],
    "tasks": [
      {
        "title": "string",
        "subject": "string or null",
        "deadline": "YYYY-MM-DD or null",
        "deadlineTime": "HH:mm or null",
        "priority": "low" | "medium" | "high",
        "estimatedDuration": number (in minutes, e.g. 25, 45, 60),
        "category": "college" | "study" | "personal",
        "status": "pending",
        "notes": "string or null"
      }
    ],
    "studyPlan": [
      {
        "time": "HH:mm - HH:mm",
        "title": "string",
        "type": "focus" | "break" | "freetime",
        "durationMins": number,
        "subject": "string or null",
        "notes": "string or null"
      }
    ],
    "followUpQuestions": ["string"]
  }
}

RULES:
- When the user asks "What classes do I have today?", check "Today's Classes in Timetable" from the context. If they have classes, list them warmly. If none, tell them and suggest gentle rest or study.
- When creating dates: today is ${todayDate}. "Tomorrow" is the next day. Always output valid YYYY-MM-DD format.
- For timetable classes, times MUST be 24-hour "HH:mm" (e.g. 09:30, 14:00).
- If no action items need to be created (e.g., pure question), set "classes": [], "assignments": [], "tasks": [], "studyPlan": [], and summary to null.
- Always be genuine and factual. If you can't read an uploaded file, say so clearly and do not make up imaginary schedules.
`;

    // Construct Gemini multi-turn conversation
    const contents: any[] = [];

    // History turns (convert role: 'assistant' to 'model')
    const history = messages.slice(0, -1);
    for (const msg of history) {
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content || '' }],
        });
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
        });
      }
    }

    // Latest user turn
    const lastMsg = messages[messages.length - 1] || { role: 'user', content: 'Hello' };
    const latestUserParts: any[] = [];

    // Attach document or image if uploaded with this prompt
    if (file && file.fileData && file.mimeType) {
      const cleanBase64 = file.fileData.replace(/^data:[^;]+;base64,/, '');
      latestUserParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: cleanBase64,
        },
      });
    }

    latestUserParts.push({
      text: `${lastMsg.content}\n\n[Context: User is ${studentName}, today is ${todayDate} (${dayOfWeek})]`,
    });

    contents.push({
      role: 'user',
      parts: latestUserParts,
    });

    // Call Gemini with stable model and resilient fallback across active models
    const { text: responseText, modelUsed } = await callGeminiWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedResult = extractJsonFromText(responseText);

    if (!parsedResult || typeof parsedResult !== 'object') {
      return res.status(500).json({
        success: false,
        error: 'Unable to parse AI response into structured format.',
      });
    }

    return res.json({
      success: true,
      modelUsed,
      reply: parsedResult.reply || 'Here is what I found for you.',
      destination: parsedResult.destination || 'general',
      proposedActions: {
        summary: parsedResult.proposedActions?.summary || null,
        classes: Array.isArray(parsedResult.proposedActions?.classes) ? parsedResult.proposedActions.classes : [],
        assignments: Array.isArray(parsedResult.proposedActions?.assignments) ? parsedResult.proposedActions.assignments : [],
        tasks: Array.isArray(parsedResult.proposedActions?.tasks) ? parsedResult.proposedActions.tasks : [],
        studyPlan: Array.isArray(parsedResult.proposedActions?.studyPlan) ? parsedResult.proposedActions.studyPlan : [],
        followUpQuestions: Array.isArray(parsedResult.proposedActions?.followUpQuestions) ? parsedResult.proposedActions.followUpQuestions : [],
      },
    });
  } catch (err: any) {
    console.error('DayEase AI Assistant Error:', err);
    const formatted = formatGeminiError(err);
    return res.status(formatted.statusCode).json({
      success: false,
      error: formatted.error,
      needsApiKey: formatted.needsApiKey,
    });
  }
});

// Setup Vite middleware in dev or static serving in production
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DayEase server listening on port ${PORT}`);
});
