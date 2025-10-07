import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get problem sessions with their submissions
        const { data: sessions, error: sessionsError } = await supabase
            .from('math_problem_sessions')
            .select(
                `
        *,
        math_problem_submissions (
          id,
          user_answer,
          is_correct,
          feedback_text,
          created_at
        )
      `
            )
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (sessionsError) {
            console.error('Database error:', sessionsError);
            throw new Error('Failed to fetch problem history');
        }

        // Calculate scores for each session
        const sessionsWithScores =
            sessions?.map(session => {
                const submissions = session.math_problem_submissions || [];
                const correctCount = submissions.filter((sub: any) => sub.is_correct).length;
                const totalCount = submissions.length;
                const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

                return {
                    ...session,
                    score,
                    correct_attempts: correctCount,
                    total_attempts: totalCount,
                    submissions: submissions.sort(
                        (a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ),
                };
            }) || [];

        return NextResponse.json({
            success: true,
            sessions: sessionsWithScores,
            pagination: {
                limit,
                offset,
                has_more: sessionsWithScores.length === limit,
            },
        });
    } catch (error) {
        console.error('Error fetching problem history:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch problem history',
            },
            { status: 500 }
        );
    }
}
