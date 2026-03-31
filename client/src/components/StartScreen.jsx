const CATEGORIES = [
  'Technology',
  'History',
  'Movies',
  'Science',
  'Sports',
  'Music',
  'Geography',
  'Literature',
]

function StartScreen({ selectedCategories, onToggleCategory, onStart, isBusy }) {
  return (
    <section className="card fade-in">
      <p className="eyebrow">Adaptive Millionaire</p>
      <h1>Step Into The Spotlight</h1>
      <p className="muted">
        Pick your preferred topics. The AI host will generate and judge each question in real time.
      </p>

      <div className="category-grid">
        {CATEGORIES.map((category) => {
          const active = selectedCategories.includes(category)
          return (
            <button
              key={category}
              type="button"
              className={`chip ${active ? 'active' : ''}`}
              onClick={() => onToggleCategory(category)}
              disabled={isBusy}
            >
              {category}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="primary"
        onClick={onStart}
        disabled={isBusy || selectedCategories.length === 0}
      >
        {isBusy ? 'Preparing game...' : 'Start Game'}
      </button>
    </section>
  )
}

export default StartScreen
