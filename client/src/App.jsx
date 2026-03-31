import { useEffect, useMemo, useState } from 'react'
import GameScreen from './components/GameScreen'
import DrawingScreen from './components/DrawingScreen'
import MoneyLadder from './components/MoneyLadder'
import ResultPanel from './components/ResultPanel'
import DrawingResultPanel from './components/DrawingResultPanel'
import StartScreen from './components/StartScreen'
import './App.css'

const TOTAL_QUESTIONS = 10
const QUESTION_TIME_SECONDS = 15
const MONEY_LEVELS = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function App() {
  const [screen, setScreen] = useState('start')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [difficulty, setDifficulty] = useState('easy')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionType, setQuestionType] = useState('multiple-choice') // 'multiple-choice' or 'drawing'
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [timer, setTimer] = useState(QUESTION_TIME_SECONDS)
  const [isFetchingQuestion, setIsFetchingQuestion] = useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isBusy = isFetchingQuestion || isSubmittingAnswer

  const moneyIndex = useMemo(() => {
    return Math.max(0, Math.min(questionNumber - 1, MONEY_LEVELS.length - 1))
  }, [questionNumber])

  const gameOver = screen === 'summary'

  useEffect(() => {
    if (screen !== 'game' || !currentQuestion || result || isBusy) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          handleAnswer('__NO_ANSWER__')
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [screen, currentQuestion, result, isBusy])

  const fetchQuestion = async (nextDifficulty, roundNumber = questionNumber) => {
    setIsFetchingQuestion(true)
    setErrorMessage('')

    try {
      const category =
        selectedCategories[Math.floor(Math.random() * selectedCategories.length)]

      // Randomize question type (50% chance of drawing question)
      const shouldBeDrawing = Math.random() > 0.5
      const newQuestionType = shouldBeDrawing ? 'drawing' : 'multiple-choice'
      setQuestionType(newQuestionType)

      const endpoint = newQuestionType === 'drawing' ? '/api/drawing-question' : '/api/question'

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          difficulty: nextDifficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not generate a question right now.')
      }

      const data = await response.json()

      if (newQuestionType === 'multiple-choice') {
        const options = shuffle([data.correctAnswer, ...data.wrongAnswers])
        setCurrentQuestion({
          ...data,
          category,
          difficulty: nextDifficulty,
          roundNumber,
          options,
        })
      } else {
        // Drawing question
        setCurrentQuestion({
          ...data,
          category,
          difficulty: nextDifficulty,
          roundNumber,
          options: []
        })
      }

      setTimer(data.timeToAnswer ?? QUESTION_TIME_SECONDS);
      setSelectedAnswer('')
      setResult(null)
      setScreen('game')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsFetchingQuestion(false)
    }
  }

  const handleStart = async () => {
    if (selectedCategories.length === 0) {
      return
    }

    setDifficulty('easy')
    setScore(0)
    setStreak(0)
    setQuestionNumber(1)
    await fetchQuestion('easy', 1)
  }

  const handleToggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category)
      }
      return [...prev, category]
    })
  }

  const handleAnswer = async (answer) => {
    if (!currentQuestion || result || isSubmittingAnswer) {
      return
    }

    setSelectedAnswer(answer)
    setIsSubmittingAnswer(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionData: {
            question: currentQuestion.question,
            wrongAnswers: currentQuestion.wrongAnswers,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation,
            category: currentQuestion.category,
          },
          selectedAnswer: answer,
          streak,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not validate answer right now.')
      }

      const answerResult = await response.json()

      if (answerResult.correct) {
        setScore((prev) => prev + MONEY_LEVELS[questionNumber - 1])
        setStreak((prev) => prev + 1)
      } else {
        setStreak(0)
      }

      setDifficulty(answerResult.nextDifficulty)
      setResult(answerResult)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleDrawingSubmit = async (drawingDataUrl) => {
    if (!currentQuestion || result || isSubmittingAnswer) {
      return
    }

    setIsSubmittingAnswer(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/check-drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingDataUrl,
          streak,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not validate drawing right now.')
      }

      const drawingResult = await response.json()

      if (drawingResult.correct) {
        setScore((prev) => prev + MONEY_LEVELS[questionNumber - 1])
        setStreak((prev) => prev + 1)
      } else {
        setStreak(0)
      }

      setDifficulty(drawingResult.nextDifficulty)
      setResult(drawingResult)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleNextQuestion = async () => {
    if (!result) {
      return
    }

    if (questionNumber >= TOTAL_QUESTIONS) {
      setScreen('summary')
      return
    }

    const nextQuestionNumber = questionNumber + 1
    setQuestionNumber(nextQuestionNumber)
    await fetchQuestion(difficulty, nextQuestionNumber)
  }

  const handlePlayAgain = () => {
    setScreen('start')
    setCurrentQuestion(null)
    setResult(null)
    setSelectedAnswer('')
    setTimer(QUESTION_TIME_SECONDS)
    setDifficulty('easy')
    setScore(0)
    setStreak(0)
    setQuestionNumber(1)
    setQuestionType('multiple-choice')
    setErrorMessage('')
  }

  return (
    <main className="app-shell">
      <div className="layout-grid">
        <section>
          {screen === 'start' && (
            <StartScreen
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onStart={handleStart}
              isBusy={isBusy}
            />
          )}

          {screen === 'game' && currentQuestion && (
            <>
              {questionType === 'multiple-choice' ? (
                <>
                  <GameScreen
                    question={currentQuestion}
                    timer={timer}
                    score={score}
                    streak={streak}
                    difficulty={difficulty}
                    questionNumber={questionNumber}
                    totalQuestions={TOTAL_QUESTIONS}
                    onAnswer={handleAnswer}
                    disabled={Boolean(result) || isBusy}
                    selectedAnswer={selectedAnswer}
                  />

                  {result && (
                    <ResultPanel
                      result={result}
                      correctAnswer={currentQuestion.correctAnswer}
                      onNext={handleNextQuestion}
                      isLoadingNext={isFetchingQuestion}
                      questionNumber={questionNumber}
                      totalQuestions={TOTAL_QUESTIONS}
                    />
                  )}
                </>
              ) : (
                <>
                  <DrawingScreen
                    question={currentQuestion}
                    timer={timer}
                    score={score}
                    streak={streak}
                    difficulty={difficulty}
                    questionNumber={questionNumber}
                    totalQuestions={TOTAL_QUESTIONS}
                    onSubmit={handleDrawingSubmit}
                    disabled={Boolean(result) || isBusy}
                  />

                  {result && (
                    <DrawingResultPanel
                      result={result}
                      onNext={handleNextQuestion}
                      isLoadingNext={isFetchingQuestion}
                      questionNumber={questionNumber}
                      totalQuestions={TOTAL_QUESTIONS}
                    />
                  )}
                </>
              )}
            </>
          )}

          {gameOver && (
            <section className="card fade-in">
              <p className="eyebrow">Game Complete</p>
              <h2>You leave the stage with ${score.toLocaleString()}.</h2>
              <p className="muted">Final streak: {streak}</p>
              <button type="button" className="primary" onClick={handlePlayAgain}>
                Play Again
              </button>
            </section>
          )}

          {isFetchingQuestion && <p className="loading">AI is crafting your next question...</p>}
          {isSubmittingAnswer && (
            <p className="loading">
              {questionType === 'drawing' ? 'AI host is evaluating your drawing...' : 'AI host is judging your answer...'}
            </p>
          )}
          {errorMessage && <p className="error">{errorMessage}</p>}
        </section>

        <MoneyLadder levels={MONEY_LEVELS} currentIndex={moneyIndex} />
      </div>
    </main>
  )
}

export default App
