import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { CurriculumLoader } from '../../../lib/curriculumLoader';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Optimized: Moved constant outside function for reuse
const BASE_PROMPT = `Generate a Primary 5 math word problem (age 10-11).

Return ONLY valid JSON:
{
  "problem_text": "problem here (use markdown tables for data problems)",
  "final_answer": numeric_value,
  "answer_type": "numeric|table|graph",
  "hint": "hint text",
  "step_by_step": ["Step 1: ...", "Step 2: ...", ...]
}

Rules: final_answer=number only, answer_type must be "numeric"/"table"/"graph", use markdown tables for data.`;

export async function POST(request: NextRequest) {
    try {
        const { curriculumTopicId } = await request.json();

        // Optimized: Configure model with speed settings
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 800, // Allow enough for tables
            }
        });

        let prompt = BASE_PROMPT;
        let curriculumTopic = null;

        // Load curriculum topic if provided (cached)
        if (curriculumTopicId?.trim()) {
            curriculumTopic = CurriculumLoader.getTopic(curriculumTopicId);

            if (curriculumTopic) {
                const isDataTopic =
                    curriculumTopic.subcategory.toLowerCase().includes('data representation') ||
                    curriculumTopic.name.toLowerCase().includes('table') ||
                    curriculumTopic.name.toLowerCase().includes('graph');

                // Optimized: Shorter but complete instructions
                if (isDataTopic) {
                    prompt += `\n\nDATA PROBLEM: ${curriculumTopic.name} (${curriculumTopic.difficulty}). MUST include markdown table with realistic data. Set answer_type to "table".`;
                } else {
                    prompt += `\n\nTopic: ${curriculumTopic.name} | ${curriculumTopic.category} (${curriculumTopic.difficulty})`;
                }
            }
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Optimized: Streamlined parsing
        let problemData;
        try {
            // Fast JSON extraction
            const cleanedText = text.trim()
                .replace(/^```(?:json)?\s*/, '')
                .replace(/\s*```$/, '');

            const startIdx = cleanedText.indexOf('{');
            const endIdx = cleanedText.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
                throw new Error('No JSON found');
            }

            problemData = JSON.parse(cleanedText.slice(startIdx, endIdx + 1));

            // Type coercion
            if (typeof problemData.final_answer === 'string') {
                problemData.final_answer = parseFloat(problemData.final_answer);
            }

            if (!problemData.final_answer || isNaN(problemData.final_answer)) {
                throw new Error('Invalid final_answer');
            }

            // Normalize arrays
            if (Array.isArray(problemData.step_by_step)) {
                problemData.step_by_step = problemData.step_by_step
                    .map((s: any) => String(s).trim())
                    .filter(Boolean);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError, '| Text:', text.substring(0, 150));
            throw new Error(`Parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown'}`);
        }

        // Optimized: Quick validation
        if (!problemData.problem_text || !problemData.hint || !Array.isArray(problemData.step_by_step)) {
            throw new Error('Missing required fields');
        }

        // Set defaults
        problemData.answer_type = ['numeric', 'table', 'graph'].includes(problemData.answer_type) 
            ? problemData.answer_type 
            : 'numeric';

        // Optimized: Save to database
        const { data: sessionData, error: sessionError } = await supabase
            .from('math_problem_sessions')
            .insert({
                problem_text: problemData.problem_text,
                correct_answer: problemData.final_answer,
            })
            .select()
            .single();

        if (sessionError) {
            throw new Error('DB save failed');
        }

        // Optimized: Streamlined response
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
        console.error('Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate problem',
            },
            { status: 500 }
        );
    }
}
