import { useEffect, useRef } from 'react'

function DrawingScreen({
  question,
  timer,
  score,
  streak,
  difficulty,
  questionNumber,
  totalQuestions,
  onSubmit,
  disabled,
}) {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#333'
  }, [])

  const handleMouseDown = (e) => {
    if (disabled || !canvasRef.current) return

    isDrawingRef.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || disabled || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleMouseUp = () => {
    isDrawingRef.current = false
  }

  const handleTouchStart = (e) => {
    if (disabled || !canvasRef.current) return

    isDrawingRef.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleTouchMove = (e) => {
    if (!isDrawingRef.current || disabled || !canvasRef.current) return

    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleTouchEnd = () => {
    isDrawingRef.current = false
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSubmit = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const drawingDataUrl = canvas.toDataURL('image/png')
      onSubmit(drawingDataUrl)
    }
  }

  return (
    <div className="card fade-in">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Question {questionNumber} of {totalQuestions}</p>
          <h2>{question.question}</h2>
        </div>
        <div className="score-info">
          <p className="timer">{timer}s</p>
          <p>Score: ${score.toLocaleString()}</p>
          <p>Streak: {streak}</p>
        </div>
      </div>

      <div className="drawing-container">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
      </div>

      <div className="drawing-info">
        <p>Difficulty: <span className="badge">{difficulty}</span></p>
        <div className="button-group">
          <button
            type="button"
            className="secondary"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear Drawing
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleSubmit}
            disabled={disabled}
          >
            Submit Drawing
          </button>
        </div>
      </div>
    </div>
  )
}

export default DrawingScreen
