import { useState, useRef, useEffect } from 'react'
import './index.css'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const fileInputRef = useRef(null)

  // Clean up object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

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
    // Clean up previous preview URL before allocating a new one
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError(null)
    setActiveTab('overview')
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        throw new Error(data.error || 'Failed to analyze image')
      }
    } catch (err) {
      setError(err.message || 'Could not connect to backend server. Make sure FastAPI is running on port 8000.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setActiveTab('overview')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>AIMD Platform</h1>
        <p>AI-Generated Media Detection &amp; Digital Forensics Analysis</p>
      </header>

      <main className="main-content">
        {/* Upload & Preview Section */}
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
              <div className="preview-image-wrapper">
                <img src={preview} alt="Upload preview" className="image-preview" />
              </div>
              <div className="actions-row">
                <button 
                  className="btn" 
                  onClick={handleAnalyze} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Analyzing Forensic Indicators...' : 'Run Detection'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Upload Another File
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="error-alert">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results & Forensics Section */}
        <section className="glass-panel results-panel">
          {isLoading ? (
            <div className="empty-state">
              <div className="loader"></div>
              <p className="loading-title">Performing Multi-Layer Analysis</p>
              <p className="loading-subtitle">Inspecting neural artifacts, compression noise (ELA), and metadata signatures...</p>
            </div>
          ) : result ? (
            <div className="results-wrapper">
              <div className="result-header">
                <div className={`result-badge ${result.is_ai_generated ? 'badge-fake' : 'badge-real'}`}>
                  {result.is_ai_generated ? 'AI Generated (Deepfake)' : 'Authentic Media'}
                </div>
                
                <p className="confidence-label">
                  Confidence Score: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
                </p>
                
                <div className="confidence-meter">
                  <div 
                    className={`confidence-fill ${result.is_ai_generated ? 'fill-fake' : 'fill-real'}`}
                    style={{ width: `${Math.max(result.confidence * 100, 5)}%` }}
                  ></div>
                  <div className="confidence-text">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="meta-indicator-row">
                  <span>AI Probability: <strong>{((result.fake_probability ?? (result.is_ai_generated ? result.confidence : 1 - result.confidence)) * 100).toFixed(1)}%</strong></span>
                  <span>Model: <strong>Deepfake ViT</strong></span>
                </div>
              </div>

              {/* Sub-tabs for Forensic Details */}
              <div className="tabs-nav">
                <button 
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  AI Model
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'forensics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('forensics')}
                >
                  ELA Forensics
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'metadata' ? 'active' : ''}`}
                  onClick={() => setActiveTab('metadata')}
                >
                  Metadata
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="details-list">
                    <h3>Classification Probabilities</h3>
                    {result.all_scores && result.all_scores.length > 0 ? (
                      result.all_scores.map((scoreInfo, index) => (
                        <div className="score-row" key={index}>
                          <div className="score-label-row">
                            <span className="score-name">{scoreInfo.label}</span>
                            <span className="score-val">{(scoreInfo.score * 100).toFixed(2)}%</span>
                          </div>
                          <div className="mini-meter">
                            <div 
                              className={`mini-fill ${scoreInfo.label.toUpperCase() === 'FAKE' ? 'fill-fake' : 'fill-real'}`}
                              style={{ width: `${scoreInfo.score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="tab-empty">No detailed scores returned.</p>
                    )}
                  </div>
                )}

                {activeTab === 'forensics' && (
                  <div className="forensics-container">
                    <h3>Error Level Analysis (ELA)</h3>
                    <p className="tab-desc">
                      ELA highlights compression variance across image regions. Modified or AI-synthesized elements show distinctive high-contrast anomaly patterns.
                    </p>
                    {result.ela_analysis?.heatmap_base64 ? (
                      <div className="ela-preview-box">
                        <img 
                          src={result.ela_analysis.heatmap_base64} 
                          alt="ELA Heatmap" 
                          className="ela-heatmap-img" 
                        />
                        <div className="ela-stats">
                          <div className="stat-card">
                            <span className="stat-name">Tamper Anomaly Score</span>
                            <span className="stat-val">{((result.ela_analysis.ela_score || 0) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="stat-card">
                            <span className="stat-name">Max Difference</span>
                            <span className="stat-val">{result.ela_analysis.max_difference || 0}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="tab-empty">ELA analysis not available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'metadata' && (
                  <div className="metadata-container">
                    <h3>EXIF &amp; Metadata Inspection</h3>
                    <p className="tab-desc">
                      Authentic camera captures typically include hardware metadata (Make, Model, ISO). AI-generated media usually lack camera hardware tags.
                    </p>
                    <div className="metadata-summary">
                      <span className={`meta-badge ${result.metadata_analysis?.is_suspicious ? 'meta-badge-warning' : 'meta-badge-ok'}`}>
                        {result.metadata_analysis?.is_suspicious ? 'Suspicious / Missing EXIF' : 'Verified Camera Metadata'}
                      </span>
                      <span className="meta-count">
                        Total Tags: {result.metadata_analysis?.total_tags ?? 0}
                      </span>
                    </div>

                    {result.metadata_analysis?.metadata && Object.keys(result.metadata_analysis.metadata).length > 0 ? (
                      <div className="metadata-grid">
                        {Object.entries(result.metadata_analysis.metadata).map(([key, value]) => (
                          <div className="metadata-item" key={key}>
                            <span className="meta-key">{key}:</span>
                            <span className="meta-value">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="tab-empty">No EXIF tags detected in this image.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <p>Upload an image and run detection to inspect AI indicators and forensic heatmaps.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
