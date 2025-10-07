'use client';

import { cleanStepText, containsMarkdownTable, parseMarkdownTable } from '@/lib/markdownRenderer';
import { useEffect, useState } from 'react';

interface MathProblem {
    problem_text: string;
    final_answer: number;
    hint: string;
    step_by_step: string[];
}

interface CurriculumTopic {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    problemType: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
}

export default function Home() {
    const [problem, setProblem] = useState<MathProblem | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState('');
    const [availableTopics, setAvailableTopics] = useState<CurriculumTopic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [isLoadingTopics, setIsLoadingTopics] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [score, setScore] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [problemHistory, setProblemHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load available curriculum topics on component mount
    useEffect(() => {
        loadAvailableTopics();
    }, []);

    // Function to render problem text with proper table formatting
    const renderProblemText = (text: string) => {
        if (containsMarkdownTable(text)) {
            const lines = text.split('\n');
            const result = [];
            let i = 0;

            while (i < lines.length) {
                const line = lines[i];

                if (line.includes('|') && line.trim().startsWith('|')) {
                    // Found start of table, collect all table lines
                    const tableLines = [];
                    while (
                        i < lines.length &&
                        lines[i].includes('|') &&
                        lines[i].trim().startsWith('|')
                    ) {
                        tableLines.push(lines[i]);
                        i++;
                    }

                    const tableText = tableLines.join('\n');
                    const tableData = parseMarkdownTable(tableText);

                    if (tableData) {
                        result.push(
                            <div key={`table-${i}`}>
                                <table>
                                    <thead>
                                        <tr>
                                            {tableData.headers.map((header, idx) => (
                                                <th key={idx}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.rows.map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                                {row.map((cell, cellIdx) => (
                                                    <td key={cellIdx}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }
                } else {
                    result.push(<p key={i}>{line}</p>);
                    i++;
                }
            }

            return result;
        } else {
            return text.split('\n').map((line, idx) => <p key={idx}>{line}</p>);
        }
    };

    const generateProblem = async () => {
        setIsLoading(true);
        setFeedback('');
        setIsCorrect(null);
        setUserAnswer('');
        setError('');

        try {
            const response = await fetch('/api/math-problem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    curriculumTopicId: selectedTopicId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate problem');
            }

            if (data.success) {
                setProblem({
                    problem_text: data.problem.problem_text,
                    final_answer: data.problem.final_answer,
                    hint: data.problem.hint,
                    step_by_step: data.problem.step_by_step,
                });
                setSessionId(data.session_id);
                setShowHint(false);
                setShowSteps(false);
            } else {
                throw new Error(data.error || 'Failed to generate problem');
            }
        } catch (error) {
            console.error('Error generating problem:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to generate problem. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sessionId || !userAnswer) {
            setError('Please generate a problem first and enter your answer.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/math-problem/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_answer: parseFloat(userAnswer),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit answer');
            }

            if (data.success) {
                setIsCorrect(data.is_correct);
                setFeedback(data.feedback);

                // Update score tracking
                setTotalAttempts(prev => prev + 1);
                if (data.is_correct) {
                    setScore(prev => prev + 1);
                }
            } else {
                throw new Error(data.error || 'Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to submit answer. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableTopics = async () => {
        setIsLoadingTopics(true);
        setError('');

        try {
            const response = await fetch('/api/curriculum-topics', {
                method: 'GET',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load curriculum topics');
            }

            if (data.success) {
                setAvailableTopics(data.topics);
            } else {
                throw new Error(data.error || 'Failed to load curriculum topics');
            }
        } catch (error) {
            console.error('Error loading curriculum topics:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load curriculum topics. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoadingTopics(false);
        }
    };

    const loadProblemHistory = async () => {
        try {
            const response = await fetch('/api/problem-history?limit=20', {
                method: 'GET',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load problem history');
            }

            if (data.success) {
                setProblemHistory(data.sessions);
                setShowHistory(true);
            } else {
                throw new Error(data.error || 'Failed to load problem history');
            }
        } catch (error) {
            console.error('Error loading problem history:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load problem history. Please try again.';
            setError(errorMessage);
        }
    };

    return (
        <div className=''>
            {/* Header */}
            <header>
                <div>
                    <div>
                        <div>
                            <button onClick={loadProblemHistory}>Problem History</button>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <div>
                    <h1>Math Problem Generator</h1>

                    {/* Score Display */}
                    {totalAttempts > 0 && (
                        <div>
                            <h3>Your Progress</h3>
                            <div>
                                <div>
                                    <div>{score}</div>
                                    <div>Correct</div>
                                </div>
                                <div>
                                    <div>{totalAttempts}</div>
                                    <div>Total</div>
                                </div>
                                <div>
                                    <div>
                                        {totalAttempts > 0
                                            ? Math.round((score / totalAttempts) * 100)
                                            : 0}
                                        %
                                    </div>
                                    <div>Score</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Problem Generation Section */}
                <div>
                    <h2>Generate Your Math Problem</h2>

                    {/* Curriculum Topic Selection */}
                    <div>
                        <label>Select Learning Topic (Optional)</label>
                        {availableTopics.length > 0 ? (
                            <div>
                                <select
                                    value={selectedTopicId}
                                    onChange={e => setSelectedTopicId(e.target.value)}
                                >
                                    <option value="">🎯 General Math Problem</option>
                                    {availableTopics.map(topic => (
                                        <option key={topic.id} value={topic.id}>
                                            {topic.difficulty === 'Easy'
                                                ? '🟢'
                                                : topic.difficulty === 'Medium'
                                                  ? '🟡'
                                                  : '🔴'}{' '}
                                            {topic.category} - {topic.subcategory}: {topic.name}
                                        </option>
                                    ))}
                                </select>

                                {selectedTopicId && (
                                    <div>
                                        <div>
                                            <div>✅</div>
                                            <div>
                                                <p>Topic Selected!</p>
                                                <p>
                                                    Problems will be tailored to this specific
                                                    learning objective
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p>Loading curriculum topics...</p>
                                <button onClick={loadAvailableTopics}>Refresh Topics</button>
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button onClick={generateProblem} disabled={isLoading}>
                        {isLoading ? (
                            <div>
                                <div>Loading...</div>
                                Generating Problem...
                            </div>
                        ) : (
                            <div>
                                <span>🎯</span>
                                {selectedTopicId
                                    ? 'Generate Topic-Specific Problem'
                                    : 'Generate New Problem'}
                            </div>
                        )}
                    </button>
                </div>

                {problem && (
                    <div>
                        <div>
                            <h2>Math Problem</h2>
                        </div>

                        <div>
                            <div>{renderProblemText(problem.problem_text)}</div>
                        </div>

                        {/* Hint and Steps Buttons */}
                        <div>
                            <button onClick={() => setShowHint(!showHint)}>
                                💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                            </button>
                            <button onClick={() => setShowSteps(!showSteps)}>
                                📝 {showSteps ? 'Hide Steps' : 'Show Steps'}
                            </button>
                        </div>

                        {/* Hint Display */}
                        {showHint && (
                            <div>
                                <h3>💡 Hint:</h3>
                                <p>{problem.hint}</p>
                            </div>
                        )}

                        {/* Step-by-step Display */}
                        {showSteps && (
                            <div>
                                <h3>📝 Step-by-Step Solution:</h3>
                                <ol>
                                    {problem.step_by_step.map((step, index) => (
                                        <li key={index}>
                                            <span>Step {index + 1}:</span> {cleanStepText(step)}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <form onSubmit={submitAnswer}>
                            <div>
                                <label htmlFor="answer">Your Answer:</label>
                                <input
                                    type="number"
                                    id="answer"
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    placeholder="Enter your answer here"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={!userAnswer || isLoading}>
                                {isLoading ? (
                                    <div>
                                        <div>Loading...</div>
                                        Checking Answer...
                                    </div>
                                ) : (
                                    <div>
                                        <span>✅</span>
                                        Submit Answer
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {error && (
                    <div>
                        <div>
                            <div>⚠️</div>
                            <h2>Error</h2>
                        </div>
                        <p>{error}</p>
                        <button onClick={() => setError('')}>Dismiss</button>
                    </div>
                )}

                {feedback && (
                    <div>
                        <div>
                            <div>{isCorrect ? '🎉' : '💪'}</div>
                            <h2>{isCorrect ? 'Excellent Work!' : 'Keep Trying!'}</h2>
                            <p>{feedback}</p>

                            {isCorrect && (
                                <div>
                                    <p>🏆 Great job! You're mastering this concept!</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setFeedback('');
                                    setIsCorrect(null);
                                    setUserAnswer('');
                                    setShowHint(false);
                                    setShowSteps(false);
                                }}
                            >
                                Try Another Problem
                            </button>
                        </div>
                    </div>
                )}

                {/* Problem History Modal */}
                {showHistory && (
                    <div>
                        <div>
                            <div>
                                <h2>Problem History</h2>
                                <button onClick={() => setShowHistory(false)}>×</button>
                            </div>

                            {problemHistory.length > 0 ? (
                                <div>
                                    {problemHistory.map((session, index) => (
                                        <div key={session.id}>
                                            <div>
                                                <h3>Problem #{index + 1}</h3>
                                                <div>
                                                    {new Date(
                                                        session.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div>{renderProblemText(session.problem_text)}</div>
                                            <div>
                                                <span>Score: {session.score}%</span>
                                                <span>
                                                    {session.correct_attempts}/
                                                    {session.total_attempts} Correct
                                                </span>
                                                {session.curriculum_topic_name && (
                                                    <span>{session.curriculum_topic_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <p>No problems solved yet!</p>
                                    <p>Start solving problems to see your history here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
