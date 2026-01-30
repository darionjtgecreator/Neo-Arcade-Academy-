from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'neo-arcade-academy-secret')
JWT_ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    xp: int = 0
    level: int = 1
    current_grade: int = 5
    badges: List[str] = []
    completed_problems: int = 0
    correct_answers: int = 0
    streak: int = 0
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ProblemRequest(BaseModel):
    grade: int
    topic: str
    difficulty: str = "medium"

class ProblemResponse(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    hint: str
    grade: int
    topic: str
    difficulty: str
    xp_reward: int

class PracticeHistoryEntry(BaseModel):
    id: str
    question: str
    topic: str
    grade: int
    difficulty: str
    correct: bool
    user_answer: str
    correct_answer: str
    xp_earned: int
    answered_at: str

class LessonContent(BaseModel):
    topic_id: str
    topic_name: str
    grade: int
    overview: str
    key_concepts: List[dict]
    examples: List[dict]
    tips: List[str]

class AnswerSubmit(BaseModel):
    problem_id: str
    selected_answer: str

class AnswerResult(BaseModel):
    correct: bool
    correct_answer: str
    explanation: str
    xp_earned: int
    new_total_xp: int
    new_level: int
    level_up: bool
    new_badges: List[str]

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    xp: int
    level: int
    badges_count: int

class ProgressStats(BaseModel):
    total_problems: int
    correct_answers: int
    accuracy: float
    xp: int
    level: int
    streak: int
    badges: List[str]
    grade_progress: dict
    topic_progress: dict

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_level(xp: int) -> int:
    """Calculate level from XP (100 XP per level, increasing)"""
    level = 1
    xp_needed = 100
    total_xp_needed = 0
    while xp >= total_xp_needed + xp_needed:
        total_xp_needed += xp_needed
        level += 1
        xp_needed = int(xp_needed * 1.2)
    return level

def get_xp_reward(difficulty: str, grade: int) -> int:
    """Calculate XP reward based on difficulty and grade"""
    base_xp = {"easy": 10, "medium": 20, "hard": 30}.get(difficulty, 20)
    grade_bonus = grade * 2
    return base_xp + grade_bonus

BADGE_DEFINITIONS = {
    "first_step": {"name": "First Step", "description": "Complete your first problem", "icon": "footprints"},
    "streak_3": {"name": "On Fire!", "description": "Get 3 correct answers in a row", "icon": "flame"},
    "streak_5": {"name": "Unstoppable!", "description": "Get 5 correct answers in a row", "icon": "zap"},
    "streak_10": {"name": "Math Master!", "description": "Get 10 correct answers in a row", "icon": "crown"},
    "level_5": {"name": "Rising Star", "description": "Reach level 5", "icon": "star"},
    "level_10": {"name": "Math Wizard", "description": "Reach level 10", "icon": "wand"},
    "problems_10": {"name": "Getting Started", "description": "Complete 10 problems", "icon": "target"},
    "problems_50": {"name": "Problem Solver", "description": "Complete 50 problems", "icon": "brain"},
    "problems_100": {"name": "Math Champion", "description": "Complete 100 problems", "icon": "trophy"},
    "accuracy_80": {"name": "Sharp Mind", "description": "Achieve 80% accuracy", "icon": "check-circle"},
    "geometry_master": {"name": "Geometry Pro", "description": "Complete 20 geometry problems", "icon": "triangle"},
    "calculus_master": {"name": "Calculus Pro", "description": "Complete 20 calculus problems", "icon": "infinity"},
}

async def check_and_award_badges(user: dict) -> List[str]:
    """Check if user earned any new badges"""
    new_badges = []
    current_badges = set(user.get("badges", []))
    
    # First problem
    if user.get("completed_problems", 0) >= 1 and "first_step" not in current_badges:
        new_badges.append("first_step")
    
    # Streak badges
    streak = user.get("streak", 0)
    if streak >= 3 and "streak_3" not in current_badges:
        new_badges.append("streak_3")
    if streak >= 5 and "streak_5" not in current_badges:
        new_badges.append("streak_5")
    if streak >= 10 and "streak_10" not in current_badges:
        new_badges.append("streak_10")
    
    # Level badges
    level = user.get("level", 1)
    if level >= 5 and "level_5" not in current_badges:
        new_badges.append("level_5")
    if level >= 10 and "level_10" not in current_badges:
        new_badges.append("level_10")
    
    # Problem count badges
    problems = user.get("completed_problems", 0)
    if problems >= 10 and "problems_10" not in current_badges:
        new_badges.append("problems_10")
    if problems >= 50 and "problems_50" not in current_badges:
        new_badges.append("problems_50")
    if problems >= 100 and "problems_100" not in current_badges:
        new_badges.append("problems_100")
    
    # Accuracy badge
    if problems >= 10:
        accuracy = (user.get("correct_answers", 0) / problems) * 100
        if accuracy >= 80 and "accuracy_80" not in current_badges:
            new_badges.append("accuracy_80")
    
    # Topic badges
    topic_progress = user.get("topic_progress", {})
    if topic_progress.get("geometry", {}).get("completed", 0) >= 20 and "geometry_master" not in current_badges:
        new_badges.append("geometry_master")
    if topic_progress.get("calculus", {}).get("completed", 0) >= 20 and "calculus_master" not in current_badges:
        new_badges.append("calculus_master")
    
    return new_badges

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "xp": 0,
        "level": 1,
        "current_grade": 5,
        "badges": [],
        "completed_problems": 0,
        "correct_answers": 0,
        "streak": 0,
        "grade_progress": {},
        "topic_progress": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(token=token, user=UserResponse(**user_response))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(token=token, user=UserResponse(**user_response))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in current_user.items() if k != "password"})

# ============== PROBLEM GENERATION ==============

TOPICS_BY_GRADE = {
    1: ["counting", "addition", "subtraction"],
    2: ["addition", "subtraction", "basic_multiplication"],
    3: ["multiplication", "division", "fractions_intro"],
    4: ["fractions", "decimals", "geometry_basics"],
    5: ["fractions", "decimals", "geometry", "word_problems"],
    6: ["ratios", "percentages", "geometry", "word_problems"],
    7: ["algebra_intro", "geometry", "statistics", "word_problems"],
    8: ["algebra", "geometry", "linear_equations", "word_problems"],
    9: ["algebra", "geometry", "quadratics", "word_problems"],
    10: ["algebra", "geometry", "trigonometry", "word_problems"],
    11: ["algebra", "trigonometry", "pre_calculus", "word_problems"],
    12: ["trigonometry", "calculus", "statistics", "word_problems"]
}

TOPIC_DISPLAY_NAMES = {
    "counting": "Counting",
    "addition": "Addition",
    "subtraction": "Subtraction",
    "basic_multiplication": "Basic Multiplication",
    "multiplication": "Multiplication",
    "division": "Division",
    "fractions_intro": "Intro to Fractions",
    "fractions": "Fractions",
    "decimals": "Decimals",
    "geometry_basics": "Basic Geometry",
    "geometry": "Geometry",
    "ratios": "Ratios",
    "percentages": "Percentages",
    "algebra_intro": "Intro to Algebra",
    "algebra": "Algebra",
    "statistics": "Statistics",
    "linear_equations": "Linear Equations",
    "quadratics": "Quadratic Equations",
    "trigonometry": "Trigonometry",
    "pre_calculus": "Pre-Calculus",
    "calculus": "Calculus",
    "word_problems": "Word Problems"
}

@api_router.get("/grades")
async def get_grades():
    """Get all available grades with their topics"""
    grades = []
    for grade in range(1, 13):
        topics = TOPICS_BY_GRADE.get(grade, [])
        grades.append({
            "grade": grade,
            "name": f"Grade {grade}",
            "topics": [{"id": t, "name": TOPIC_DISPLAY_NAMES.get(t, t)} for t in topics]
        })
    return grades

@api_router.get("/topics/{grade}")
async def get_topics_for_grade(grade: int):
    """Get topics available for a specific grade"""
    if grade < 1 or grade > 12:
        raise HTTPException(status_code=400, detail="Grade must be between 1 and 12")
    
    topics = TOPICS_BY_GRADE.get(grade, [])
    return [{"id": t, "name": TOPIC_DISPLAY_NAMES.get(t, t)} for t in topics]

@api_router.post("/problems/generate", response_model=ProblemResponse)
async def generate_problem(request: ProblemRequest, current_user: dict = Depends(get_current_user)):
    """Generate a new math problem using AI"""
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    topic_name = TOPIC_DISPLAY_NAMES.get(request.topic, request.topic)
    
    prompt = f"""Generate a {request.difficulty} difficulty math problem for a Grade {request.grade} student on the topic of {topic_name}.

The problem should be appropriate for a 12-year-old learning this topic.

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{{
    "question": "The math question text here",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A) option1",
    "explanation": "Step-by-step explanation of how to solve the problem",
    "hint": "A helpful hint that guides the student without giving away the answer"
}}

Make sure:
1. The question is clear and age-appropriate
2. All 4 options are plausible (no obviously wrong answers)
3. The explanation is detailed and educational
4. The hint should help the student think about the approach without revealing the answer
5. Use proper math notation where needed"""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"problem-{uuid.uuid4()}",
            system_message="You are a friendly math teacher creating problems for students. Always respond with valid JSON only, no markdown."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse the response
        import json
        # Clean up response if it has markdown code blocks
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        problem_data = json.loads(response_text)
        
        problem_id = str(uuid.uuid4())
        xp_reward = get_xp_reward(request.difficulty, request.grade)
        
        # Store the problem for later validation
        await db.problems.insert_one({
            "id": problem_id,
            "user_id": current_user["id"],
            "question": problem_data["question"],
            "options": problem_data["options"],
            "correct_answer": problem_data["correct_answer"],
            "explanation": problem_data["explanation"],
            "grade": request.grade,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "xp_reward": xp_reward,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "answered": False
        })
        
        return ProblemResponse(
            id=problem_id,
            question=problem_data["question"],
            options=problem_data["options"],
            correct_answer=problem_data["correct_answer"],
            explanation=problem_data["explanation"],
            grade=request.grade,
            topic=request.topic,
            difficulty=request.difficulty,
            xp_reward=xp_reward
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate problem")
    except Exception as e:
        logger.error(f"Error generating problem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/problems/answer", response_model=AnswerResult)
async def submit_answer(answer: AnswerSubmit, current_user: dict = Depends(get_current_user)):
    """Submit an answer and get results"""
    
    # Find the problem
    problem = await db.problems.find_one({"id": answer.problem_id, "user_id": current_user["id"]}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    if problem.get("answered"):
        raise HTTPException(status_code=400, detail="Problem already answered")
    
    # Check answer
    is_correct = answer.selected_answer == problem["correct_answer"]
    xp_earned = problem["xp_reward"] if is_correct else 0
    
    # Update problem as answered
    await db.problems.update_one(
        {"id": answer.problem_id},
        {"$set": {"answered": True, "user_answer": answer.selected_answer, "correct": is_correct}}
    )
    
    # Update user stats
    new_streak = (current_user.get("streak", 0) + 1) if is_correct else 0
    new_xp = current_user.get("xp", 0) + xp_earned
    new_level = calculate_level(new_xp)
    level_up = new_level > current_user.get("level", 1)
    
    # Update topic progress
    topic_progress = current_user.get("topic_progress", {})
    topic = problem["topic"]
    if topic not in topic_progress:
        topic_progress[topic] = {"completed": 0, "correct": 0}
    topic_progress[topic]["completed"] += 1
    if is_correct:
        topic_progress[topic]["correct"] += 1
    
    # Update grade progress
    grade_progress = current_user.get("grade_progress", {})
    grade_key = str(problem["grade"])
    if grade_key not in grade_progress:
        grade_progress[grade_key] = {"completed": 0, "correct": 0}
    grade_progress[grade_key]["completed"] += 1
    if is_correct:
        grade_progress[grade_key]["correct"] += 1
    
    update_data = {
        "xp": new_xp,
        "level": new_level,
        "streak": new_streak,
        "completed_problems": current_user.get("completed_problems", 0) + 1,
        "correct_answers": current_user.get("correct_answers", 0) + (1 if is_correct else 0),
        "topic_progress": topic_progress,
        "grade_progress": grade_progress
    }
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    # Check for new badges
    updated_user = {**current_user, **update_data}
    new_badges = await check_and_award_badges(updated_user)
    
    if new_badges:
        current_badges = current_user.get("badges", [])
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"badges": current_badges + new_badges}}
        )
    
    return AnswerResult(
        correct=is_correct,
        correct_answer=problem["correct_answer"],
        explanation=problem["explanation"],
        xp_earned=xp_earned,
        new_total_xp=new_xp,
        new_level=new_level,
        level_up=level_up,
        new_badges=new_badges
    )

# ============== PROGRESS & STATS ==============

@api_router.get("/progress", response_model=ProgressStats)
async def get_progress(current_user: dict = Depends(get_current_user)):
    """Get user's progress statistics"""
    total = current_user.get("completed_problems", 0)
    correct = current_user.get("correct_answers", 0)
    
    return ProgressStats(
        total_problems=total,
        correct_answers=correct,
        accuracy=round((correct / total * 100) if total > 0 else 0, 1),
        xp=current_user.get("xp", 0),
        level=current_user.get("level", 1),
        streak=current_user.get("streak", 0),
        badges=current_user.get("badges", []),
        grade_progress=current_user.get("grade_progress", {}),
        topic_progress=current_user.get("topic_progress", {})
    )

@api_router.get("/badges")
async def get_all_badges(current_user: dict = Depends(get_current_user)):
    """Get all badge definitions with user's earned status"""
    user_badges = set(current_user.get("badges", []))
    badges = []
    for badge_id, badge_info in BADGE_DEFINITIONS.items():
        badges.append({
            "id": badge_id,
            "name": badge_info["name"],
            "description": badge_info["description"],
            "icon": badge_info["icon"],
            "earned": badge_id in user_badges
        })
    return badges

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    """Get top 10 users by XP"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("xp", -1).limit(10).to_list(10)
    
    leaderboard = []
    for i, user in enumerate(users):
        leaderboard.append(LeaderboardEntry(
            rank=i + 1,
            username=user.get("username", "Anonymous"),
            xp=user.get("xp", 0),
            level=user.get("level", 1),
            badges_count=len(user.get("badges", []))
        ))
    
    return leaderboard

@api_router.put("/user/grade")
async def update_current_grade(grade: int, current_user: dict = Depends(get_current_user)):
    """Update user's current grade level"""
    if grade < 1 or grade > 12:
        raise HTTPException(status_code=400, detail="Grade must be between 1 and 12")
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"current_grade": grade}})
    return {"success": True, "current_grade": grade}

# ============== BASE ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Neo-Arcade Academy API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
