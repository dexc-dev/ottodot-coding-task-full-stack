import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabaseClient'
import { CurriculumLoader } from '../../../lib/curriculumLoader'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { curriculumTopicId } = await request.json()
    
    // Generate math problem using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    let prompt = `Generate a Primary 5 level math word problem. The problem should be appropriate for 10-11 year old students and involve basic arithmetic operations (addition, subtraction, multiplication, or division).`
    let curriculumTopic = null
    let curriculumTopicIdUsed = null

    // Load curriculum topic if provided
    if (curriculumTopicId && curriculumTopicId.trim().length > 0) {
      curriculumTopic = CurriculumLoader.getTopic(curriculumTopicId)
      
      if (curriculumTopic) {
        prompt += `\n\nCreate a math word problem specifically related to this Primary 5 curriculum topic:\n\nTopic: ${curriculumTopic.name}\nCategory: ${curriculumTopic.category}\nSubcategory: ${curriculumTopic.subcategory}\nDescription: ${curriculumTopic.description}\nDifficulty: ${curriculumTopic.difficulty}\nProblem Type: ${curriculumTopic.problemType}\n\nMake the problem directly relevant to this specific mathematical concept and appropriate for Primary 5 students. The difficulty should match the ${curriculumTopic.difficulty} level.`
        curriculumTopicIdUsed = curriculumTopicId
      }
    }

    prompt += `\nIMPORTANT: You must respond with ONLY a valid JSON object. No additional text, explanations, or formatting.

Required JSON format:
{
  "problem_text": "The word problem text here",
  "final_answer": [numeric answer as a number, not a string],
  "hint": "A helpful hint for students who are stuck",
  "step_by_step": [
    "Step 1: Identify what is given in the problem",
    "Step 2: Identify what you need to find",
    "Step 3: Choose the correct operation",
    "Step 4: Perform the calculation",
    "Step 5: Check your answer"
  ]
}

Example:
{
  "problem_text": "Sarah has 24 stickers. She gives 8 stickers to her friend and buys 12 more stickers. How many stickers does Sarah have now?",
  "final_answer": 28,
  "hint": "First subtract the stickers she gave away, then add the new stickers she bought.",
  "step_by_step": [
    "Step 1: Sarah starts with 24 stickers",
    "Step 2: She gives away 8 stickers: 24 - 8 = 16",
    "Step 3: She buys 12 more stickers: 16 + 12 = 28",
    "Step 4: Sarah has 28 stickers now"
  ]
}

Make sure:
- problem_text is a string with the math word problem
- final_answer is a number (not a string)
- hint is a helpful hint for struggling students
- step_by_step is an array of clear solution steps
- The problem is engaging and age-appropriate for Primary 5 students
- If curriculum topic was provided, make the problem relate to that content
- Respond with ONLY the JSON object, nothing else`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Debug: Log the raw AI response
    console.log('Raw AI response:', text)
    
    // Parse the AI response
    let problemData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[0])
        console.log('Parsed problem data:', problemData)
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw text that failed to parse:', text)
      throw new Error('Failed to parse AI response')
    }

    // Validate the response structure with more detailed error info
    if (!problemData.problem_text) {
      console.error('Missing problem_text in response:', problemData)
      throw new Error('Invalid AI response structure: missing problem_text')
    }
    
    if (typeof problemData.final_answer !== 'number') {
      console.error('Invalid final_answer type in response:', problemData)
      throw new Error('Invalid AI response structure: final_answer must be a number')
    }

    if (!problemData.hint) {
      console.error('Missing hint in response:', problemData)
      throw new Error('Invalid AI response structure: missing hint')
    }

    if (!Array.isArray(problemData.step_by_step)) {
      console.error('Invalid step_by_step in response:', problemData)
      throw new Error('Invalid AI response structure: step_by_step must be an array')
    }

    // Save to database (using original schema)
    const { data: sessionData, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Database error:', sessionError)
      throw new Error('Failed to save problem to database')
    }

    return NextResponse.json({
      success: true,
      problem: {
        problem_text: problemData.problem_text,
        final_answer: problemData.final_answer,
        hint: problemData.hint,
        step_by_step: problemData.step_by_step
      },
      session_id: sessionData.id,
      curriculum_topic: curriculumTopic ? {
        name: curriculumTopic.name,
        difficulty: curriculumTopic.difficulty,
        problem_type: curriculumTopic.problemType
      } : null
    })

  } catch (error) {
    console.error('Error generating problem:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate problem',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
