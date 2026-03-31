function GameScreen({
  question,
  timer,
  score,
  streak,
  difficulty,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled,
  selectedAnswer,
}) {
  return (
    <section className="card fade-in">
      <div className="stats-row">
        <div>
          <p className="label">Score</p>
          <p className="value">${score.toLocaleString()}</p>
        </div>
        <div>
          <p className="label">Streak</p>
          <p className="value">{streak}</p>
        </div>
        <div>
          <p className="label">Difficulty</p>
          <p className="value capitalize">{difficulty}</p>
        </div>
        <div>
          <p className="label">Timer</p>
          <p className={`value ${timer <= 5 ? 'danger' : ''}`}>{timer}s</p>
        </div>
      </div>

      <div className="question-head">
        <p className="muted">
          Question {questionNumber} / {totalQuestions}
        </p>
        <h2>{question.question}</h2>
      </div>

      <div className="answers-grid" role="group" aria-label="Answer options">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx)
          return (
            <button
              key={option}
              type="button"
              className={`answer-btn ${selectedAnswer === option ? 'selected' : ''}`}
              disabled={disabled}
              onClick={() => onAnswer(option)}
            >
              <span className="letter">{letter}</span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default GameScreen
