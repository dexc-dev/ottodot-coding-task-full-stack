'use client';

import { cleanStepText, containsMarkdownTable, parseMarkdownTable } from '@/lib/markdownRenderer';
import { useEffect, useState } from 'react';
import { GradientClassesButton } from '@/components/ui/ButtonVariants';

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
        <div className='w-full max-w-4xl mx-auto px-4 py-8'>
            {/* Header */}
            <header className='mb-8'>
                <div className='flex justify-end'>
                    <button 
                        onClick={loadProblemHistory}
                        className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                    >
                        Problem History
                    </button>
                </div>
            </header>

            <main className='space-y-8'>
                {/* Hero Section */}
                <div className='text-center'>
                    <h1 className='text-4xl font-bold text-gray-800 mb-6'>Math Problem Generator</h1>

                    {/* Score Display */}
                    {totalAttempts > 0 && (
                        <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
                            <h3 className='text-xl font-semibold text-gray-700 mb-4'>Your Progress</h3>
                            <div className='grid grid-cols-3 gap-4'>
                                <div className='text-center'>
                                    <div className='text-2xl font-bold text-green-600'>{score}</div>
                                    <div className='text-sm text-gray-600'>Correct</div>
                                </div>
                                <div className='text-center'>
                                    <div className='text-2xl font-bold text-blue-600'>{totalAttempts}</div>
                                    <div className='text-sm text-gray-600'>Total</div>
                                </div>
                                <div className='text-center'>
                                    <div className='text-2xl font-bold text-purple-600'>
                                        {totalAttempts > 0
                                            ? Math.round((score / totalAttempts) * 100)
                                            : 0}
                                        %
                                    </div>
                                    <div className='text-sm text-gray-600'>Score</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Problem Generation Section */}
                <div className='bg-white rounded-lg shadow-md p-6'>
                    <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>Generate Your Math Problem</h2>

                    {/* Curriculum Topic Selection */}
                    <div className='mb-6'>
                        <label className='block text-sm font-semibold text-gray-700 mb-3'>Select Learning Topic (Optional)</label>
                        {availableTopics.length > 0 ? (
                            <div className='space-y-3'>
                                <select
                                    value={selectedTopicId}
                                    onChange={e => setSelectedTopicId(e.target.value)}
                                    className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg'
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
                                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                                        <div className='flex items-center'>
                                            <div className='text-green-600 mr-3'>✅</div>
                                            <div>
                                                <p className='font-semibold text-green-800'>Topic Selected!</p>
                                                <p className='text-sm text-green-700'>
                                                    Problems will be tailored to this specific
                                                    learning objective
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='text-center py-4'>
                                <p className='text-gray-600 mb-4'>Loading curriculum topics...</p>
                                <button 
                                    onClick={loadAvailableTopics}
                                    className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
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
                        className='w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                    >
                        {isLoading ? (
                            <div className='flex items-center justify-center'>
                                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                                Generating Problem...
                            </div>
                        ) : (
                            <div className='flex items-center justify-center'>
                                <span className='mr-2'>🎯</span>
                                {selectedTopicId
                                    ? 'Generate Topic-Specific Problem'
                                    : 'Generate New Problem'}
                            </div>
                        )}
                    </button>

                    {/* Weekly Online Classes Button */}
                    <div className='mt-4'>
                        <GradientClassesButton 
                            fullWidth
                            onClick={() => {
                                // Add your weekly classes functionality here
                                console.log('Weekly Online Classes clicked');
                            }}
                        >
                            Weekly Online Classes
                        </GradientClassesButton>
                    </div>
                </div>

                {problem && (
                    <div className='bg-white rounded-lg shadow-md p-6'>
                        <div className='text-center mb-6'>
                            <h2 className='text-2xl font-bold text-gray-800'>Math Problem</h2>
                        </div>

                        <div className='bg-gray-50 rounded-lg p-6 mb-6'>
                            <div className='text-lg leading-relaxed'>{renderProblemText(problem.problem_text)}</div>
                        </div>

                        {/* Hint and Steps Buttons */}
                        <div className='flex gap-3 mb-6'>
                            <button 
                                onClick={() => setShowHint(!showHint)}
                                className='flex-1 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium rounded-lg transition-colors'
                            >
                                💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                            </button>
                            <button 
                                onClick={() => setShowSteps(!showSteps)}
                                className='flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-lg transition-colors'
                            >
                                📝 {showSteps ? 'Hide Steps' : 'Show Steps'}
                            </button>
                        </div>

                        {/* Hint Display */}
                        {showHint && (
                            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                                <h3 className='font-semibold text-yellow-800 mb-2'>💡 Hint:</h3>
                                <p className='text-yellow-700'>{problem.hint}</p>
                            </div>
                        )}

                        {/* Step-by-step Display */}
                        {showSteps && (
                            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
                                <h3 className='font-semibold text-green-800 mb-4'>📝 Step-by-Step Solution:</h3>
                                <ol className='space-y-2'>
                                    {problem.step_by_step.map((step, index) => (
                                        <li key={index} className='text-green-700'>
                                            <span className='font-medium'>Step {index + 1}:</span> {cleanStepText(step)}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <form onSubmit={submitAnswer} className='space-y-4'>
                            <div>
                                <label htmlFor="answer" className='block text-sm font-semibold text-gray-700 mb-2'>Your Answer:</label>
                                <input
                                    type="number"
                                    id="answer"
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    placeholder="Enter your answer here"
                                    required
                                    className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg'
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={!userAnswer || isLoading}
                                className='w-full px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold rounded-xl shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                            >
                                {isLoading ? (
                                    <div className='flex items-center justify-center'>
                                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                                        Checking Answer...
                                    </div>
                                ) : (
                                    <div className='flex items-center justify-center'>
                                        <span className='mr-2'>✅</span>
                                        Submit Answer
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {error && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
                        <div className='flex items-center mb-4'>
                            <div className='text-red-600 mr-3'>⚠️</div>
                            <h2 className='text-xl font-semibold text-red-800'>Error</h2>
                        </div>
                        <p className='text-red-700 mb-4'>{error}</p>
                        <button 
                            onClick={() => setError('')}
                            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {feedback && (
                    <div className='bg-white rounded-lg shadow-md p-6'>
                        <div className='text-center'>
                            <div className='text-4xl mb-4'>{isCorrect ? '🎉' : '💪'}</div>
                            <h2 className='text-2xl font-bold text-gray-800 mb-4'>{isCorrect ? 'Excellent Work!' : 'Keep Trying!'}</h2>
                            <p className='text-gray-700 mb-6'>{feedback}</p>

                            {isCorrect && (
                                <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
                                    <p className='text-green-800 font-semibold'>🏆 Great job! You're mastering this concept!</p>
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
                                className='px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            >
                                Try Another Problem
                            </button>
                        </div>
                    </div>
                )}

                {/* Problem History Modal */}
                {showHistory && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
                        <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
                            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                                <h2 className='text-2xl font-bold text-gray-800'>Problem History</h2>
                                <button 
                                    onClick={() => setShowHistory(false)}
                                    className='text-gray-500 hover:text-gray-700 text-2xl font-bold'
                                >
                                    ×
                                </button>
                            </div>

                            <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
                                {problemHistory.length > 0 ? (
                                    <div className='space-y-6'>
                                        {problemHistory.map((session, index) => (
                                            <div key={session.id} className='bg-gray-50 rounded-lg p-4'>
                                                <div className='flex items-center justify-between mb-3'>
                                                    <h3 className='text-lg font-semibold text-gray-800'>Problem #{index + 1}</h3>
                                                    <div className='text-sm text-gray-600'>
                                                        {new Date(session.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className='mb-4 text-gray-700'>{renderProblemText(session.problem_text)}</div>
                                                <div className='flex items-center justify-between text-sm'>
                                                    <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded'>Score: {session.score}%</span>
                                                    <span className='bg-green-100 text-green-800 px-2 py-1 rounded'>
                                                        {session.correct_attempts}/{session.total_attempts} Correct
                                                    </span>
                                                    {session.curriculum_topic_name && (
                                                        <span className='bg-purple-100 text-purple-800 px-2 py-1 rounded'>{session.curriculum_topic_name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='text-center py-12'>
                                        <div className='text-6xl mb-4'>📚</div>
                                        <p className='text-xl text-gray-600 mb-2'>No problems solved yet!</p>
                                        <p className='text-gray-500'>Start solving problems to see your history here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
