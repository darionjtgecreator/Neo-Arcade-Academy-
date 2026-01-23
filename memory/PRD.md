# Neo-Arcade Academy - Product Requirements Document

## Original Problem Statement
Build an app that would teach 5th graders (12 years old) math from 1st grade all the way through 12th grade.

## User Choices
1. **Features**: Interactive lessons with explanations, practice problems with instant feedback, progress tracking and achievement badges
2. **Problem Generation**: AI-generated adaptive problems using GPT-5.2
3. **Visual Style**: Gamified (game-like with rewards and levels)
4. **Priority Topics**: Geometry, word problems, trigonometry, calculus
5. **Authentication**: Username/password for saving progress

## User Personas

### Primary: 5th Grade Student (12 years old)
- Looking for fun, engaging way to learn math
- Motivated by games, rewards, and achievements
- Wants to learn at own pace
- May need to review earlier grades or explore advanced topics

### Secondary: Parent/Guardian
- Wants to track child's progress
- Concerned about educational quality
- Values gamified learning to keep child engaged

## Architecture

### Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent Integrations

### Key Components
- Authentication system (JWT-based)
- AI Problem Generator (GPT-5.2)
- Progress Tracking System
- Achievement/Badge System
- XP & Level System
- Leaderboard

## Core Requirements (Static)

### Must Have (P0)
- [x] User registration and login
- [x] Grade selection (1-12)
- [x] Topic selection per grade
- [x] AI-generated math problems
- [x] Answer submission with feedback
- [x] XP earning and level system
- [x] Progress tracking
- [x] Achievement badges

### Should Have (P1)
- [x] Leaderboard
- [x] Streak tracking
- [x] Step-by-step explanations
- [x] Difficulty selection (easy/medium/hard)
- [ ] Interactive lessons
- [ ] Practice history

### Nice to Have (P2)
- [ ] Dark/Light mode toggle
- [ ] Sound effects and music
- [ ] Avatar customization
- [ ] Parent dashboard
- [ ] Multiplayer challenges

## What's Been Implemented

### January 2025 - MVP Launch
- Full authentication system (register, login, JWT tokens)
- 12 grade levels with 20+ math topics
- AI problem generation using GPT-5.2
- Gamified XP and level system
- 12 achievement badges
- Leaderboard with rankings
- User profile and settings
- Neo-Arcade themed UI (dark mode, neon colors)
- Responsive design for all devices

### API Endpoints
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user
- `/api/grades` - Get all grades
- `/api/topics/{grade}` - Get topics for grade
- `/api/problems/generate` - Generate AI problem
- `/api/problems/answer` - Submit answer
- `/api/progress` - Get user progress
- `/api/badges` - Get all badges
- `/api/leaderboard` - Get top players

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- Interactive lessons/tutorials per topic

### P1 - High Priority
- Practice history view
- Hint system for difficult problems
- More badge types

### P2 - Medium Priority
- Dark/Light mode toggle
- Social features (challenges)
- Parent dashboard

## Next Tasks
1. Add interactive lessons for each topic
2. Implement practice history tracking
3. Add hint system for problems
4. Create more diverse badges
5. Add sound effects for achievements
