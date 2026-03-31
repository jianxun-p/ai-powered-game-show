require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { generateQuestion, generateDrawingQuestion, checkDrawing } = require('./routes/openai');
const crypto = require('crypto');
const path = require('path');

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(session({ secret: crypto.randomBytes(32).toString('hex'), resave: false, saveUninitialized: true, cookie: { secure: false, httpOnly: true, sameSite: 'strict' } }));

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));


const DIFFICULTIES = ['easy', 'medium', 'hard'];

function normalizeDifficulty(value) {
    if (!value || typeof value !== 'string') {
        return 'easy';
    }
    
    const normalized = value.toLowerCase();
    return DIFFICULTIES.includes(normalized) ? normalized : 'easy';
}

function increaseDifficulty(difficulty) {
    if (difficulty === 'easy') return 'medium';
    if (difficulty === 'medium') return 'hard';
    return 'hard';
}

function decreaseDifficulty(difficulty) {
    if (difficulty === 'hard') return 'medium';
    if (difficulty === 'medium') return 'easy';
    return 'easy';
}

function computeNextDifficulty({ correct, streak, difficulty }) {
    if (!correct) {
        return decreaseDifficulty(difficulty);
    }
    
    if (streak >= 2) {
        return increaseDifficulty(difficulty);
    }
    
    return difficulty;
}

function getQuestionHistory(req) {
    if (!Array.isArray(req.session.questionHistory)) {
        req.session.questionHistory = [];
    }
    
    return req.session.questionHistory;
}

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'adaptive-millionaire-api' });
})

app.post('/api/question', async (req, res) => {
    try {
        const category = String(req.body?.category || '').trim();
        const difficulty = normalizeDifficulty(req.body?.difficulty);
        
        if (!category) {
            return res.status(400).json({ error: 'category is required' });
        }
        
        const history = getQuestionHistory(req);
        const question = await generateQuestion({ category, difficulty, history });
        req.session.currentQuestion = {
            ...question,
            category,
            difficulty,
            askedAt: new Date().toISOString(),
        };
        
        return res.json(question);
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to generate question',
            details: error.message,
        });
    }
})

app.post('/api/answer', async (req, res) => {
    try {
        const sessionQuestion = req.session?.currentQuestion;
        const selectedAnswer = req.body?.selectedAnswer;
        const streak = Number(req.body?.streak || 0);
        const difficulty = normalizeDifficulty(req.body?.difficulty);
        
        if (!sessionQuestion || typeof sessionQuestion !== 'object') {
            return res.status(400).json({
                error: 'No active question found in session. Request /api/question first.',
            });
        }
        
        if (typeof selectedAnswer !== 'string') {
            return res.status(400).json({ error: 'selectedAnswer is required' });
        }
        
        if (!sessionQuestion.correctAnswer) {
            return res.status(400).json({ error: 'Current question is missing correct answer data.' });
        }
        
        const correct = String(selectedAnswer).trim().toLowerCase() === String(sessionQuestion.correctAnswer).trim().toLowerCase();
        const nextDifficulty = computeNextDifficulty({ correct, streak, difficulty });
        const explanation = sessionQuestion.explanation || 'No explanation available.';
        const hostReaction = correct ? sessionQuestion.responseForCorrect : sessionQuestion.responseForIncorrect;
        
        const history = getQuestionHistory(req);
        history.push({
            question: sessionQuestion.question,
            category: sessionQuestion.category,
            difficulty: sessionQuestion.difficulty,
            selectedAnswer,
            correctAnswer: sessionQuestion.correctAnswer,
            correct,
            explanation,
            answeredAt: new Date().toISOString(),
        });
        
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        
        req.session.currentQuestion = null;
        
        return res.json({
            correct,
            explanation,
            hostReaction,
            nextDifficulty,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to validate answer',
            details: error.message,
        });
    }
})

app.post('/api/drawing-question', async (req, res) => {
    try {
        const category = String(req.body?.category || '').trim();
        const difficulty = normalizeDifficulty(req.body?.difficulty);
        
        if (!category) {
            return res.status(400).json({ error: 'category is required' });
        }
        
        const history = getQuestionHistory(req);
        const drawingQuestion = await generateDrawingQuestion({ category, difficulty, history });
        req.session.currentQuestion = {
            ...drawingQuestion,
            category,
            difficulty,
            askedAt: new Date().toISOString(),
            type: 'drawing',
        };
        
        return res.json({
            ...drawingQuestion,
            timeToAnswer: 180, // 3 minutes for drawing questions
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to generate drawing question',
            details: error.message,
        });
    }
})

app.post('/api/check-drawing', async (req, res) => {
    try {
        const sessionQuestion = req.session?.currentQuestion;
        const drawingDataUrl = req.body?.drawingDataUrl;
        const streak = Number(req.body?.streak || 0);
        const difficulty = normalizeDifficulty(req.body?.difficulty);
        
        if (!sessionQuestion || typeof sessionQuestion !== 'object') {
            return res.status(400).json({
                error: 'No active question found in session. Request /api/drawing-question first.',
            });
        }
        
        if (typeof drawingDataUrl !== 'string' || !drawingDataUrl.startsWith('data:image')) {
            return res.status(400).json({ error: 'drawingDataUrl is required and must be valid image data' });
        }
        
        const drawingResult = await checkDrawing({
            drawingDataUrl,
            question: sessionQuestion.question,
            expectedElements: sessionQuestion.expectedElements,
            explanation: sessionQuestion.explanation,
            streak,
            difficulty,
        });
        
        const nextDifficulty = computeNextDifficulty({ correct: drawingResult.correct, streak, difficulty });
        const hostReaction = drawingResult.correct ? sessionQuestion.responseForCorrect : sessionQuestion.responseForIncorrect;
        
        const history = getQuestionHistory(req);
        history.push({
            question: sessionQuestion.question,
            category: sessionQuestion.category,
            difficulty: sessionQuestion.difficulty,
            type: 'drawing',
            correct: drawingResult.correct,
            explanation: sessionQuestion.explanation,
            answeredAt: new Date().toISOString(),
        });
        
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        
        req.session.currentQuestion = null;
        return res.json({
            correct: drawingResult.correct,
            confidence: drawingResult.confidence,
            missingElements: drawingResult.missingElements,
            feedback: drawingResult.feedback,
            reasoning: drawingResult.reasoning,
            explanation: drawingResult.explanation,
            hostReaction,
            nextDifficulty,
        });
    } catch (error) {
        console.error('Error in /api/check-drawing:', error);
        return res.status(500).json({
            error: 'Failed to check drawing',
            details: error.message,
        });
    }
})

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Adaptive Millionaire API running on: http://localhost:${PORT}`)
})
