import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabaseClient'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { session_id, user_answer } = await request.json()

    if (!session_id || user_answer === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id or user_answer' },
        { status: 400 }
      )
    }

    // Get the original problem from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { success: false, error: 'Problem session not found' },
        { status: 404 }
      )
    }

    // Check if answer is correct
    const isCorrect = parseFloat(user_answer) === sessionData.correct_answer

    // Generate personalized feedback using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const feedbackPrompt = `You are a helpful math tutor for Primary 5 students (ages 10-11). 

Original Problem: "${sessionData.problem_text}"
Correct Answer: ${sessionData.correct_answer}
Student's Answer: ${user_answer}
Is Correct: ${isCorrect}

Generate personalized, encouraging feedback for this student. The feedback should:
1. Be age-appropriate and encouraging
2. If incorrect, gently guide them toward the right approach without giving away the answer
3. If correct, celebrate their success and maybe offer a brief explanation
4. Be 2-3 sentences long
5. Use a warm, supportive tone

Return only the feedback text, no additional formatting.`

    const result = await model.generateContent(feedbackPrompt)
    const response = await result.response
    const feedbackText = response.text().trim()

    // Save submission to database
    const { data: submissionData, error: submissionError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: session_id,
        user_answer: parseFloat(user_answer),
        is_correct: isCorrect,
        feedback_text: feedbackText
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Database error:', submissionError)
      throw new Error('Failed to save submission to database')
    }

    return NextResponse.json({
      success: true,
      is_correct: isCorrect,
      feedback: feedbackText,
      submission_id: submissionData.id
    })

  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process submission' 
      },
      { status: 500 }
    )
  }
}
