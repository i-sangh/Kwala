const humanizeService = require('../services/humanizeService');

const humanizeController = {
    humanizeContent: async (req, res) => {
        try {
            const { content } = req.body;

            // Log the incoming content
            console.log('Received request for humanization with content:', content);

            // Validate the content
            if (!content || typeof content !== 'string') {
                console.error('Invalid content provided:', content);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid content provided. Content must be a non-empty string.',
                });
            }

            // Process the content through the humanize service
            console.log('Sending content to humanize service...');
            const humanizedContent = await humanizeService.humanizeContent(content);

            // Log the result
            console.log('Successfully humanized content:', humanizedContent);

            // Respond with the humanized content
            res.json({
                success: true,
                humanizedContent,
            });
        } catch (error) {
            // Log detailed error information
            console.error('Humanization controller error:', error);

            // Respond with a generic error message
            res.status(500).json({
                success: false,
                error: 'Failed to humanize content. Please try again later.',
            });
        }
    },
};

module.exports = humanizeController;
