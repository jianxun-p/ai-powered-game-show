function ResultPanel({
  result,
  correctAnswer,
  onNext,
  isLoadingNext,
  questionNumber,
  totalQuestions,
}) {
  return (
    <section className="card fade-in">
      <p className={`result-badge ${result.correct ? 'ok' : 'bad'}`}>
        {result.correct ? 'Correct!' : 'Incorrect'}
      </p>

      <p>
        <strong>Correct answer:</strong> {correctAnswer}
      </p>

      <div className="result-copy">
        <h3>AI Explanation</h3>
        <p>{result.explanation}</p>
      </div>

      <div className="result-copy">
        <h3>Host Reaction</h3>
        <p>{result.hostReaction}</p>
      </div>

      <button type="button" className="primary" onClick={onNext} disabled={isLoadingNext}>
        {questionNumber >= totalQuestions ? 'See Final Score' : 'Next Question'}
      </button>
    </section>
  )
}

export default ResultPanel
