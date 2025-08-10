// Backend Proxy Server for DeepSeek API Integration
// This keeps your API key secure on the server side

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!DEEPSEEK_API_KEY) {
            return res.status(500).json({ error: 'DeepSeek API key not configured' });
        }

        // Build prompt with context for DeepSeek
        const messages = buildDeepSeekPrompt(message, history);

        const requestBody = {
            model: "deepseek-chat",
            messages: messages,
            stream: false
        };

        // Call DeepSeek API
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('DeepSeek API Error:', errorData);
            return res.status(response.status).json({
                error: `DeepSeek API Error: ${errorData.error?.message || response.statusText}`
            });
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content;
        if (!aiResponse) {
            return res.status(500).json({ error: 'No response generated' });
        }

        res.json({
            response: aiResponse.trim(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        deepseekConfigured: !!DEEPSEEK_API_KEY
    });
});

// Serve static files (your frontend)
app.use(express.static('public'));

// Helper function to build DeepSeek prompt
function buildDeepSeekPrompt(userMessage, history = []) {
    const messages = [{
        role: "system",
        content: `You are a compassionate, professional AI therapist. Your role is to:
- Listen actively and provide empathetic responses
- Ask thoughtful, open-ended questions to help users explore their feelings
- Provide gentle guidance and evidence-based coping strategies
- Maintain a warm, non-judgmental, and supportive tone
- Keep responses concise but meaningful (2-4 sentences)
- Recognize when professional help may be needed and suggest it appropriately`
    }];

    // Add recent conversation context
    const recentHistory = history.slice(-5);
    recentHistory.forEach(msg => {
        messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    });

    // Add the new user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Therapist AI Backend running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 DeepSeek API configured: ${!!DEEPSEEK_API_KEY}`);
});

module.exports = app;