const OpenAI = require('openai')

const MODEL = 'gpt-5-mini';
const CHECK_DRAWING_MODEL = 'gpt-5';

function getClient() {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is missing')
    }
    
    return new OpenAI({ apiKey })
}

function extractJson(content) {
    if (!content || typeof content !== 'string') {
        throw new Error('OpenAI returned empty content')
    }
    
    try {
        return JSON.parse(content)
    } catch {
        const match = content.match(/\{[\s\S]*\}/)
        if (!match) {
            throw new Error('OpenAI response was not valid JSON')
        }
        return JSON.parse(match[0])
    }
}

function buildHistorySection(history) {
    if (!Array.isArray(history) || history.length === 0) {
        return 'No prior game history available.'
    }
    
    const recent = history.slice(-8)
    return recent
    .map((item, index) => {
        const question = String(item.question || '').trim()
        const selected = String(item.selectedAnswer || '').trim() || 'No answer'
        const correct = item.correct ? 'correct' : 'incorrect'
        return `${index + 1}. Question: ${question}\n   User answer: ${selected}\n   Result: ${correct}`
    })
    .join('\n')
}

async function generateQuestion({ category, difficulty, history = [] }) {
    const client = getClient()
    const historyContext = buildHistorySection(history)
    
    const prompt = `Generate a multiple choice trivia question. 
    
Constraints:
- Category: ${category}
- Difficulty: ${difficulty}
- Must be factually correct
- Provide exactly 4 options
- Only one correct answer
- Avoid repeating questions that are semantically similar to recent history
    
Recent game history:
    ${historyContext}
    
Return JSON in this exact format:
{
"question": "question for the selected category and difficulty, keep it concise",
"wrongAnswers": ["Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"],
"correctAnswer": "Correct Answer",
"explanation": "explanation of the correct answer, 1-2 sentences",
"responseForCorrect": "Short reaction if user is correct",
"responseForIncorrect": "Short reaction if user is incorrect"
}`
    
    
    const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 1,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                'You are a rigorous trivia writer. Always return valid JSON and ensure factual correctness.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
    })
    
    const parsed = extractJson(completion.choices[0]?.message?.content)
    
    if (
        typeof parsed.question !== 'string' ||
        !Array.isArray(parsed.wrongAnswers) ||
        parsed.wrongAnswers.length !== 3 ||
        typeof parsed.correctAnswer !== 'string' ||
        typeof parsed.explanation !== 'string' ||
        typeof parsed.responseForCorrect !== 'string' ||
        typeof parsed.responseForIncorrect !== 'string'
    ) {
        throw new Error('Question payload did not match expected schema')
    }
    
    return {
        question: parsed.question.trim(),
        wrongAnswers: parsed.wrongAnswers.map((item) => String(item).trim()),
        correctAnswer: parsed.correctAnswer.trim(),
        explanation: parsed.explanation.trim(),
        responseForCorrect: parsed.responseForCorrect.trim(),
        responseForIncorrect: parsed.responseForIncorrect.trim(),
    }
}

async function generateDrawingQuestion({ category, difficulty, history = [] }) {
    const client = getClient()
    const historyContext = buildHistorySection(history)
    
    const prompt = `Generate a drawing/diagram question for a trivia game.
    
Constraints:
- Category: ${category}
- Difficulty: ${difficulty}
- Must be something that can be clearly drawn or diagrammed (e.g., "Draw the water cycle", "Draw the structure of a DNA molecule", "Draw the flag of Japan")
- Should be visual and unambiguous
- Avoid questions that require impossibly detailed drawings
- Must be factually correct
- Avoid repeating questions that are semantically similar to recent history
    
Recent game history:
    ${historyContext}
    
Return JSON in this exact format:
{
"question": "Clear instruction for what to draw, e.g., 'Draw the water cycle'",
"expectedElements": ["element 1", "element 2", "element 3"],
"explanation": "explanation of what the correct drawing should contain and why, 2-3 sentences",
"responseForCorrect": "Short reaction if user draws correctly",
"responseForIncorrect": "Short reaction if user's drawing is missing key elements"
}`
    
    const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 1,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                'You are an expert at creating drawing-based trivia questions that are visual and unambiguous.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
    })
    
    const parsed = extractJson(completion.choices[0]?.message?.content)
    
    if (
        typeof parsed.question !== 'string' ||
        !Array.isArray(parsed.expectedElements) ||
        parsed.expectedElements.length === 0 ||
        typeof parsed.explanation !== 'string' ||
        typeof parsed.responseForCorrect !== 'string' ||
        typeof parsed.responseForIncorrect !== 'string'
    ) {
        throw new Error('Drawing question payload did not match expected schema')
    }
    
    return {
        question: parsed.question.trim(),
        expectedElements: parsed.expectedElements.map((item) => String(item).trim()),
        explanation: parsed.explanation.trim(),
        responseForCorrect: parsed.responseForCorrect.trim(),
        responseForIncorrect: parsed.responseForIncorrect.trim(),
    }
}

async function checkDrawing({ drawingDataUrl, question, expectedElements, explanation, streak, difficulty }) {
    const client = getClient()
    
    const prompt = `You are an expert at evaluating hand-drawn diagrams and sketches based on what they should contain.
    
A user was asked: "${question}"

The expected elements that should be in the drawing are:
${expectedElements.map((el, i) => `${i + 1}. ${el}`).join('\n')}

The user submitted a drawing (as an image). Evaluate if the drawing correctly represents what was asked.

Only respond with valid JSON in this format:
{
"correct": true or false,
"confidence": 0.0 to 1.0,
"missingElements": ["element1", "element2"] or empty array,
"feedback": "Brief feedback about the drawing (1-2 sentences)",
"reasoning": "Why the drawing is correct or incorrect"
}`

    const completion = await client.chat.completions.create({
        model: CHECK_DRAWING_MODEL,
        temperature: 1,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: drawingDataUrl,
                        },
                    },
                ],
            },
        ],
    })
    
    const parsed = extractJson(completion.choices[0]?.message?.content)
    
    if (
        typeof parsed.correct !== 'boolean' ||
        typeof parsed.confidence !== 'number' ||
        !Array.isArray(parsed.missingElements) ||
        typeof parsed.feedback !== 'string' ||
        typeof parsed.reasoning !== 'string'
    ) {
        throw new Error('Drawing check response did not match expected schema')
    }
    
    return {
        correct: parsed.correct,
        confidence: parsed.confidence,
        missingElements: parsed.missingElements,
        feedback: parsed.feedback,
        reasoning: parsed.reasoning,
        explanation,
    }
}

module.exports = {
    generateQuestion,
    generateDrawingQuestion,
    checkDrawing
}
