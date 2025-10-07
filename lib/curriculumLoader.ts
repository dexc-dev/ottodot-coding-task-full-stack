import fs from 'fs';
import path from 'path';

export interface CurriculumTopic {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    problemType: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
}

export class CurriculumLoader {
    private static curriculumPath = path.join(process.cwd(), 'curriculum', 'primary-5-math.md');
    private static topicsCache: CurriculumTopic[] | null = null;

    /**
     * Load all curriculum topics from the README file
     */
    static loadCurriculumTopics(): CurriculumTopic[] {
        if (this.topicsCache) {
            return this.topicsCache;
        }

        try {
            const content = fs.readFileSync(this.curriculumPath, 'utf-8');
            const topics = this.parseCurriculumContent(content);
            this.topicsCache = topics;
            return topics;
        } catch (error) {
            console.error('Error loading curriculum:', error);
            return [];
        }
    }

    /**
     * Get a specific topic by ID
     */
    static getTopic(topicId: string): CurriculumTopic | null {
        const topics = this.loadCurriculumTopics();
        return topics.find(topic => topic.id === topicId) || null;
    }

    /**
     * Get topics by category
     */
    static getTopicsByCategory(category: string): CurriculumTopic[] {
        const topics = this.loadCurriculumTopics();
        return topics.filter(topic => topic.category === category);
    }

    /**
     * Parse the curriculum content and extract topics
     */
    private static parseCurriculumContent(content: string): CurriculumTopic[] {
        const topics: CurriculumTopic[] = [];
        const lines = content.split('\n');

        let currentCategory = '';
        let currentSubcategory = '';
        let topicCounter = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Main categories (NUMBER AND ALGEBRA, MEASUREMENT AND GEOMETRY, etc.)
            if (trimmedLine.startsWith('## ')) {
                currentCategory = trimmedLine.replace('## ', '');
                currentSubcategory = '';
            }
            // Sub-strands (WHOLE NUMBERS, FRACTIONS, etc.)
            else if (trimmedLine.startsWith('### SUB-STRAND:')) {
                currentSubcategory = trimmedLine.replace('### SUB-STRAND: ', '');
            }
            // Topics (1. Numbers up to 10 million, etc.)
            else if (trimmedLine.match(/^\d+\./)) {
                const topicName = trimmedLine.replace(/^\d+\.\s*/, '');
                if (topicName && currentCategory && currentSubcategory) {
                    topics.push({
                        id: `topic-${++topicCounter}`,
                        name: topicName,
                        description: this.generateDescription(topicName, currentSubcategory),
                        category: currentCategory,
                        subcategory: currentSubcategory,
                        difficulty: this.determineDifficulty(topicName, currentSubcategory),
                        problemType: this.determineProblemType(topicName, currentSubcategory),
                    });
                }
            }
            // Sub-topics (1.1 reading and writing numbers, etc.)
            else if (trimmedLine.match(/^\d+\.\d+/)) {
                const topicName = trimmedLine.replace(/^\d+\.\d+\s*/, '');
                if (topicName && currentCategory && currentSubcategory) {
                    topics.push({
                        id: `subtopic-${++topicCounter}`,
                        name: topicName,
                        description: this.generateDescription(topicName, currentSubcategory),
                        category: currentCategory,
                        subcategory: currentSubcategory,
                        difficulty: this.determineDifficulty(topicName, currentSubcategory),
                        problemType: this.determineProblemType(topicName, currentSubcategory),
                    });
                }
            }
        }

        return topics;
    }

    /**
     * Generate a description for a topic
     */
    private static generateDescription(topicName: string, subcategory: string): string {
        return `${subcategory}: ${topicName}`;
    }

    /**
     * Determine difficulty level based on topic content
     */
    private static determineDifficulty(
        topicName: string,
        subcategory: string
    ): 'Easy' | 'Medium' | 'Hard' {
        const easyKeywords = ['reading', 'writing', 'basic', 'simple', 'counting', 'comparing'];
        const hardKeywords = [
            'percentage',
            'rate',
            'volume',
            'angles',
            'triangle',
            'parallelogram',
            'trapezium',
            'composite',
        ];

        const topicLower = topicName.toLowerCase();
        const subcategoryLower = subcategory.toLowerCase();

        if (
            easyKeywords.some(
                keyword => topicLower.includes(keyword) || subcategoryLower.includes(keyword)
            )
        ) {
            return 'Easy';
        }

        if (
            hardKeywords.some(
                keyword => topicLower.includes(keyword) || subcategoryLower.includes(keyword)
            )
        ) {
            return 'Hard';
        }

        return 'Medium';
    }

    /**
     * Determine problem type based on topic content
     */
    private static determineProblemType(
        topicName: string,
        subcategory: string
    ): 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed' {
        const topicLower = topicName.toLowerCase();
        const subcategoryLower = subcategory.toLowerCase();

        if (topicLower.includes('adding') || topicLower.includes('addition')) {
            return 'addition';
        }

        if (topicLower.includes('subtracting') || topicLower.includes('subtraction')) {
            return 'subtraction';
        }

        if (topicLower.includes('multiplying') || topicLower.includes('multiplication')) {
            return 'multiplication';
        }

        if (topicLower.includes('dividing') || topicLower.includes('division')) {
            return 'division';
        }

        if (subcategoryLower.includes('four operations') || topicLower.includes('operations')) {
            return 'mixed';
        }

        return 'mixed';
    }

    /**
     * Clear the cache (useful for development)
     */
    static clearCache(): void {
        this.topicsCache = null;
    }
}
