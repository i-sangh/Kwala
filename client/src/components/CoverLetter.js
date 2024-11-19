import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Chip, Paper } from '@mui/material';
import UnverifiedAlert from './UnverifiedAlert';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function CoverLetter() {
    const [message, setMessage] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [selectedTones, setSelectedTones] = useState([]);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const tones = ["Empathetic", "Optimistic", "Formal", "Informal", "Humorous", "Neutral"];

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

        const toneMessage = selectedTones.length
            ? `Give me the reply in ${selectedTones.join(" and ")} tone(s).`
            : 'Give me the reply in a default neutral tone.';

        const modifiedMessage = `
Please generate a professional and compelling cover letter based on the following details:

1. **Custom Instructions** (Optional):
${customMessage || "No additional instructions provided."}

2. **Tone Preferences** (Optional):
${toneMessage}

3. **Job Description**:
${message}

Make sure the cover letter is well-structured, concise, and tailored to the job description provided above.
`;

        try {
            const res = await axios.post('http://localhost:5000/api/chat/completion', {
                message: modifiedMessage
            });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to generate cover letter. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <UnverifiedAlert />
            <Typography variant="h4" sx={{ mt: 4, mb: 3 }}>
                AI Cover Letter Generator
            </Typography>

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
                        label="Job Description"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || message.trim().split(/\s+/).length <= 3}
                        sx={{ mb: 3 }}
                    >
                        {loading ? 'Generating...' : 'Generate Cover Letter'}
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
                            Generated Cover Letter:
                        </Typography>
                        <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                            <ReactMarkdown>{response}</ReactMarkdown>
                        </Paper>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default CoverLetter;
