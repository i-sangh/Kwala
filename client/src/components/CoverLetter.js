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
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [isHumanized, setIsHumanized] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const handleClearAll = () => {
        setMessage('');
        setCustomMessage('');
        setSelectedTones([]);
        setResponse('');
        setError('');
        setIsHumanized(false);
        setIsHumanizing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setIsHumanized(false);

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

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(response);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    const formatContent = (content) => {
        const lines = content.split('\n');
        const formattedLines = [];
        
        lines.forEach((line) => {
            const boldMatch = line.match(/\*\*(.*?)\*\*/);

            if (boldMatch) {
                const boldText = boldMatch[1];
                if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== '') {
                    formattedLines.push('');
                }
                formattedLines.push(`**${boldText}**`);
                formattedLines.push('');
            } else if (line.trim() !== '') {
                formattedLines.push(line.trim());
            }

            if (line.trim() === '' && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
            }
        });

        return formattedLines
            .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
            .join('\n');
    };

    const handleHumanizeContent = async () => {
        setError('');
        setIsHumanizing(true);
        try {
            const res = await axios.post('http://localhost:5000/api/humanize', { content: response });
            if (res.data.success) {
                const formattedContent = formatContent(res.data.humanizedContent);
                setResponse(formattedContent);
                setIsHumanized(true);
            }
        } catch (err) {
            setError('Failed to humanize content. Please try again.');
        } finally {
            setIsHumanizing(false);
        }
    };

    const isGenerateButtonDisabled = message.trim().split(/\s+/).length < 3 || loading || response;

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

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isGenerateButtonDisabled}
                        >
                            {loading ? 'Generating...' : 'Generate Cover Letter'}
                        </Button>
                        {response && !isHumanizing && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleClearAll}
                            >
                                Clear All
                            </Button>
                        )}
                    </Box>
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
                            {isHumanized ? (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    <ReactMarkdown>{response}</ReactMarkdown>
                                </div>
                            ) : (
                                <ReactMarkdown>{response}</ReactMarkdown>
                            )}
                        </Paper>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Button
                                onClick={handleCopyToClipboard}
                                variant="outlined"
                            >
                                {copied ? 'Copied' : 'Copy to Clipboard'}
                            </Button>
                            <Button
                                onClick={handleHumanizeContent}
                                variant="outlined"
                                disabled={isHumanized}
                            >
                                {isHumanizing ? 'Humanizing...' : 'Humanize Content'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default CoverLetter;
