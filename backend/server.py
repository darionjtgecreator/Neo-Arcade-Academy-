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
            "hint": problem_data.get("hint", "Think about the key concepts for this topic."),
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
            hint=problem_data.get("hint", "Think about the key concepts for this topic."),
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
        {"$set": {
            "answered": True, 
            "user_answer": answer.selected_answer, 
            "correct": is_correct,
            "answered_at": datetime.now(timezone.utc).isoformat()
        }}
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

# ============== PRACTICE HISTORY ==============

@api_router.get("/history", response_model=List[PracticeHistoryEntry])
async def get_practice_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Get user's practice history"""
    problems = await db.problems.find(
        {"user_id": current_user["id"], "answered": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    history = []
    for p in problems:
        history.append(PracticeHistoryEntry(
            id=p["id"],
            question=p["question"],
            topic=p["topic"],
            grade=p["grade"],
            difficulty=p["difficulty"],
            correct=p.get("correct", False),
            user_answer=p.get("user_answer", ""),
            correct_answer=p["correct_answer"],
            xp_earned=p["xp_reward"] if p.get("correct", False) else 0,
            answered_at=p.get("answered_at", p["created_at"])
        ))
    
    return history

@api_router.get("/history/stats")
async def get_history_stats(current_user: dict = Depends(get_current_user)):
    """Get practice history statistics"""
    all_problems = await db.problems.find(
        {"user_id": current_user["id"], "answered": True},
        {"_id": 0}
    ).to_list(1000)
    
    total = len(all_problems)
    correct = sum(1 for p in all_problems if p.get("correct", False))
    
    # Stats by topic
    topic_stats = {}
    for p in all_problems:
        topic = p["topic"]
        if topic not in topic_stats:
            topic_stats[topic] = {"total": 0, "correct": 0}
        topic_stats[topic]["total"] += 1
        if p.get("correct", False):
            topic_stats[topic]["correct"] += 1
    
    # Stats by difficulty
    difficulty_stats = {"easy": {"total": 0, "correct": 0}, "medium": {"total": 0, "correct": 0}, "hard": {"total": 0, "correct": 0}}
    for p in all_problems:
        diff = p.get("difficulty", "medium")
        if diff in difficulty_stats:
            difficulty_stats[diff]["total"] += 1
            if p.get("correct", False):
                difficulty_stats[diff]["correct"] += 1
    
    return {
        "total_problems": total,
        "correct_answers": correct,
        "accuracy": round((correct / total * 100) if total > 0 else 0, 1),
        "topic_stats": topic_stats,
        "difficulty_stats": difficulty_stats
    }

# ============== LESSONS ==============

LESSON_CONTENT = {
    "counting": {
        "overview": "Counting is the foundation of all math! Learn to count objects, recognize numbers, and understand number sequences.",
        "key_concepts": [
            {"title": "Number Recognition", "content": "Numbers are symbols that represent quantities. 1, 2, 3, 4, 5... each number is one more than the previous."},
            {"title": "Counting Objects", "content": "Point to each object and say one number at a time. The last number you say is the total count."},
            {"title": "Number Order", "content": "Numbers have a specific order. We count up (1, 2, 3...) and can count down (10, 9, 8...)."}
        ],
        "examples": [
            {"problem": "Count the apples: 🍎🍎🍎🍎🍎", "solution": "Point and count: 1, 2, 3, 4, 5. There are 5 apples!"},
            {"problem": "What comes after 7?", "solution": "7, then 8. The answer is 8!"}
        ],
        "tips": ["Use your fingers to help count", "Touch each object as you count", "Practice counting everyday things around you"]
    },
    "addition": {
        "overview": "Addition is combining groups of things together to find a total. The symbol '+' means 'plus' or 'add'.",
        "key_concepts": [
            {"title": "Adding Numbers", "content": "When we add, we put groups together. 3 + 2 means 'start with 3 and add 2 more' which equals 5."},
            {"title": "Order Doesn't Matter", "content": "3 + 2 gives the same answer as 2 + 3. This is called the commutative property!"},
            {"title": "Adding Zero", "content": "Adding 0 to any number gives you the same number. 5 + 0 = 5."}
        ],
        "examples": [
            {"problem": "5 + 3 = ?", "solution": "Start with 5, count up 3 more: 6, 7, 8. So 5 + 3 = 8"},
            {"problem": "7 + 4 = ?", "solution": "7 + 4 = 11. You can think of it as 7 + 3 = 10, then +1 more = 11"}
        ],
        "tips": ["Draw dots or use objects to visualize", "Learn your number bonds (pairs that make 10)", "Practice mental math daily"]
    },
    "subtraction": {
        "overview": "Subtraction is taking away from a group or finding the difference between two numbers. The symbol '-' means 'minus' or 'subtract'.",
        "key_concepts": [
            {"title": "Taking Away", "content": "8 - 3 means 'start with 8 and take away 3'. You're left with 5."},
            {"title": "Finding Difference", "content": "Subtraction also helps find how many more or less. How much more is 7 than 4? 7 - 4 = 3"},
            {"title": "Subtracting Zero", "content": "Taking away 0 leaves the number unchanged. 9 - 0 = 9."}
        ],
        "examples": [
            {"problem": "10 - 4 = ?", "solution": "Start at 10, count back 4: 9, 8, 7, 6. So 10 - 4 = 6"},
            {"problem": "15 - 7 = ?", "solution": "15 - 5 = 10, then 10 - 2 = 8. So 15 - 7 = 8"}
        ],
        "tips": ["Think of subtraction as 'counting backwards'", "Use a number line to visualize", "Check your answer by adding back"]
    },
    "multiplication": {
        "overview": "Multiplication is repeated addition. It's a faster way to add the same number multiple times. The symbol '×' means 'times'.",
        "key_concepts": [
            {"title": "Groups Of", "content": "3 × 4 means '3 groups of 4' which equals 12. It's the same as 4 + 4 + 4."},
            {"title": "Times Tables", "content": "Memorizing times tables (1-12) makes multiplication fast and easy."},
            {"title": "Multiplying by 1 and 0", "content": "Any number × 1 = itself. Any number × 0 = 0."}
        ],
        "examples": [
            {"problem": "6 × 7 = ?", "solution": "6 × 7 = 42. Remember: 6 groups of 7, or 7 groups of 6."},
            {"problem": "8 × 9 = ?", "solution": "8 × 9 = 72. Trick: 8 × 9 = 8 × 10 - 8 = 80 - 8 = 72"}
        ],
        "tips": ["Learn times tables through songs and games", "Use arrays (rows and columns) to visualize", "Look for patterns in multiplication"]
    },
    "division": {
        "overview": "Division is splitting a number into equal groups or finding how many times one number fits into another. The symbol '÷' means 'divided by'.",
        "key_concepts": [
            {"title": "Equal Groups", "content": "12 ÷ 3 asks 'how many groups of 3 are in 12?' The answer is 4."},
            {"title": "Sharing Equally", "content": "Division also means sharing. 15 cookies among 5 friends = 3 cookies each."},
            {"title": "Remainders", "content": "Sometimes division doesn't split evenly. 13 ÷ 4 = 3 remainder 1."}
        ],
        "examples": [
            {"problem": "24 ÷ 6 = ?", "solution": "How many 6s fit in 24? Count: 6, 12, 18, 24. That's 4 times!"},
            {"problem": "45 ÷ 9 = ?", "solution": "Think: what × 9 = 45? Answer: 5 × 9 = 45, so 45 ÷ 9 = 5"}
        ],
        "tips": ["Division is the opposite of multiplication", "Use multiplication facts to help divide", "Check by multiplying your answer"]
    },
    "fractions": {
        "overview": "Fractions represent parts of a whole. The top number (numerator) shows how many parts you have, and the bottom number (denominator) shows how many equal parts make the whole.",
        "key_concepts": [
            {"title": "Reading Fractions", "content": "1/2 is 'one half' - the whole is split into 2 parts and we have 1. 3/4 is 'three fourths'."},
            {"title": "Equivalent Fractions", "content": "1/2 = 2/4 = 4/8. Different fractions can represent the same amount."},
            {"title": "Comparing Fractions", "content": "Same denominator: compare numerators. 3/5 > 2/5. Different: find common denominator first."}
        ],
        "examples": [
            {"problem": "Add 1/4 + 2/4", "solution": "Same denominator, so add numerators: 1 + 2 = 3. Answer: 3/4"},
            {"problem": "Simplify 6/8", "solution": "Divide both by 2: 6÷2 = 3, 8÷2 = 4. So 6/8 = 3/4"}
        ],
        "tips": ["Visualize with pie charts or bars", "Always look for common factors to simplify", "Convert to same denominator before adding/subtracting"]
    },
    "geometry": {
        "overview": "Geometry is the study of shapes, sizes, angles, and the properties of space. It helps us understand the world around us!",
        "key_concepts": [
            {"title": "2D Shapes", "content": "Flat shapes like triangles (3 sides), squares (4 equal sides), rectangles, circles, and polygons."},
            {"title": "3D Shapes", "content": "Solid shapes like cubes, spheres, cylinders, cones, and pyramids have length, width, AND height."},
            {"title": "Angles", "content": "Angles measure turns. Right angle = 90°, acute < 90°, obtuse > 90°, straight = 180°."}
        ],
        "examples": [
            {"problem": "Find the area of a rectangle with length 8 and width 5", "solution": "Area = length × width = 8 × 5 = 40 square units"},
            {"problem": "A triangle has angles of 60° and 70°. What's the third angle?", "solution": "Triangle angles sum to 180°. 180 - 60 - 70 = 50°"}
        ],
        "tips": ["Draw diagrams to visualize problems", "Memorize formulas for area and perimeter", "Look for shapes in everyday objects"]
    },
    "algebra": {
        "overview": "Algebra uses letters (variables) to represent unknown numbers. It helps us solve problems and find patterns.",
        "key_concepts": [
            {"title": "Variables", "content": "Letters like x, y, n represent unknown values. In 'x + 5 = 12', x represents a number we need to find."},
            {"title": "Solving Equations", "content": "Do the same operation to both sides to isolate the variable. x + 5 = 12 → x = 12 - 5 = 7"},
            {"title": "Expressions", "content": "Algebraic expressions like '3x + 2' combine numbers and variables with operations."}
        ],
        "examples": [
            {"problem": "Solve: 2x + 6 = 14", "solution": "Subtract 6: 2x = 8. Divide by 2: x = 4. Check: 2(4) + 6 = 14 ✓"},
            {"problem": "Simplify: 3x + 2x - 4", "solution": "Combine like terms: 3x + 2x = 5x. Answer: 5x - 4"}
        ],
        "tips": ["Always do the same operation to both sides", "Combine like terms first", "Check your answer by substituting back"]
    },
    "trigonometry": {
        "overview": "Trigonometry studies relationships between angles and sides in triangles. It's essential for physics, engineering, and navigation!",
        "key_concepts": [
            {"title": "SOH-CAH-TOA", "content": "Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent. This helps find missing sides and angles."},
            {"title": "Right Triangles", "content": "The hypotenuse is the longest side (opposite the right angle). Pythagorean theorem: a² + b² = c²"},
            {"title": "Unit Circle", "content": "A circle with radius 1 centered at origin. Helps understand trig functions for any angle."}
        ],
        "examples": [
            {"problem": "Find sin(30°)", "solution": "sin(30°) = 1/2 = 0.5. This is a standard angle to memorize!"},
            {"problem": "Right triangle with legs 3 and 4, find hypotenuse", "solution": "c² = 3² + 4² = 9 + 16 = 25. c = √25 = 5"}
        ],
        "tips": ["Memorize SOH-CAH-TOA", "Learn the special triangles (30-60-90 and 45-45-90)", "Use calculator for non-standard angles"]
    },
    "calculus": {
        "overview": "Calculus is the mathematics of change and motion. It has two main branches: differentiation (rates of change) and integration (accumulation).",
        "key_concepts": [
            {"title": "Derivatives", "content": "The derivative measures how fast something changes. If f(x) = x², then f'(x) = 2x tells us the rate of change."},
            {"title": "Integrals", "content": "Integration is the reverse of differentiation. It finds the area under a curve and accumulates quantities."},
            {"title": "Limits", "content": "Limits describe what happens as we approach a value. They're the foundation of calculus."}
        ],
        "examples": [
            {"problem": "Find the derivative of f(x) = x³", "solution": "Use power rule: f'(x) = 3x². Bring down the power and reduce by 1."},
            {"problem": "Find ∫2x dx", "solution": "Reverse power rule: ∫2x dx = x² + C (don't forget the constant!)"}
        ],
        "tips": ["Master algebra before tackling calculus", "Understand what derivatives and integrals mean conceptually", "Practice the power rule until it's automatic"]
    },
    "word_problems": {
        "overview": "Word problems apply math to real-world situations. The key is translating words into mathematical expressions and equations.",
        "key_concepts": [
            {"title": "Read Carefully", "content": "Identify what's given and what you need to find. Underline important numbers and keywords."},
            {"title": "Key Words", "content": "'Total' often means add, 'difference' means subtract, 'times' or 'product' means multiply, 'per' or 'each' often means divide."},
            {"title": "Write an Equation", "content": "Turn the word problem into a math equation, then solve step by step."}
        ],
        "examples": [
            {"problem": "Sarah has 24 cookies. She gives 1/3 to her brother. How many does she have left?", "solution": "1/3 of 24 = 24 ÷ 3 = 8 cookies given away. 24 - 8 = 16 cookies left."},
            {"problem": "A train travels 60 mph for 2.5 hours. How far does it go?", "solution": "Distance = Speed × Time = 60 × 2.5 = 150 miles"}
        ],
        "tips": ["Draw pictures or diagrams", "Identify the operation needed", "Always check if your answer makes sense"]
    },
    "statistics": {
        "overview": "Statistics is the science of collecting, organizing, and analyzing data to understand patterns and make predictions.",
        "key_concepts": [
            {"title": "Mean (Average)", "content": "Add all values and divide by how many there are. Mean of 2,4,6,8 = 20÷4 = 5"},
            {"title": "Median", "content": "The middle value when data is ordered. For 1,3,5,7,9 the median is 5."},
            {"title": "Mode", "content": "The most frequent value. In 2,3,3,4,5, the mode is 3."}
        ],
        "examples": [
            {"problem": "Find the mean of: 10, 15, 20, 25, 30", "solution": "Sum = 100. Count = 5. Mean = 100 ÷ 5 = 20"},
            {"problem": "Find median of: 7, 2, 9, 4, 5", "solution": "Order: 2,4,5,7,9. Middle value = 5"}
        ],
        "tips": ["Always order data before finding median", "A data set can have multiple modes or no mode", "Mean is affected by outliers, median is not"]
    }
}

# Add content for remaining topics with default structure
DEFAULT_LESSON = {
    "overview": "This topic covers important mathematical concepts. Practice regularly to master these skills!",
    "key_concepts": [
        {"title": "Core Concept", "content": "Understanding the fundamentals is key to success in this topic."},
        {"title": "Problem Solving", "content": "Apply logical thinking and step-by-step approaches to solve problems."},
        {"title": "Practice", "content": "Regular practice helps reinforce learning and builds confidence."}
    ],
    "examples": [
        {"problem": "Practice Problem", "solution": "Work through problems step by step, checking each calculation."}
    ],
    "tips": ["Read problems carefully", "Show your work", "Check your answers"]
}

@api_router.get("/lessons/{grade}/{topic}", response_model=LessonContent)
async def get_lesson(grade: int, topic: str, current_user: dict = Depends(get_current_user)):
    """Get lesson content for a specific topic"""
    if grade < 1 or grade > 12:
        raise HTTPException(status_code=400, detail="Grade must be between 1 and 12")
    
    topic_name = TOPIC_DISPLAY_NAMES.get(topic, topic.replace("_", " ").title())
    
    # Get lesson content or use default
    content = LESSON_CONTENT.get(topic, DEFAULT_LESSON)
    
    return LessonContent(
        topic_id=topic,
        topic_name=topic_name,
        grade=grade,
        overview=content["overview"],
        key_concepts=content["key_concepts"],
        examples=content["examples"],
        tips=content["tips"]
    )

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
