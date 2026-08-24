import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Output schema validator
const aiSummarySchema = z.object({
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  chiefComplaint: z.string().min(1, 'Chief complaint must not be empty'),
  suggestedQuestions: z.array(z.string()).length(3, 'Must specify exactly three suggested questions')
});

export type AISummaryResult = z.infer<typeof aiSummarySchema>;

const postVisitSummarySchema = z.object({
  summary: z.string().min(1, 'Summary must not be empty'),
  medicationSchedule: z.array(
    z.object({
      medicineName: z.string().min(1, 'Medicine name must not be empty'),
      instructions: z.string().min(1, 'Instructions must not be empty')
    })
  ),
  followUpSteps: z.array(z.string()).min(1, 'Must provide at least one follow-up step')
});

export type PostVisitSummaryResult = z.infer<typeof postVisitSummarySchema>;


export class LLMService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not defined.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  /**
   * Generates a pre-visit symptoms summary utilizing Gemini AI.
   * Supports simulated failures for verification loops.
   */
  public static async generatePreVisitSummary(symptoms: string): Promise<AISummaryResult> {
    // 1. Simulate failure if development flag is active
    if (process.env.SIMULATE_LLM_FAILURE === 'true') {
      console.log('[LLM Service] Intentionally simulating an LLM service failure...');
      throw new Error('Simulated LLM service failure (dev flag active)');
    }

    // 2. Simulate success if development flag is active
    if (process.env.SIMULATE_LLM_SUCCESS === 'true') {
      console.log('[LLM Service] Simulating a successful LLM pre-visit summary...');
      return {
        urgency: 'MEDIUM',
        chiefComplaint: `Patient is experiencing: "${symptoms.substring(0, 80)}"`,
        suggestedQuestions: [
          'How long have you been experiencing these symptoms?',
          'Are you experiencing any breathing difficulties or shortness of breath?',
          'Have you taken any over-the-counter medications to manage this?'
        ]
      };
    }

    if (!symptoms || symptoms.trim().length === 0) {
      throw new Error('Symptoms text cannot be empty');
    }

    // 2. Build model config for structured JSON return
    const client = this.getClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      },
      systemInstruction: `You are a professional medical assistant performing clinical pre-visit summarization.
Your goal is to parse patient symptoms and return structured information for the doctor.

CRITICAL INSTRUCTIONS:
1. Do not diagnose the patient.
2. Do not recommend treatments or prescriptions.
3. Do not invent symptoms; only summarize the supplied text.
4. The urgency level must be exactly LOW, MEDIUM, or HIGH.
5. Provide exactly three suggested questions for the doctor to ask.
6. Return structured JSON matching this schema:
{
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "chiefComplaint": "string summarizing the patient's main concern",
  "suggestedQuestions": ["string question 1", "string question 2", "string question 3"]
}`
    });

    // 3. Construct prompt
    const userPrompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}`;

    // Set a timeout of 8 seconds for the LLM request to avoid blocking requests indefinitely
    const responsePromise = model.generateContent(userPrompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('LLM API request timed out')), 8000)
    );

    // Race promises
    const result = await Promise.race([responsePromise, timeoutPromise]);
    const textOutput = result.response.text();

    if (!textOutput) {
      throw new Error('Received empty text output from LLM.');
    }

    // 4. Parse output and validate with Zod
    const parsedJson = JSON.parse(textOutput);
    
    // Normalize casing for urgency from LLM
    if (parsedJson && typeof parsedJson.urgency === 'string') {
      parsedJson.urgency = parsedJson.urgency.toUpperCase();
    }

    const validated = aiSummarySchema.safeParse(parsedJson);
    if (!validated.success) {
      const issues = validated.error.issues.map(i => i.message).join(', ');
      throw new Error(`LLM output failed validation checks: ${issues}`);
    }

    return validated.data;
  }

  /**
   * Generates a patient-friendly post-visit summary utilizing Gemini AI.
   * Supports simulated failures/successes for verification loops.
   */
  public static async generatePostVisitSummary(
    notes: string,
    prescriptionInstructions: string,
    medications: Array<{ medicineName: string; dosage: string; frequency: string; duration: string }>
  ): Promise<PostVisitSummaryResult> {
    // 1. Simulate failure if development flag is active
    if (process.env.SIMULATE_LLM_FAILURE === 'true') {
      console.log('[LLM Service] Intentionally simulating a post-visit LLM service failure...');
      throw new Error('Simulated post-visit LLM service failure (dev flag active)');
    }

    // 2. Simulate success if development flag is active
    if (process.env.SIMULATE_LLM_SUCCESS === 'true') {
      console.log('[LLM Service] Simulating a successful post-visit LLM summary...');
      return {
        summary: `The patient is advised to follow the recovery instructions: "${notes.substring(0, 150)}"`,
        medicationSchedule: medications.map(med => ({
          medicineName: med.medicineName,
          instructions: `Take ${med.dosage} (${med.frequency}) for ${med.duration}. ${prescriptionInstructions}`
        })),
        followUpSteps: [
          'Take prescribed medications exactly as instructed.',
          'Monitor symptoms daily and report any abnormalities.',
          'Schedule a follow-up consultation in 1-2 weeks if symptoms persist.'
        ]
      };
    }

    if (!notes || notes.trim().length === 0) {
      throw new Error('Clinical notes text cannot be empty');
    }

    // 3. Connect to live Gemini
    const client = this.getClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      },
      systemInstruction: `You are a professional medical assistant creating patient-friendly post-visit summaries.
Your goal is to parse doctor clinical notes and prescription details and generate a clear, easy-to-understand summary for the patient.

CRITICAL INSTRUCTIONS:
1. Translate clinical jargon into patient-friendly language (e.g., use "high blood pressure" instead of "hypertension").
2. Create a medication schedule showing each medicine's name and clear instructions on how and when to take it.
3. Outline clear, actionable next steps or follow-up instructions for the patient.
4. Do not diagnose any new conditions. Do not invent information.
5. Return structured JSON matching this schema:
{
  "summary": "plain text patient-friendly summary of the visit",
  "medicationSchedule": [
    {
      "medicineName": "medicine name",
      "instructions": "patient-friendly instructions on dosage, frequency, duration, and timing"
    }
  ],
  "followUpSteps": ["actionable step 1", "actionable step 2"]
}`
    });

    const medicationsText = medications.map(m => 
      `- ${m.medicineName} (${m.dosage}, ${m.frequency}, for ${m.duration})`
    ).join('\n');

    const userPrompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps.

Clinical Notes:
"${notes}"

Prescription Instructions:
"${prescriptionInstructions}"

Prescribed Medications:
${medicationsText || 'None'}`;

    // Race timeout
    const responsePromise = model.generateContent(userPrompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('LLM API request timed out')), 8000)
    );

    const result = await Promise.race([responsePromise, timeoutPromise]);
    const textOutput = result.response.text();

    if (!textOutput) {
      throw new Error('Received empty text output from LLM for post-visit summary.');
    }

    const parsedJson = JSON.parse(textOutput);
    const validated = postVisitSummarySchema.safeParse(parsedJson);
    if (!validated.success) {
      const issues = validated.error.issues.map(i => i.message).join(', ');
      throw new Error(`LLM output failed validation checks: ${issues}`);
    }

    return validated.data;
  }
}
