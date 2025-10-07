# Math Problem Generator - Developer Assessment Starter Kit

## Overview

This is a starter kit for building an AI-powered math problem generator application. The goal is to create a standalone prototype that uses AI to generate math word problems suitable for Primary 5 students, saves the problems and user submissions to a database, and provides personalized feedback.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI Integration**: Google Generative AI (Gemini)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd math-problem-generator
```

### 2. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API to find your:
    - Project URL (starts with `https://`)
    - Anon/Public Key

### 3. Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database.sql`
3. Click "Run" to create the tables and policies

### 4. Get Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
    ```bash
    cp .env.local.example .env.local
    ```
2. Edit `.env.local` and add your actual keys:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
    GOOGLE_API_KEY=your_actual_google_api_key
    ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Your Task

### 1. Implement Frontend Logic (`app/page.tsx`)

Complete the TODO sections in the main page component:

- **generateProblem**: Call your API route to generate a new math problem
- **submitAnswer**: Submit the user's answer and get feedback

### 2. Create Backend API Route (`app/api/math-problem/route.ts`)

Create a new API route that handles:

#### POST /api/math-problem (Generate Problem)

- Use Google's Gemini AI to generate a math word problem
- The AI should return JSON with:
    ```json
    {
        "problem_text": "A bakery sold 45 cupcakes...",
        "final_answer": 15
    }
    ```
- Save the problem to `math_problem_sessions` table
- Return the problem and session ID to the frontend

#### POST /api/math-problem/submit (Submit Answer)

- Receive the session ID and user's answer
- Check if the answer is correct
- Use AI to generate personalized feedback based on:
    - The original problem
    - The correct answer
    - The user's answer
    - Whether they got it right or wrong
- Save the submission to `math_problem_submissions` table
- Return the feedback and correctness to the frontend

### 3. Requirements Checklist

- [x] AI generates appropriate Primary 5 level math problems
- [x] Problems and answers are saved to Supabase
- [x] User submissions are saved with feedback
- [x] AI generates helpful, personalized feedback
- [x] UI is clean and mobile-responsive
- [x] Error handling for API failures
- [x] Loading states during API calls

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Assessment Submission

When submitting your assessment, provide:

1. **GitHub Repository URL**: Make sure it's public
2. **Live Demo URL**: Your Vercel deployment
3. **Supabase Credentials**: Add these to your README for testing:
    ```
    SUPABASE_URL: https://gzmdnwlgneywtlxqbkgt.supabase.co
    SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bWRud2xnbmV5d3RseHFia2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDYxMTMsImV4cCI6MjA3NTMyMjExM30.xyVK7k8ZXqfk9_M4wPsH89vKcoyZ-PClj9PuQYq8ILs
    ```

## Implementation Notes
### My Implementation:

**Core Features Completed:**
- [x] Full-stack Next.js application with TypeScript
- [x] Supabase integration for data persistence
- [x] Google Gemini AI integration for problem generation and feedback
- [x] Complete API routes for problem generation and answer submission
- [x] Mobile-responsive UI with Tailwind CSS

**Challenges Overcome:**
- Tailwind CSS configuration and NextJS version compatibility issues
- AI prompt engineering for educational content
- Component reusability and styling consistency

**Other(s)**
- Modified API request/response from the original to cater hints, steps, etc..
- Used the 2021 Primary Mathematics Syllabus P1 to P6_Updated Dec 2023.pdf as contextual hint for multiple topics
- PDF size is too large since it covers other Primary level topics, extracted only those for Primary 5 and stored in MD file (\curriculum\primary-5-math.md)
- The use of react states can be further optimized, but prioritized requirements/checklists

## Additional Features Implemented

Beyond the core requirements, the following features have been implemented:
- [x] Difficulty levels (Easy/Medium/Hard)
- [x] Problem history view
- [x] Score tracking
- [x] Different problem types (addition, subtraction, multiplication, division)
- [x] Hints system
- [x] Step-by-step solution explanations


