const Groq = require('groq-sdk');

const chatController = {
    handleChatCompletion: async (req, res) => {
        try {
            const { message } = req.body;
            
            const groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
            
            const formattedPrompt = `${message}\n\nPlease format the response with clear paragraph breaks using double newlines, use "**" for headers, and maintain a clear structure with proper spacing.`;
            
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: formattedPrompt
                    }
                ],
                model: "llama-3.2-11b-text-preview",
                temperature: 0.7,
                max_tokens: 2048,
                stream: false
            });

            let response = chatCompletion.choices[0]?.message?.content || 'No response';
            
            // Ensure proper spacing and formatting
            response = response
                .split('\n\n')
                .map(paragraph => paragraph.trim())
                .filter(paragraph => paragraph)
                .join('\n\n');
            
            res.json({ response });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = chatController;