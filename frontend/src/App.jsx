import { useState, useRef } from 'react'
import './index.css'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Assuming backend runs on port 8000
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Analysis request failed')
      }

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        throw new Error(data.error || 'Failed to analyze image')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>AIMD Platform</h1>
        <p>Detect AI-Generated Media instantly with state-of-the-art models</p>
      </header>

      <main className="main-content">
        {/* Upload Section */}
        <section className="glass-panel">
          {!preview ? (
            <div 
              className={`upload-area ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className="upload-text">Click or drag an image here to analyze</p>
              <p className="upload-subtext">Supports JPG, PNG, WEBP</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="image-preview" />
              <button 
                className="btn" 
                onClick={handleAnalyze} 
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Run Detection'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Choose Another File
              </button>
            </div>
          )}
          
          {error && (
            <div style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>
              Error: {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="glass-panel results-panel">
          {isLoading ? (
            <div className="empty-state">
              <div className="loader"></div>
              <p>Analyzing image structure, noise patterns, and artifacts...</p>
            </div>
          ) : result ? (
            <div>
              <div className="result-header">
                <div className={`result-badge ${result.is_ai_generated ? 'badge-fake' : 'badge-real'}`}>
                  {result.is_ai_generated ? 'AI Generated (Deepfake)' : 'Authentic Media'}
                </div>
                
                <p style={{ color: 'var(--text-secondary)' }}>
                  Confidence Score: {(result.confidence * 100).toFixed(1)}%
                </p>
                
                <div className="confidence-meter">
                  <div 
                    className={`confidence-fill ${result.is_ai_generated ? 'fill-fake' : 'fill-real'}`}
                    style={{ width: `${(result.confidence * 100)}%` }}
                  ></div>
                  <div className="confidence-text">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="details-list">
                <h3>Detection Breakdown</h3>
                {result.all_scores && result.all_scores.map((scoreInfo, index) => (
                  <div className="detail-item" key={index}>
                    <span>{scoreInfo.label}</span>
                    <span>{(scoreInfo.score * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <p>Upload an image and run detection to see results here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
