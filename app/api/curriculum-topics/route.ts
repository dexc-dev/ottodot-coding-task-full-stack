import { NextRequest, NextResponse } from 'next/server'
import { CurriculumLoader } from '../../../lib/curriculumLoader'

export async function GET(request: NextRequest) {
  try {
    const topics = CurriculumLoader.loadCurriculumTopics()
    
    return NextResponse.json({
      success: true,
      topics: topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        category: topic.category,
        subcategory: topic.subcategory,
        difficulty: topic.difficulty,
        problemType: topic.problemType
      }))
    })

  } catch (error) {
    console.error('Error loading curriculum topics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load curriculum topics' 
      },
      { status: 500 }
    )
  }
}
