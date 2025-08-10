 
    // Backend Proxy Server for Gemini API Integration
// This keeps your API key secure on the server side

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2
require('dotenv').config(); // npm install dotenv

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set this in your .env file
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        // Build therapist prompt with context
        const prompt = buildTherapistPrompt(message, history);

        // Prepare Gemini API request
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
                stopSequences: []
            },
            safetySettings: [{
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }, {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }, {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }, {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }]
        };

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(response.status).json({
                error: `Gemini API Error: ${errorData.error?.message || response.statusText}`
            });
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponse) {
            return res.status(500).json({ error: 'No response generated' });
        }

        // Return clean response
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
        geminiConfigured: !!GEMINI_API_KEY
    });
});

// Serve static files (your frontend)
app.use(express.static('public'));

// Helper function to build therapist prompt
function buildTherapistPrompt(userMessage, history = []) {
    // Get recent conversation context (last 5 messages)
    const recentHistory = history.slice(-5);
    const contextString = recentHistory
        .map(msg => `${msg.type === 'user' ? 'User' : 'Therapist'}: ${msg.content}`)
        .join('\n');

    const prompt = `You are a compassionate, professional AI therapist. Your role is to:
- Listen actively and provide empathetic responses
- Ask thoughtful, open-ended questions to help users explore their feelings
- Provide gentle guidance and evidence-based coping strategies
- Maintain a warm, non-judgmental, and supportive tone
- Keep responses concise but meaningful (2-4 sentences)
- Recognize when professional help may be needed and suggest it appropriately

${contextString ? `Previous conversation context:\n${contextString}\n\n` : ''}User's current message: "${userMessage}"

Please respond as a skilled therapist would, focusing on the user's emotional wellbeing:`;
    return prompt;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Therapist AI Backend running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Gemini API configured: ${!!GEMINI_API_KEY}`);
});

module.exports = app;