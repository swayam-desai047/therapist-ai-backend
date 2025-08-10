// Backend Proxy Server for OpenRouter API Integration
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

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const YOUR_SITE_URL = 'https://ai-therapy-backend.onrender.com';
const YOUR_SITE_NAME = 'Nexus AI Therapy';

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'OpenRouter API key not configured' });
        }

        const messages = buildOpenRouterPrompt(message, history);

        const requestBody = {
            "model": "openai/gpt-4o", // The model is now specified, fixing the error
            messages: messages
        };

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': YOUR_SITE_URL,
                'X-Title': YOUR_SITE_NAME,
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter API Error:', errorData);
            return res.status(response.status).json({
                error: `OpenRouter API Error: ${errorData.error?.message || response.statusText}`
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
        openRouterConfigured: !!OPENROUTER_API_KEY
    });
});

// Serve static files (your frontend)
app.use(express.static('public'));

// Helper function to build OpenRouter prompt
function buildOpenRouterPrompt(userMessage, history = []) {
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

    const recentHistory = history.slice(-5);
    recentHistory.forEach(msg => {
        messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    });

    messages.push({ role: 'user', content: userMessage });

    return messages;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Therapist AI Backend running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 OpenRouter API configured: ${!!OPENROUTER_API_KEY}`);
});

module.exports = app;