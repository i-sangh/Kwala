const Groq = require('groq-sdk');

const chatController = {
    handleChatCompletion: async (req, res) => {
        try {
            const { message } = req.body;
            
            const groq = new Groq({
                apiKey: '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',
            });
            
            const formattedPrompt = `${message}\n\nPlease format the response with clear paragraph breaks using double newlines, use "**" for headers, and maintain a clear structure with proper spacing.`;
            
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: formattedPrompt
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 1,
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
            console.error('Groq API Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = chatController;