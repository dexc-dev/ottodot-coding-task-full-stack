'use client'

import { useState, useEffect } from 'react'
import { parseMarkdownTable, containsMarkdownTable, cleanStepText } from '@/lib/markdownRenderer'

interface MathProblem {
  problem_text: string
  final_answer: number
  hint: string
  step_by_step: string[]
}

interface CurriculumTopic {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  problemType: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [availableTopics, setAvailableTopics] = useState<CurriculumTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [score, setScore] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [problemHistory, setProblemHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load available curriculum topics on component mount
  useEffect(() => {
    loadAvailableTopics()
  }, [])

  // Function to render problem text with proper table formatting
  const renderProblemText = (text: string) => {
    if (containsMarkdownTable(text)) {
      const lines = text.split('\n')
      const result = []
      let i = 0
      
      while (i < lines.length) {
        const line = lines[i]
        
        if (line.includes('|') && line.trim().startsWith('|')) {
          // Found start of table, collect all table lines
          const tableLines = []
          while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
            tableLines.push(lines[i])
            i++
          }
          
          const tableText = tableLines.join('\n')
          const tableData = parseMarkdownTable(tableText)
          
          if (tableData) {
            result.push(
              <div key={`table-${i}`} className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableData.headers.map((header, idx) => (
                        <th key={idx} className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-2 border-b text-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        } else {
          result.push(
            <p key={i} className="mb-2 text-gray-800">
              {line}
            </p>
          )
          i++
        }
      }
      
      return result
    } else {
      return text.split('\n').map((line, idx) => (
        <p key={idx} className="mb-2 text-gray-800">
          {line}
        </p>
      ))
    }
  }

  const generateProblem = async () => {
    setIsLoading(true)
    setFeedback('')
    setIsCorrect(null)
    setUserAnswer('')
    setError('')
    
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curriculumTopicId: selectedTopicId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate problem')
      }

      if (data.success) {
        setProblem({
          problem_text: data.problem.problem_text,
          final_answer: data.problem.final_answer,
          hint: data.problem.hint,
          step_by_step: data.problem.step_by_step
        })
        setSessionId(data.session_id)
        setShowHint(false)
        setShowSteps(false)
      } else {
        throw new Error(data.error || 'Failed to generate problem')
      }
    } catch (error) {
      console.error('Error generating problem:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate problem. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionId || !userAnswer) {
      setError('Please generate a problem first and enter your answer.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: parseFloat(userAnswer)
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      if (data.success) {
        setIsCorrect(data.is_correct)
        setFeedback(data.feedback)
        
        // Update score tracking
        setTotalAttempts(prev => prev + 1)
        if (data.is_correct) {
          setScore(prev => prev + 1)
        }
      } else {
        throw new Error(data.error || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }


  const loadAvailableTopics = async () => {
    setIsLoadingTopics(true)
    setError('')
    
    try {
      const response = await fetch('/api/curriculum-topics', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load curriculum topics')
      }

      if (data.success) {
        setAvailableTopics(data.topics)
      } else {
        throw new Error(data.error || 'Failed to load curriculum topics')
      }
    } catch (error) {
      console.error('Error loading curriculum topics:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load curriculum topics. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoadingTopics(false)
    }
  }

  const loadProblemHistory = async () => {
    try {
      const response = await fetch('/api/problem-history?limit=20', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load problem history')
      }

      if (data.success) {
        setProblemHistory(data.sessions)
        setShowHistory(true)
      } else {
        throw new Error(data.error || 'Failed to load problem history')
      }
    } catch (error) {
      console.error('Error loading problem history:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load problem history. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">       
            <div className="flex items-center space-x-6">
              <button
                onClick={loadProblemHistory}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Problem History
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Math Problem Generator
        </h1>
          
          {/* Score Display */}
          {totalAttempts > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Progress</h3>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{score}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{totalAttempts}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Problem Generation Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Generate Your Math Problem</h2>
          
          {/* Curriculum Topic Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Learning Topic (Optional)</label>
            {availableTopics.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="">🎯 General Math Problem</option>
                  {availableTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.difficulty === 'Easy' ? '🟢' : topic.difficulty === 'Medium' ? '🟡' : '🔴'} {topic.category} - {topic.subcategory}: {topic.name}
                    </option>
                  ))}
                </select>
                
                {selectedTopicId && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="text-green-600 text-xl mr-2">✅</div>
                      <div>
                        <p className="text-green-800 font-semibold">Topic Selected!</p>
                        <p className="text-green-700 text-sm">Problems will be tailored to this specific learning objective</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 mb-2">Loading curriculum topics...</p>
                <button
                  onClick={loadAvailableTopics}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh Topics
                </button>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Generating Problem...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">🎯</span>
                {selectedTopicId ? 'Generate Topic-Specific Problem' : 'Generate New Problem'}
              </div>
            )}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Math Problem</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6">
              <div className="text-xl text-gray-800 leading-relaxed text-center">
                {renderProblemText(problem.problem_text)}
              </div>
            </div>
            
            {/* Hint and Steps Buttons */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              <button
                onClick={() => setShowHint(!showHint)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                💡 {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                📝 {showSteps ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>

            {/* Hint Display */}
            {showHint && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 Hint:</h3>
                <p className="text-yellow-700">{problem.hint}</p>
              </div>
            )}

            {/* Step-by-step Display */}
            {showSteps && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-purple-800 mb-3">📝 Step-by-Step Solution:</h3>
                <ol className="space-y-2">
                  {problem.step_by_step.map((step, index) => (
                    <li key={index} className="text-purple-700">
                      <span className="font-semibold">Step {index + 1}:</span> {cleanStepText(step)}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            <form onSubmit={submitAnswer} className="space-y-6">
              <div>
                <label htmlFor="answer" className="block text-lg font-semibold text-gray-700 mb-3 text-center">
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl text-center"
                  placeholder="Enter your answer here"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Checking Answer...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-3">✅</span>
                Submit Answer
                  </div>
                )}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-3">
              <div className="text-red-600 text-2xl mr-3">⚠️</div>
              <h2 className="text-xl font-semibold text-red-700">Error</h2>
            </div>
            <p className="text-red-800 leading-relaxed mb-4">{error}</p>
            <button
              onClick={() => setError('')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Dismiss
            </button>
          </div>
        )}


        {feedback && (
          <div className={`rounded-2xl shadow-lg p-8 mb-8 ${isCorrect ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200'}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">
                {isCorrect ? '🎉' : '💪'}
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                {isCorrect ? 'Excellent Work!' : 'Keep Trying!'}
            </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-700 leading-relaxed mb-6">{feedback}</p>
              
              {isCorrect && (
                <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4 mb-6">
                  <p className="text-green-800 font-semibold">
                    🏆 Great job! You're mastering this concept!
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setFeedback('')
                  setIsCorrect(null)
                  setUserAnswer('')
                  setShowHint(false)
                  setShowSteps(false)
                }}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 px-8 rounded-xl transition duration-200 ease-in-out transform hover:scale-105"
              >
                Try Another Problem
              </button>
            </div>
          </div>
        )}

        {/* Problem History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Problem History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {problemHistory.length > 0 ? (
                <div className="space-y-4">
                  {problemHistory.map((session, index) => (
                    <div key={session.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800">Problem #{index + 1}</h3>
                        <div className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-gray-700 mb-3">{renderProblemText(session.problem_text)}</div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          Score: {session.score}%
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          {session.correct_attempts}/{session.total_attempts} Correct
                        </span>
                        {session.curriculum_topic_name && (
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                            {session.curriculum_topic_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No problems solved yet!</p>
                  <p className="text-gray-400">Start solving problems to see your history here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}