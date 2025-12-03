
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { QuizQuestion, LearningNode, Flashcard, ExamQuestion, PlacementTestQuestion } from '../types';

interface QuizGenerationSchema {
    questions: QuizQuestion[];
}

interface LearningPathGenerationSchema {
    nodes: LearningNode[];
}

interface FlashcardGenerationSchema {
    cards: Flashcard[];
}

interface ExamGenerationSchema {
    questions: ExamQuestion[];
}

interface PlacementTestSchema {
    questions: PlacementTestQuestion[];
}

// NOTE: This file assumes the existence of `process.env.API_KEY` which is injected by the environment.
// Do not define or manage API keys in the UI.

const getGeminiClient = (apiKey: string) => {
    return new GoogleGenAI({ apiKey });
};

export const callGeminiApi = async (
    apiKey: string,
    prompt: string,
    systemPrompt: string | null,
    options?: {
        useThinking?: boolean;
        fileData?: { mimeType: string; data: string } | null;
    }
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API Key is required but not provided.");
    }
    const ai = getGeminiClient(apiKey);
    // USER REQUEST: Keep using gemini-2.5-flash for free tier compatibility
    const modelName = 'gemini-2.5-flash'; 

    try {
        const config: any = {
            ...(systemPrompt && { systemInstruction: systemPrompt }),
        };

        // Enable Thinking Mode if requested
        if (options?.useThinking) {
             // For Gemini 2.5 Flash, enable thinking with a budget suitable for free tier latency
             config.thinkingConfig = { thinkingBudget: 10240 }; 
             // Do NOT set maxOutputTokens when using thinkingConfig
        }

        let contents: any = prompt;
        
        // Handle Multimodal (Image/Video)
        if (options?.fileData) {
            contents = {
                parts: [
                    { inlineData: options.fileData },
                    { text: prompt }
                ]
            };
        } else {
             contents = {
                parts: [{ text: prompt }]
             };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error instanceof Error) {
           throw new Error(`Gemini API request failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while calling the Gemini API.");
    }
};

export const callGeminiApiWithSchema = async (
    apiKey: string,
    prompt: string,
): Promise<QuizGenerationSchema> => {
    if (!apiKey) {
        throw new Error("API Key is required but not provided.");
    }

    const ai = getGeminiClient(apiKey);
    const fullPrompt = `You are a Quiz generation assistant. Please generate content based on the following request: "${prompt}".\n\nRespond in JSON format and strictly adhere to the provided schema.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "questions": {
                            type: Type.ARRAY,
                            description: "List of multiple-choice questions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING, description: "Unique ID for the question (e.g., q1, q2)" },
                                    "text": { type: Type.STRING, description: "The question text." },
                                    "options": {
                                        type: Type.ARRAY,
                                        description: "An array of exactly 4 string options.",
                                        items: { type: Type.STRING }
                                    },
                                    "correctAnswer": { type: Type.INTEGER, description: "The 0-based index of the correct answer in the 'options' array." }
                                },
                                required: ["id", "text", "options", "correctAnswer"]
                            }
                        }
                    },
                    required: ["questions"]
                }
            }
        });
        
        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from Gemini");

        const parsedJson = JSON.parse(jsonText) as QuizGenerationSchema;
        
        if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
            throw new Error("JSON response from Gemini is missing the 'questions' array.");
        }
        
        return parsedJson;

    } catch (error) {
        console.error("Gemini API Error (with schema):", error);
         if (error instanceof Error) {
           throw new Error(`Gemini API request failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while calling the Gemini API with a schema.");
    }
};

// NEW: Generate Placement Test
export const generatePlacementTest = async (
    apiKey: string, 
    topic: string
): Promise<PlacementTestQuestion[]> => {
    const ai = getGeminiClient(apiKey);
    const prompt = `Generate 8 multiple-choice placement test questions for the topic: "${topic}".
    Questions should range from Beginner to Advanced difficulty.
    Respond in JSON.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "questions": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING },
                                    "question": { type: Type.STRING },
                                    "options": { type: Type.ARRAY, items: { type: Type.STRING } },
                                    "correctAnswer": { type: Type.INTEGER }
                                },
                                required: ["question", "options", "correctAnswer"]
                            }
                        }
                    }
                }
            }
        });
        const json = JSON.parse(response.text || "{}") as PlacementTestSchema;
        return json.questions.map((q, i) => ({ ...q, id: `pt_${Date.now()}_${i}` }));
    } catch (e) {
        throw new Error("Failed to generate placement test.");
    }
};

export const generateLearningPathWithGemini = async (
    apiKey: string,
    prompt: string,
    isContentBased: boolean,
    context?: { level: string, goal: string, time: string }
): Promise<LearningNode[]> => {
    if (!apiKey) throw new Error("API Key is required.");

    const ai = getGeminiClient(apiKey);
    let instruction = isContentBased 
        ? "Analyze the provided content and break it down into a progressive learning path (like a Duolingo tree)." 
        : "Create a progressive learning path (Duolingo style) for the given topic.";

    if (context) {
        instruction += ` The user's current level is ${context.level}. Their goal is: "${context.goal}". They have ${context.time} per day.
        Adjust the difficulty and starting point accordingly. If Advanced, skip basics.`;
    }

    // Use Thinking Mode for Learning Path generation if possible to get better structure
    const fullPrompt = `${instruction} Request: "${prompt}". Generate 5 to 7 nodes. Respond in JSON.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                // thinkingConfig: { thinkingBudget: 4096 }, // Optional: Enable thinking for structure planning if needed
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "nodes": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING, description: "unique id like node_1" },
                                    "title": { type: Type.STRING, description: "Short title of the level" },
                                    "description": { type: Type.STRING, description: "Brief description of what will be learned" },
                                    "type": { type: Type.STRING, enum: ["theory", "practice", "challenge"] },
                                },
                                required: ["id", "title", "description", "type"]
                            }
                        }
                    }
                }
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("Empty response from Gemini");

        const parsedJson = JSON.parse(jsonText) as LearningPathGenerationSchema;
        
        // Post-process to add default state
        const nodes = parsedJson.nodes.map((node, index) => ({
            ...node,
            isLocked: index !== 0, // Lock all except first
            isCompleted: false,
            flashcardsMastered: 0,
            isExamUnlocked: false,
            examScore: null
        }));

        return nodes;
    } catch (error) {
        console.error("Gemini Learning Path Error:", error);
        throw new Error("Failed to generate learning path.");
    }
};

// NEW: Generate 30 Flashcards for a specific level topic
export const generateNodeFlashcards = async (apiKey: string, topic: string, description: string): Promise<Flashcard[]> => {
    const ai = getGeminiClient(apiKey);
    const fullPrompt = `Generate exactly 30 educational flashcards (Term on front, Definition/Meaning on back) for the topic: "${topic} - ${description}".`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "cards": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING },
                                    "front": { type: Type.STRING },
                                    "back": { type: Type.STRING }
                                },
                                required: ["front", "back"]
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}") as FlashcardGenerationSchema;
        return json.cards.map((c, i) => ({ ...c, id: `fc_${Date.now()}_${i}` }));
    } catch (e) {
        throw new Error("Failed to generate flashcards.");
    }
};

// NEW: Generate 15 Exam Questions (Mixed Type) with Explanation
export const generateNodeExam = async (apiKey: string, topic: string): Promise<ExamQuestion[]> => {
    const ai = getGeminiClient(apiKey);
    const fullPrompt = `Generate exactly 15 mixed assessment questions (Multiple Choice, Fill-in-the-gap, Short Answer) to test knowledge on: "${topic}".
    For MCQ, provide 4 options and the 0-based index of the correct answer as a string. 
    For Fill-in-the-gap/Short Answer, provide the correct text answer in 'correctAnswer' and leave 'options' empty.
    Provide a helpful 'explanation' for why the answer is correct.
    Types: 'mcq', 'fill_gap', 'short_answer'.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "questions": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING },
                                    "type": { type: Type.STRING, enum: ["mcq", "fill_gap", "short_answer"] },
                                    "question": { type: Type.STRING },
                                    "options": { type: Type.ARRAY, items: { type: Type.STRING } },
                                    "correctAnswer": { type: Type.STRING },
                                    "explanation": { type: Type.STRING }
                                },
                                required: ["type", "question", "correctAnswer", "explanation"]
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}") as ExamGenerationSchema;
        return json.questions.map((q, i) => ({ ...q, id: `ex_${Date.now()}_${i}` }));
    } catch (e) {
        throw new Error("Failed to generate exam.");
    }
};

// NEW: Generate Advanced Path (Extension)
export const generateAdvancedPath = async (apiKey: string, previousPathTitle: string, lastNodeTitle: string): Promise<LearningNode[]> => {
    const ai = getGeminiClient(apiKey);
    const fullPrompt = `The student has completed the learning path "${previousPathTitle}" ending with "${lastNodeTitle}". 
    Create 5 NEW, ADVANCED level nodes to extend this path. Continue the progression difficulty.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "nodes": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "id": { type: Type.STRING },
                                    "title": { type: Type.STRING },
                                    "description": { type: Type.STRING },
                                    "type": { type: Type.STRING, enum: ["theory", "practice", "challenge"] },
                                },
                                required: ["id", "title", "description", "type"]
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}") as LearningPathGenerationSchema;
         return json.nodes.map((node, index) => ({
            ...node,
            id: `adv_node_${Date.now()}_${index}`,
            isLocked: true, // Starts locked until unlocked by logic
            isCompleted: false,
            flashcardsMastered: 0,
            isExamUnlocked: false,
            examScore: null
        }));
    } catch (e) {
        throw new Error("Failed to generate advanced path.");
    }
};
