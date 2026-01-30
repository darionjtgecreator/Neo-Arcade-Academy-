import requests
import sys
import json
from datetime import datetime
import uuid

class MathLearningAPITester:
    def __init__(self, base_url="https://learnmath-44.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "health", 200)

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Try to login with provided test credentials first
        test_email = "mathstudent@test.com"
        test_password = "password123"
        
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        print(f"   🔑 Attempting login with provided test credentials: {test_email}")
        login_response = self.run_test("Login with Test Credentials", "POST", "auth/login", 200, login_data)
        
        if login_response and 'token' in login_response:
            self.token = login_response['token']
            self.user_id = login_response['user']['id']
            print(f"   📝 Login successful with test user")
            
            # Test get current user
            self.run_test("Get Current User", "GET", "auth/me", 200)
            return True
        else:
            print("   ⚠️ Test credentials failed, trying registration...")
            
            # Generate unique test user as fallback
            timestamp = datetime.now().strftime('%H%M%S')
            test_username = f"testuser_{timestamp}"
            fallback_email = f"test_{timestamp}@example.com"
            fallback_password = "TestPass123!"

            # Test registration
            register_data = {
                "username": test_username,
                "email": fallback_email,
                "password": fallback_password
            }
            
            response = self.run_test("User Registration (Fallback)", "POST", "auth/register", 200, register_data)
            if response and 'token' in response:
                self.token = response['token']
                self.user_id = response['user']['id']
                print(f"   📝 Registered fallback user: {test_username}")
                
                # Test login with new credentials
                login_data = {
                    "email": fallback_email,
                    "password": fallback_password
                }
                
                login_response = self.run_test("User Login (Fallback)", "POST", "auth/login", 200, login_data)
                if login_response and 'token' in login_response:
                    print(f"   📝 Login successful with fallback user")
                
                # Test get current user
                self.run_test("Get Current User", "GET", "auth/me", 200)
                return True
            else:
                print("   ❌ Both test credentials and registration failed - cannot continue with auth tests")
                return False

    def test_grades_and_topics(self):
        """Test grade and topic endpoints"""
        print("\n🔍 Testing Grades & Topics...")
        
        # Test get all grades
        grades_response = self.run_test("Get All Grades", "GET", "grades", 200)
        
        if grades_response and isinstance(grades_response, list) and len(grades_response) > 0:
            print(f"   📝 Found {len(grades_response)} grades")
            
            # Test get topics for a specific grade
            test_grade = grades_response[4]['grade']  # Grade 5
            topics_response = self.run_test(f"Get Topics for Grade {test_grade}", "GET", f"topics/{test_grade}", 200)
            
            if topics_response and isinstance(topics_response, list):
                print(f"   📝 Found {len(topics_response)} topics for grade {test_grade}")
                return test_grade, topics_response
        
        return None, None

    def test_problem_generation(self, grade=5, topics=None):
        """Test AI problem generation and answering"""
        print("\n🔍 Testing Problem Generation...")
        
        if not topics or len(topics) == 0:
            print("   ⚠️ No topics available for testing")
            return
        
        # Use first available topic
        test_topic = topics[0]['id']
        
        # Test problem generation
        problem_data = {
            "grade": grade,
            "topic": test_topic,
            "difficulty": "medium"
        }
        
        print(f"   🎯 Generating problem for Grade {grade}, Topic: {test_topic}")
        problem_response = self.run_test("Generate Problem", "POST", "problems/generate", 200, problem_data)
        
        if problem_response and 'id' in problem_response:
            problem_id = problem_response['id']
            print(f"   📝 Generated problem ID: {problem_id}")
            print(f"   📝 Question: {problem_response.get('question', 'N/A')[:100]}...")
            
            # Test answer submission (submit first option)
            if 'options' in problem_response and len(problem_response['options']) > 0:
                answer_data = {
                    "problem_id": problem_id,
                    "selected_answer": problem_response['options'][0]
                }
                
                answer_response = self.run_test("Submit Answer", "POST", "problems/answer", 200, answer_data)
                
                if answer_response:
                    print(f"   📝 Answer result: {'Correct' if answer_response.get('correct') else 'Incorrect'}")
                    print(f"   📝 XP earned: {answer_response.get('xp_earned', 0)}")
        else:
            print("   ❌ Problem generation failed")

    def test_lessons(self, grade=5, topics=None):
        """Test lesson endpoints"""
        print("\n🔍 Testing Lesson Endpoints...")
        
        if not topics or len(topics) == 0:
            print("   ⚠️ No topics available for lesson testing")
            return
        
        # Use first available topic for lesson testing
        test_topic = topics[0]['id']
        
        # Test get lesson content
        lesson_response = self.run_test(f"Get Lesson Content (Grade {grade}, Topic: {test_topic})", 
                                      "GET", f"lessons/{grade}/{test_topic}", 200)
        
        if lesson_response:
            print(f"   📝 Lesson topic: {lesson_response.get('topic_name', 'N/A')}")
            print(f"   📝 Overview length: {len(lesson_response.get('overview', ''))}")
            print(f"   📝 Key concepts: {len(lesson_response.get('key_concepts', []))}")
            print(f"   📝 Examples: {len(lesson_response.get('examples', []))}")
            print(f"   📝 Tips: {len(lesson_response.get('tips', []))}")
            
            # Validate lesson structure
            required_fields = ['topic_id', 'topic_name', 'grade', 'overview', 'key_concepts', 'examples', 'tips']
            missing_fields = [field for field in required_fields if field not in lesson_response]
            if missing_fields:
                print(f"   ⚠️ Missing lesson fields: {missing_fields}")
            else:
                print("   ✅ Lesson structure is complete")

    def test_practice_history(self):
        """Test practice history endpoints"""
        print("\n🔍 Testing Practice History...")
        
        # Test get practice history
        history_response = self.run_test("Get Practice History", "GET", "history?limit=20", 200)
        
        if history_response and isinstance(history_response, list):
            print(f"   📝 Found {len(history_response)} history entries")
            
            if len(history_response) > 0:
                # Check first entry structure
                entry = history_response[0]
                required_fields = ['id', 'question', 'topic', 'grade', 'difficulty', 'correct', 'user_answer', 'correct_answer', 'xp_earned', 'answered_at']
                missing_fields = [field for field in required_fields if field not in entry]
                if missing_fields:
                    print(f"   ⚠️ Missing history entry fields: {missing_fields}")
                else:
                    print("   ✅ History entry structure is complete")
        
        # Test get history statistics
        stats_response = self.run_test("Get History Statistics", "GET", "history/stats", 200)
        
        if stats_response:
            print(f"   📝 Total problems in stats: {stats_response.get('total_problems', 0)}")
            print(f"   📝 Accuracy: {stats_response.get('accuracy', 0)}%")
            
            # Check stats structure
            required_fields = ['total_problems', 'correct_answers', 'accuracy', 'topic_stats', 'difficulty_stats']
            missing_fields = [field for field in required_fields if field not in stats_response]
            if missing_fields:
                print(f"   ⚠️ Missing stats fields: {missing_fields}")
            else:
                print("   ✅ History stats structure is complete")

    def test_hint_system(self, grade=5, topics=None):
        """Test hint system in problem generation"""
        print("\n🔍 Testing Hint System...")
        
        if not topics or len(topics) == 0:
            print("   ⚠️ No topics available for hint testing")
            return
        
        # Use first available topic
        test_topic = topics[0]['id']
        
        # Test problem generation with hint
        problem_data = {
            "grade": grade,
            "topic": test_topic,
            "difficulty": "medium"
        }
        
        print(f"   🎯 Generating problem to test hint system")
        problem_response = self.run_test("Generate Problem with Hint", "POST", "problems/generate", 200, problem_data)
        
        if problem_response:
            # Check if hint field is present
            if 'hint' in problem_response:
                hint_text = problem_response['hint']
                print(f"   📝 Hint present: {len(hint_text)} characters")
                print(f"   📝 Hint preview: {hint_text[:100]}...")
                
                if len(hint_text) > 10:  # Basic validation that hint has content
                    print("   ✅ Hint system working correctly")
                else:
                    print("   ⚠️ Hint seems too short or empty")
            else:
                print("   ❌ Hint field missing from problem response")

    def test_badges_system(self):
        """Test badges system with categories including daily challenge badges"""
        print("\n🔍 Testing Badges System...")
        
        # Test get all badges
        badges_response = self.run_test("Get All Badges", "GET", "badges", 200)
        
        if badges_response and isinstance(badges_response, list):
            print(f"   📝 Found {len(badges_response)} badges")
            
            # Check if we have 40 badges as specified (updated from 34)
            if len(badges_response) >= 40:
                print(f"   ✅ Correct number of badges (40+): {len(badges_response)}")
            else:
                print(f"   ⚠️ Expected 40+ badges, found {len(badges_response)}")
            
            # Check badge structure and categories
            categories_found = set()
            badges_with_categories = 0
            daily_badges = []
            
            for badge in badges_response:
                required_fields = ['id', 'name', 'description', 'icon', 'category', 'earned']
                missing_fields = [field for field in required_fields if field not in badge]
                
                if missing_fields:
                    print(f"   ⚠️ Badge {badge.get('id', 'unknown')} missing fields: {missing_fields}")
                else:
                    badges_with_categories += 1
                    categories_found.add(badge['category'])
                    
                    # Collect daily challenge badges
                    if badge['category'] == 'daily':
                        daily_badges.append(badge['id'])
            
            print(f"   📝 Badges with complete structure: {badges_with_categories}/{len(badges_response)}")
            print(f"   📝 Categories found: {sorted(categories_found)}")
            
            # Check for expected 9 categories (including daily)
            expected_categories = {'milestone', 'streak', 'level', 'accuracy', 'difficulty', 'topic', 'grade', 'special', 'daily'}
            if categories_found == expected_categories:
                print("   ✅ All 9 expected categories present (including daily)")
            else:
                missing = expected_categories - categories_found
                extra = categories_found - expected_categories
                if missing:
                    print(f"   ⚠️ Missing categories: {missing}")
                if extra:
                    print(f"   ⚠️ Extra categories: {extra}")
            
            # Check daily challenge badges specifically
            print(f"   📝 Daily challenge badges found: {len(daily_badges)}")
            expected_daily_badges = ['daily_first', 'daily_10', 'daily_50', 'daily_streak_3', 'daily_streak_7', 'daily_streak_30']
            
            for expected_badge in expected_daily_badges:
                if expected_badge in daily_badges:
                    print(f"   ✅ Found daily badge: {expected_badge}")
                else:
                    print(f"   ⚠️ Missing daily badge: {expected_badge}")
            
            if len(daily_badges) >= 6:
                print("   ✅ Daily challenge badges requirement met (6+)")
            else:
                print(f"   ⚠️ Expected 6+ daily badges, found {len(daily_badges)}")
                
        else:
            print("   ❌ Failed to get badges or invalid response format")

    def test_mastery_system(self):
        """Test topic mastery tracking system"""
        print("\n🔍 Testing Mastery System...")
        
        # Test get all topic mastery
        mastery_response = self.run_test("Get Topic Mastery", "GET", "mastery", 200)
        
        if mastery_response and isinstance(mastery_response, list):
            print(f"   📝 Found mastery data for {len(mastery_response)} topics")
            
            if len(mastery_response) > 0:
                # Check first mastery entry structure
                mastery_entry = mastery_response[0]
                required_fields = ['topic_id', 'topic_name', 'completed', 'correct', 'accuracy', 'mastery_level', 'mastery_percent', 'next_milestone']
                missing_fields = [field for field in required_fields if field not in mastery_entry]
                
                if missing_fields:
                    print(f"   ⚠️ Mastery entry missing fields: {missing_fields}")
                else:
                    print("   ✅ Mastery entry structure is complete")
                    
                    # Check mastery levels
                    mastery_levels = set()
                    for entry in mastery_response:
                        mastery_levels.add(entry.get('mastery_level', 'Unknown'))
                    
                    print(f"   📝 Mastery levels found: {sorted(mastery_levels)}")
                    
                    # Check for expected 5 mastery levels
                    expected_levels = {'Novice', 'Beginner', 'Intermediate', 'Advanced', 'Master', 'Not Started'}
                    if mastery_levels.issubset(expected_levels):
                        print("   ✅ Valid mastery levels")
                    else:
                        invalid = mastery_levels - expected_levels
                        if invalid:
                            print(f"   ⚠️ Invalid mastery levels: {invalid}")
                
                # Test single topic mastery
                test_topic = mastery_response[0]['topic_id']
                single_mastery = self.run_test(f"Get Single Topic Mastery ({test_topic})", "GET", f"mastery/{test_topic}", 200)
                
                if single_mastery:
                    print(f"   📝 Single topic mastery: {single_mastery.get('mastery_level', 'N/A')} ({single_mastery.get('mastery_percent', 0)}%)")
        else:
            print("   ❌ Failed to get mastery data or invalid response format")

    def test_adaptive_difficulty(self):
        """Test adaptive difficulty recommendation system"""
        print("\n🔍 Testing Adaptive Difficulty...")
        
        # Test get adaptive difficulty recommendation
        adaptive_response = self.run_test("Get Adaptive Difficulty", "GET", "adaptive-difficulty", 200)
        
        if adaptive_response:
            required_fields = ['current_difficulty', 'recommended_difficulty', 'reason', 'recent_accuracy', 'recent_problems', 'confidence']
            missing_fields = [field for field in required_fields if field not in adaptive_response]
            
            if missing_fields:
                print(f"   ⚠️ Adaptive difficulty missing fields: {missing_fields}")
            else:
                print("   ✅ Adaptive difficulty structure is complete")
                print(f"   📝 Current difficulty: {adaptive_response.get('current_difficulty')}")
                print(f"   📝 Recommended difficulty: {adaptive_response.get('recommended_difficulty')}")
                print(f"   📝 Recent accuracy: {adaptive_response.get('recent_accuracy')}%")
                print(f"   📝 Recent problems: {adaptive_response.get('recent_problems')}")
                print(f"   📝 Confidence: {adaptive_response.get('confidence')}")
                print(f"   📝 Reason: {adaptive_response.get('reason', 'N/A')[:100]}...")
                
                # Validate difficulty values
                valid_difficulties = {'easy', 'medium', 'hard'}
                current_diff = adaptive_response.get('current_difficulty')
                recommended_diff = adaptive_response.get('recommended_difficulty')
                
                if current_diff in valid_difficulties and recommended_diff in valid_difficulties:
                    print("   ✅ Valid difficulty values")
                else:
                    print(f"   ⚠️ Invalid difficulty values: current={current_diff}, recommended={recommended_diff}")
        else:
            print("   ❌ Failed to get adaptive difficulty data")
        
        # Test adaptive difficulty with topic filter
        test_topic = "algebra"
        topic_adaptive = self.run_test(f"Get Adaptive Difficulty for Topic ({test_topic})", "GET", f"adaptive-difficulty?topic={test_topic}", 200)
        
        if topic_adaptive:
            print(f"   📝 Topic-specific recommendation: {topic_adaptive.get('recommended_difficulty', 'N/A')}")

    def test_enhanced_answer_submission(self, grade=5, topics=None):
        """Test enhanced answer submission with adaptive difficulty"""
        print("\n🔍 Testing Enhanced Answer Submission...")
        
        if not topics or len(topics) == 0:
            print("   ⚠️ No topics available for enhanced answer testing")
            return
        
        # Use first available topic
        test_topic = topics[0]['id']
        
        # Generate a problem first
        problem_data = {
            "grade": grade,
            "topic": test_topic,
            "difficulty": "medium"
        }
        
        print(f"   🎯 Generating problem for enhanced answer testing")
        problem_response = self.run_test("Generate Problem for Enhanced Answer", "POST", "problems/generate", 200, problem_data)
        
        if problem_response and 'id' in problem_response:
            problem_id = problem_response['id']
            
            # Submit answer and check for enhanced fields
            if 'options' in problem_response and len(problem_response['options']) > 0:
                answer_data = {
                    "problem_id": problem_id,
                    "selected_answer": problem_response['options'][0]
                }
                
                answer_response = self.run_test("Submit Enhanced Answer", "POST", "problems/answer", 200, answer_data)
                
                if answer_response:
                    # Check for new adaptive difficulty fields
                    required_fields = ['correct', 'correct_answer', 'explanation', 'xp_earned', 'new_total_xp', 'new_level', 'level_up', 'new_badges', 'recommended_difficulty']
                    missing_fields = [field for field in required_fields if field not in answer_response]
                    
                    if missing_fields:
                        print(f"   ⚠️ Answer response missing fields: {missing_fields}")
                    else:
                        print("   ✅ Enhanced answer response structure is complete")
                    
                    # Check adaptive difficulty fields specifically
                    if 'recommended_difficulty' in answer_response:
                        print(f"   📝 Recommended difficulty: {answer_response['recommended_difficulty']}")
                        
                        if 'difficulty_change_reason' in answer_response and answer_response['difficulty_change_reason']:
                            print(f"   📝 Difficulty change reason: {answer_response['difficulty_change_reason'][:100]}...")
                        else:
                            print("   📝 No difficulty change recommended")
                    
                    print(f"   📝 Answer result: {'Correct' if answer_response.get('correct') else 'Incorrect'}")
                    print(f"   📝 XP earned: {answer_response.get('xp_earned', 0)}")
                    print(f"   📝 New badges: {len(answer_response.get('new_badges', []))}")
        else:
            print("   ❌ Problem generation failed for enhanced answer testing")

    def test_progress_and_stats(self):
        """Test progress and statistics endpoints"""
        print("\n🔍 Testing Progress & Stats...")
        
        # Test get progress
        self.run_test("Get User Progress", "GET", "progress", 200)
        
        # Test leaderboard
        self.run_test("Get Leaderboard", "GET", "leaderboard", 200)
        
        # Test update current grade
        grade_data = {"grade": 7}
        self.run_test("Update Current Grade", "PUT", "user/grade?grade=7", 200)

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test invalid login
        invalid_login = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        self.run_test("Invalid Login", "POST", "auth/login", 401, invalid_login)
        
        # Test invalid grade
        self.run_test("Invalid Grade Topics", "GET", "topics/99", 400)
        
        # Test unauthorized access (without token)
        old_token = self.token
        self.token = None
        # Accept both 401 and 403 as valid unauthorized responses
        unauthorized_response = self.run_test("Unauthorized Access", "GET", "progress", 401)
        if not unauthorized_response:
            # Try 403 as alternative
            self.run_test("Unauthorized Access (403)", "GET", "progress", 403)
        self.token = old_token

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Math Learning App API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test basic endpoints
        self.test_health_endpoints()
        
        # Test authentication
        if not self.test_authentication():
            print("\n❌ Authentication tests failed - stopping test suite")
            return self.generate_report()
        
        # Test grades and topics
        grade, topics = self.test_grades_and_topics()
        
        # Test NEW FEATURES - Badges System (34 badges with categories)
        self.test_badges_system()
        
        # Test NEW FEATURES - Mastery System
        self.test_mastery_system()
        
        # Test NEW FEATURES - Adaptive Difficulty
        self.test_adaptive_difficulty()
        
        # Test lesson endpoints
        if grade and topics:
            self.test_lessons(grade, topics)
        
        # Test problem generation (if we have topics)
        if grade and topics:
            self.test_problem_generation(grade, topics)
            
        # Test NEW FEATURES - Enhanced answer submission with adaptive difficulty
        if grade and topics:
            self.test_enhanced_answer_submission(grade, topics)
            
        # Test hint system
        if grade and topics:
            self.test_hint_system(grade, topics)
        
        # Test practice history
        self.test_practice_history()
        
        # Test progress and stats
        self.test_progress_and_stats()
        
        # Test error cases
        self.test_error_cases()
        
        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} test(s) failed. Check the details above.")
            
            # Show failed tests
            failed_tests = [t for t in self.test_results if not t['success']]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"   • {test['test']}: {test['details']}")
            
            return 1

def main():
    """Main test execution"""
    tester = MathLearningAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())