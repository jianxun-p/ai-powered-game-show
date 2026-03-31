function MoneyLadder({ levels, currentIndex }) {
  return (
    <aside className="money-ladder card fade-in" aria-label="Money ladder">
      <h3>Money Ladder</h3>
      <ol>
        {levels
          .map((value, idx) => ({ value, idx }))
          .reverse()
          .map(({ value, idx }) => (
            <li key={value} className={idx === currentIndex ? 'active' : ''}>
              <span>Q{idx + 1}</span>
              <strong>${value.toLocaleString()}</strong>
            </li>
          ))}
      </ol>
    </aside>
  )
}

export default MoneyLadder
