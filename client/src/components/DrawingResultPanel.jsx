function DrawingResultPanel({
  result,
  onNext,
  isLoadingNext,
  questionNumber,
  totalQuestions,
}) {
  return (
    <div className={`result-panel fade-in ${result.correct ? 'correct' : 'incorrect'}`}>
      <div className="result-header">
        <p className="eyebrow">
          {result.correct ? '✓ Correct!' : '✗ Not Quite'}
        </p>
        <h3>{result.hostReaction}</h3>
      </div>

      <div className="result-content">
        <p className="explanation">{result.explanation}</p>

        {!result.correct && result.missingElements && result.missingElements.length > 0 && (
          <div className="missing-elements">
            <p className="label">Missing elements:</p>
            <ul>
              {result.missingElements.map((element, idx) => (
                <li key={idx}>{element}</li>
              ))}
            </ul>
          </div>
        )}

        {result.feedback && (
          <div className="feedback">
            <p className="label">Feedback:</p>
            <p>{result.feedback}</p>
          </div>
        )}

        {result.reasoning && (
          <details className="reasoning">
            <summary>View reasoning</summary>
            <p>{result.reasoning}</p>
          </details>
        )}

        <div className="confidence">
          <p className="label">Evaluation Confidence: {(result.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="result-actions">
        {questionNumber < totalQuestions ? (
          <button
            type="button"
            className="primary"
            onClick={onNext}
            disabled={isLoadingNext}
          >
            {isLoadingNext ? 'Getting next question...' : 'Next Question'}
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={onNext}
            disabled={isLoadingNext}
          >
            {isLoadingNext ? 'Finishing...' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  )
}

export default DrawingResultPanel
