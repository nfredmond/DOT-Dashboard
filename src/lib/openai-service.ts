import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handles text-based completions using OpenAI
 * @param prompt The text prompt to send to OpenAI
 * @returns The completion text
 */
export async function getCompletion(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });
    
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error getting completion from OpenAI:", error);
    throw error;
  }
}

/**
 * Handles image analysis using OpenAI's vision capabilities
 * @param imageBase64 Base64-encoded image data
 * @param prompt Text prompt describing what to analyze in the image
 * @returns Analysis text from the model
 */
export async function analyzeImage(imageBase64: string, prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    throw error;
  }
} 