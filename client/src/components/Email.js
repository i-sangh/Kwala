import React, { useState } from 'react'; // Removed `useEffect`
import { Container, Typography, TextField, Button, Paper, Box, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UnverifiedAlert from './UnverifiedAlert';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function Email() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [selectedTones, setSelectedTones] = useState([]);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if form has any content
    const hasContent = Boolean(
        message.trim() || 
        customMessage.trim() || 
        selectedTones.length > 0
    );

    const tones = ["Professional", "Friendly", "Casual", "Persuasive", "Formal", "Neutral"];

    const handleToneSelection = (tone) => {
        setSelectedTones((prev) =>
            prev.includes(tone)
                ? prev.filter((t) => t !== tone)
                : prev.length === 2
                    ? [prev[1], tone]
                    : [...prev, tone]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const modifiedMessage = `
Help me write a email based on Core Email Content.:

1. **Custom Instructions** (Optional): ${customMessage.trim() ? customMessage : "No additional instructions provided."}
2. **Tone Preferences**: ${selectedTones.length > 0 ? selectedTones.join(" and ") : "Casual and Friendly"}
3. **Core Email Content**: ${message.trim()}

### Key Expectations:

- Try giving the complete email content a friendly tone and make sure to write short and long sentence both in order to make it more human written and not AI generated.

- Add some grammatically wrong sentence, Make the email concise and don't polish it to make it look more professional. 
`;



        try {
            const res = await axios.post('http://localhost:5000/api/chat/completion', {
                message: modifiedMessage
            });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to generate email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadResponse = () => {
        const element = document.createElement('a');
        const file = new Blob([response], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'generated_email.txt';
        document.body.appendChild(element);
        element.click();
    };

    return (
        <Container>
            <UnverifiedAlert />
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 4, 
                    mb: 3 
                }}
            >
                <Typography variant="h4">
                    AI Email Generator
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/email-reply')}
                    disabled={hasContent}
                    sx={{ minWidth: '280px' }}
                >
                    Generate Reply to Email You Have Received
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                <form onSubmit={handleSubmit}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Select Tone (Optional, max 2):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {tones.map((tone) => (
                            <Chip
                                key={tone}
                                label={tone}
                                onClick={() => handleToneSelection(tone)}
                                color={selectedTones.includes(tone) ? "primary" : "default"}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        label="Custom Instructions (Optional)"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Email Content"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || message.trim().split(/\s+/).length <= 3}
                    >
                        {loading ? 'Generating...' : 'Generate Email'}
                    </Button>
                </form>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}

                {response && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Generated Email:
                        </Typography>
                        <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                            <ReactMarkdown>{response}</ReactMarkdown>
                        </Paper>
                        <Tooltip title="Copy to Clipboard">
                            <Button
                                variant="outlined"
                                sx={{ mt: 2, mr: 2 }}
                                onClick={() => navigator.clipboard.writeText(response)}
                            >
                                Copy Email
                            </Button>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            sx={{ mt: 2 }}
                            onClick={downloadResponse}
                        >
                            Download Email
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default Email;
