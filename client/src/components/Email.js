import React, { useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Box,
    Chip,
} from '@mui/material';
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
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [isHumanized, setIsHumanized] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const handleClearAll = () => {
        setMessage('');
        setCustomMessage('');
        setSelectedTones([]);
        setResponse('');
        setError('');
        setIsHumanized(false);
        setIsHumanizing(false);
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

    const handleCopyAndTest = async () => {
        try {
            await navigator.clipboard.writeText(response);
            window.open('https://quillbot.com/ai-content-detector', '_blank');
        } catch (err) {
            setError('Failed to copy or redirect');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setIsHumanized(false);
        const modifiedMessage = `
Help me write an email based on the Core Email Content:

1. **Custom Instructions**: ${customMessage || "None"}
2. **Tone Preferences**: ${selectedTones.join(" and ") || "Neutral"}
3. **Core Email Content**: ${message.trim()}

### Expectations:
- Make it human-like with slight grammatical variations.
- Use concise yet friendly language.
        `;
        try {
            const res = await axios.post(`${API_URL}/api/chat/completion`, {
                message: modifiedMessage,
            });
            setResponse(res.data.response);
        } catch (err) {
            setError('Failed to generate email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleHumanizeContent = async () => {
        setError('');
        setIsHumanizing(true);
        try {
            const res = await axios.post(`${API_URL}/api/humanize`, { content: response });
            if (res.data.success) {
                setResponse(res.data.humanizedContent);
                setIsHumanized(true);
            }
        } catch (err) {
            setError('Failed to humanize content. Please try again.');
        } finally {
            setIsHumanizing(false);
        }
    };

    const countWords = (text) => {
        return text.trim().split(/\s+/).length;
    };

    const isGenerateButtonDisabled = countWords(message) < 3 || loading || response;

    return (
        <Container>
            <UnverifiedAlert />
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 4,
                    mb: 3,
                }}
            >
                <Typography variant="h4">AI Email Generator</Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/email-reply')}
                    disabled={hasContent}
                    sx={{ minWidth: '200px' }}
                >
                    Generate Email Reply Instead
                </Button>
            </Box>
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Typography>Select Tone (Optional, max 2):</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {tones.map((tone) => (
                            <Chip
                                key={tone}
                                label={tone}
                                color={selectedTones.includes(tone) ? 'primary' : 'default'}
                                onClick={() => handleToneSelection(tone)}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                    <TextField
                        label="Custom Instructions"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Email Content"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        required
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isGenerateButtonDisabled}
                        >
                            {loading ? 'Generating...' : 'Generate Email'}
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
                {response && (
                    <Box sx={{ mt: 3 }}>
                        <Typography>Generated Email:</Typography>
                        <Paper sx={{ p: 2, mt: 1 }}>
                            {isHumanized ? (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {response.split('\n\n').map((paragraph, index) => (
                                        <Typography key={index} paragraph>
                                            {paragraph}
                                        </Typography>
                                    ))}
                                </div>
                            ) : (
                                <ReactMarkdown>{response}</ReactMarkdown>
                            )}
                        </Paper>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
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
                            {!isHumanizing && (
                                <Button
                                    onClick={handleCopyAndTest}
                                    variant="outlined"
                                    sx={{ borderColor: 'red', color: 'red' }}
                                >
                                    Copy and Analyze Text
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            </Paper>
        </Container>
    );
}

export default Email;
