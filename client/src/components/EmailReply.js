import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Paper, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UnverifiedAlert from './UnverifiedAlert';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function EmailReply() {
    const navigate = useNavigate();
    const [originalEmail, setOriginalEmail] = useState('');
    const [replyContext, setReplyContext] = useState('');
    const [selectedTones, setSelectedTones] = useState([]);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [isHumanized, setIsHumanized] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const hasContent = Boolean(
        originalEmail.trim() || 
        replyContext.trim() || 
        selectedTones.length > 0
    );

    const countWords = (text) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const hasEnoughWords = 
        countWords(originalEmail) > 3 && 
        countWords(replyContext) > 3;

    const tones = ["Professional", "Friendly", "Casual", "Persuasive", "Formal", "Neutral", "Apologetic", "Appreciative"];

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
        setOriginalEmail('');
        setReplyContext('');
        setSelectedTones([]);
        setResponse('');
        setError('');
        setIsHumanized(false);
        setIsAnalyzing(false);
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(response);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 1000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    const handleAnalyzeText = async () => {
        setIsAnalyzing(true);
        try {
            // First copy the text
            await navigator.clipboard.writeText(response);
            
            // Then analyze it
            const analysisResult = await axios.post('http://localhost:5000/api/analyze', {
                content: response
            });
            
            if (analysisResult.data.success) {
                // Handle successful analysis
                console.log('Analysis completed:', analysisResult.data);
            }
        } catch (err) {
            setError('Failed to analyze text. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const toneMessage = selectedTones.length
            ? `Write the email reply in ${selectedTones.join(" and ")} tone(s).`
            : 'Write the email reply in a friendly tone.';

        const modifiedMessage = `
Help me write a reply to the Original email content, Generate the reply as said in Context for Reply.:

1. **Original Email**:
${originalEmail}

2. **Context for Reply** (What I want to convey):
${replyContext}

3. **Tone Preferences**:
${toneMessage}

### Key Expectations:

1. **More conversational tone**: Use a more relaxed and informal tone, which is characteristic of human communication.
2. **Personal touch**: Include a personal anecdote and a bit of a personal touch, which makes the text sound more authentic and less formulaic.
3. **Descriptive language**: Use more vivid and descriptive language to paint a picture in the reader's mind.
4. **Concise and natural language**: Cut out unnecessary words and use a more natural flow, which makes the text sound more like something a human would write.
`;

        try {
            const res = await axios.post(`${API_URL}/api/chat/completion`, {
                message: modifiedMessage
            });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to generate email reply. Please try again.');
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
                    AI Email Reply Generator
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/email')}
                    disabled={hasContent}
                    sx={{ minWidth: '200px' }}
                >
                    Generate New Email Instead
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Original Email Content"
                        value={originalEmail}
                        onChange={(e) => setOriginalEmail(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                        placeholder="Paste the email you want to reply to here..."
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        label="What would you like to convey in your reply?"
                        value={replyContext}
                        onChange={(e) => setReplyContext(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                        placeholder="E.g., Accept the meeting proposal but request a different time, Thank them for their feedback and provide updates..."
                    />

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

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !hasEnoughWords || response}
                        >
                            {loading ? 'Generating Reply...' : 'Generate Reply'}
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
                            Generated Reply:
                        </Typography>
                        <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
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
                        <Box sx={{ 
                            mt: 2, 
                            display: 'flex', 
                            gap: 2,
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleCopyToClipboard}
                                    disabled={isCopied}
                                >
                                    {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                                </Button>
                                <Button
                                    onClick={handleHumanizeContent}
                                    variant="outlined"
                                    disabled={isHumanized || isHumanizing}
                                >
                                    {isHumanizing ? 'Humanizing...' : 'Humanize Content'}
                                </Button>
                            </Box>
                            {!isHumanizing && (
                                <Box sx={{ marginLeft: 'auto' }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        disabled={isAnalyzing}
                                        onClick={handleAnalyzeText}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default EmailReply;
