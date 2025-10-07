import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { CurriculumLoader } from '../../../lib/curriculumLoader';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
    try {
        const { curriculumTopicId } = await request.json();

        // Generate math problem using Gemini AI
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const BASE_PROMPT = `Generate a Primary 5 level math word problem. The problem should be appropriate for 10-11 year old students and involve basic arithmetic operations (addition, subtraction, multiplication, or division).`;
        let curriculumTopic = null;
        let prompt = BASE_PROMPT;

        // Load curriculum topic if provided
        if (curriculumTopicId && curriculumTopicId.trim().length > 0) {
            curriculumTopic = CurriculumLoader.getTopic(curriculumTopicId);

            if (curriculumTopic) {
                // Optimized prompt for topic-specific problems
                const isDataTopic =
                    curriculumTopic.subcategory.toLowerCase().includes('data representation') ||
                    curriculumTopic.name.toLowerCase().includes('table') ||
                    curriculumTopic.name.toLowerCase().includes('graph');

                if (isDataTopic) {
                    prompt += `\n\nCreate a Primary 5 data interpretation problem:\nTopic: ${curriculumTopic.name}\nFocus: Reading/interpreting tables or graphs\nDifficulty: ${curriculumTopic.difficulty}`;
                } else {
                    prompt += `\n\nCreate a Primary 5 math problem:\nTopic: ${curriculumTopic.name}\nCategory: ${curriculumTopic.category}\nDifficulty: ${curriculumTopic.difficulty}`;
                }
            }
        }

        prompt += `\nIMPORTANT: You must respond with ONLY a valid JSON object. No additional text, explanations, or formatting.

Required JSON format:
{
  "problem_text": "The word problem text here (can include markdown tables for data problems)",
  "final_answer": [numeric answer as a number, not a string],
  "answer_type": "numeric" or "table" or "graph",
  "hint": "A helpful hint for students who are stuck",
  "step_by_step": [
    "Step 1: Identify what is given in the problem",
    "Step 2: Identify what you need to find", 
    "Step 3: Choose the correct operation",
    "Step 4: Perform the calculation",
    "Step 5: Check your answer"
  ]
}

For data interpretation problems, you may include markdown tables in problem_text:
| Item | Quantity | Price |
|------|----------|-------|
| Apple | 5 | $2.00 |
| Orange | 3 | $1.50 |

Example for regular math:
{
  "problem_text": "Sarah has 24 stickers. She gives 8 stickers to her friend and buys 12 more stickers. How many stickers does Sarah have now?",
  "final_answer": 28,
  "answer_type": "numeric",
  "hint": "First subtract the stickers she gave away, then add the new stickers she bought.",
  "step_by_step": [
    "Step 1: Sarah starts with 24 stickers",
    "Step 2: She gives away 8 stickers: 24 - 8 = 16", 
    "Step 3: She buys 12 more stickers: 16 + 12 = 28",
    "Step 4: Sarah has 28 stickers now"
  ]
}

CRITICAL REQUIREMENTS:
- final_answer MUST be a number (not a string, not quoted)
- answer_type MUST be "numeric", "table", or "graph"
- For data problems, include markdown tables in problem_text
- Do not include any text before or after the JSON
- Do not include any code-fence markers or other markdown formatting
- Ensure all numeric values are actual numbers, not strings
- Respond with ONLY the JSON object, nothing else`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Debug: Log the raw AI response
        console.log('Raw AI response:', text);

        // Parse the AI response with improved robustness
        let problemData;
        try {
            // Clean the response text
            let cleanedText = text.trim();

            // Remove markdown code blocks if present
            cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

            // Try to find JSON object - use first '{' and last '}' bounds
            const startIdx = cleanedText.indexOf('{');
            const endIdx = cleanedText.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
                throw new Error('No JSON object found in AI response');
            }
            const jsonString = cleanedText.slice(startIdx, endIdx + 1);
            problemData = JSON.parse(jsonString);
            console.log('Parsed problem data:', problemData);

            // Post-process final_answer to ensure it's a number
            if (typeof problemData.final_answer === 'string') {
                const numericValue = parseFloat(problemData.final_answer);
                if (!isNaN(numericValue)) {
                    problemData.final_answer = numericValue;
                    console.log('Converted final_answer from string to number:', numericValue);
                } else {
                    throw new Error(`Invalid final_answer format: "${problemData.final_answer}"`);
                }
            }

            // Ensure step_by_step is an array of strings if provided
            if (Array.isArray(problemData.step_by_step)) {
                problemData.step_by_step = problemData.step_by_step
                    .map((s: any) => (typeof s === 'string' ? s : String(s)))
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0);
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Raw text that failed to parse:', text);
            throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }

        // Validate the response structure with more detailed error info
        if (!problemData.problem_text) {
            console.error('Missing problem_text in response:', problemData);
            throw new Error('Invalid AI response structure: missing problem_text');
        }

        if (typeof problemData.final_answer !== 'number' || isNaN(problemData.final_answer)) {
            console.error('Invalid final_answer in response:', problemData);
            throw new Error(`Invalid AI response structure: final_answer must be a valid number, got: ${typeof problemData.final_answer} "${problemData.final_answer}"`);
        }

        // Validate answer_type (default to "numeric" if not provided for backward compatibility)
        if (!problemData.answer_type) {
            problemData.answer_type = 'numeric';
        }
        if (!['numeric', 'table', 'graph'].includes(problemData.answer_type)) {
            console.error('Invalid answer_type in response:', problemData);
            throw new Error(`Invalid AI response structure: answer_type must be "numeric", "table", or "graph", got: "${problemData.answer_type}"`);
        }

        if (!problemData.hint) {
            console.error('Missing hint in response:', problemData);
            throw new Error('Invalid AI response structure: missing hint');
        }

        if (!Array.isArray(problemData.step_by_step) || problemData.step_by_step.length === 0) {
            console.error('Invalid step_by_step in response:', problemData);
            throw new Error('Invalid AI response structure: step_by_step must be a non-empty array');
        }

        // Save to database (using original schema)
        const { data: sessionData, error: sessionError } = await supabase
            .from('math_problem_sessions')
            .insert({
                problem_text: problemData.problem_text,
                correct_answer: problemData.final_answer,
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Database error:', sessionError);
            throw new Error('Failed to save problem to database');
        }

        return NextResponse.json({
            success: true,
            problem: {
                problem_text: problemData.problem_text,
                final_answer: problemData.final_answer,
                answer_type: problemData.answer_type,
                hint: problemData.hint,
                step_by_step: problemData.step_by_step,
            },
            session_id: sessionData.id,
            curriculum_topic: curriculumTopic
                ? {
                      name: curriculumTopic.name,
                      difficulty: curriculumTopic.difficulty,
                      problem_type: curriculumTopic.problemType,
                  }
                : null,
        });
    } catch (error) {
        console.error('Error generating problem:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate problem',
                details: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
