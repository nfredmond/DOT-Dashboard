/**
 * LLM Service for text classification and moderation
 */

/**
 * Classifies text using LLM into appropriate categories
 * @param prompt The prompt to send to the LLM with text to classify
 * @returns The classification result
 */
export async function classifyText(prompt: string): Promise<string> {
  try {
    // In a real implementation, this would call an LLM API
    // Example implementation with OpenAI:
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that classifies community input text into predefined categories. Reply with only the category name, nothing else." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    return response.choices[0].message.content?.trim() || 'general';
    */

    // Mock implementation for development
    console.log('Classification prompt:', prompt);
    
    // Extract categories from the prompt
    const categoriesMatch = prompt.match(/categories: (.*?)\.\\n/i);
    const categoriesText = categoriesMatch ? categoriesMatch[1] : '';
    const categories = categoriesText.split(',').map(cat => cat.trim().toLowerCase());
    
    // If no categories found, return a default
    if (categories.length === 0 || !categories[0]) {
      return 'general';
    }
    
    // Randomly select a category for demo purposes
    return categories[Math.floor(Math.random() * categories.length)];
    
  } catch (error) {
    console.error('Error classifying text with LLM:', error);
    return 'general'; // Default fallback category
  }
}

/**
 * Moderates content to check if it's appropriate
 * @param text The text to moderate
 * @returns Result with moderation decision and reason
 */
export async function moderateContent(text: string): Promise<{
  isApproved: boolean;
  reason?: string;
}> {
  try {
    // In a real implementation, this would call an LLM API for moderation
    // Example implementation with OpenAI:
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.moderations.create({
      input: text,
    });

    const result = response.results[0];
    
    if (result.flagged) {
      return {
        isApproved: false,
        reason: `Content flagged for: ${Object.keys(result.categories)
          .filter(key => result.categories[key])
          .join(', ')}`
      };
    }
    */
    
    // Mock implementation for development
    // Reject text with offensive words (simplified example)
    const offensiveWords = ['offensive', 'inappropriate', 'slur'];
    const containsOffensive = offensiveWords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    if (containsOffensive) {
      return {
        isApproved: false,
        reason: 'Content contains inappropriate language'
      };
    }
    
    return {
      isApproved: true
    };
    
  } catch (error) {
    console.error('Error moderating content with LLM:', error);
    return {
      isApproved: true // Default to approve in case of error
    };
  }
} 