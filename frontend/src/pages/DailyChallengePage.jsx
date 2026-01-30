import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { toast } from "sonner";
import { 
  Calendar, Flame, Zap, Check, X, Trophy, 
  Lightbulb, ChevronRight, Star, Award, Sparkles,
  Target, Clock, Gift
} from "lucide-react";

const DailyChallengePage = () => {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengeRes, statsRes] = await Promise.all([
          axios.get(`${API}/daily-challenge`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/daily-challenge/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setChallenge(challengeRes.data);
        setStats(statsRes.data);
        
        // If already completed, show the result
        if (challengeRes.data.completed) {
          setSelectedAnswer(challengeRes.data.user_answer);
          setResult({
            correct: challengeRes.data.was_correct,
            correct_answer: challengeRes.data.correct_answer
          });
        }
      } catch (error) {
        console.error("Failed to fetch daily challenge:", error);
        toast.error("Failed to load daily challenge");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const submitAnswer = async () => {
    if (!selectedAnswer || !challenge || challenge.completed) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/daily-challenge/answer`,
        { problem_id: challenge.id, selected_answer: selectedAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      
      if (response.data.correct) {
        toast.success(`+${response.data.total_xp_earned} XP! (${response.data.bonus_xp_earned} bonus!)`, {
          icon: <Zap className="w-5 h-5 text-secondary" />
        });
      }
      
      if (response.data.level_up) {
        setTimeout(() => setLevelUp(true), 1500);
      }
      
      if (response.data.new_badges && response.data.new_badges.length > 0) {
        setTimeout(() => setNewBadges(response.data.new_badges), response.data.level_up ? 3000 : 1500);
      }
      
      // Refresh stats
      const statsRes = await axios.get(`${API}/daily-challenge/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);
      
      refreshUser();
      
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error(error.response?.data?.detail || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionClass = (option) => {
    if (!result) {
      return selectedAnswer === option ? "selected" : "";
    }
    if (option === result.correct_answer) {
      return "correct";
    }
    if (option === selectedAnswer && !result.correct) {
      return "incorrect";
    }
    return "";
  };

  const topicNames = {
    geometry: "Geometry",
    algebra: "Algebra",
    word_problems: "Word Problems",
    fractions: "Fractions",
    trigonometry: "Trigonometry",
    calculus: "Calculus",
    statistics: "Statistics"
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="daily-challenge-page">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 mb-4 animate-pulse-glow">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="gradient-text">Daily Challenge</span>
          </h1>
          <p className="text-muted-foreground">
            Complete today's challenge for bonus XP and keep your streak alive!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{stats?.current_streak || 0}</div>
          </div>
          
          <div className="stat-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Best Streak</span>
            </div>
            <div className="text-3xl font-bold text-yellow-500">{stats?.longest_streak || 0}</div>
          </div>
          
          <div className="stat-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <div className="text-3xl font-bold">{stats?.total_completed || 0}</div>
          </div>
          
          <div className="stat-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Correct</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{stats?.total_correct || 0}</div>
          </div>
        </div>

        {/* Challenge Card */}
        {challenge && (
          <div className="problem-card p-6 sm:p-8 relative overflow-hidden" data-testid="daily-challenge-card">
            {/* Special Daily Banner */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
            
            {/* Challenge Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-500 text-sm font-medium">
                  {topicNames[challenge.topic] || challenge.topic}
                </div>
                <div className="px-3 py-1 rounded-full bg-muted text-sm">
                  Grade {challenge.grade}
                </div>
              </div>
              
              {/* Reward Display */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  {challenge.xp_reward} XP
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium">
                  <Gift className="w-4 h-4" />
                  +{challenge.bonus_xp} Bonus
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="math-equation mb-8" data-testid="challenge-question">
              {challenge.question}
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {challenge.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !result && !challenge.completed && setSelectedAnswer(option)}
                  disabled={!!result || challenge.completed}
                  className={`option-btn ${getOptionClass(option)}`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      (result && option === result.correct_answer)
                        ? "bg-[#84CC16] text-black" 
                        : (result && option === selectedAnswer && !result.correct)
                        ? "bg-destructive text-white"
                        : selectedAnswer === option
                        ? "bg-primary text-white"
                        : "bg-muted"
                    }`}>
                      {(result && option === result.correct_answer) ? (
                        <Check className="w-5 h-5" />
                      ) : (result && option === selectedAnswer && !result.correct) ? (
                        <X className="w-5 h-5" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Hint Section */}
            {!result && !challenge.completed && challenge.hint && (
              <div className="mb-6">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors"
                    data-testid="show-hint-btn"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">Need a hint?</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 animate-slide-up">
                    <div className="flex items-center gap-2 text-secondary font-medium mb-2">
                      <Lightbulb className="w-4 h-4" />
                      Hint
                    </div>
                    <p className="text-muted-foreground">{challenge.hint}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!result && !challenge.completed ? (
              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer || submitting}
                className="w-full btn-primary py-6 text-lg glow-primary"
                data-testid="submit-answer-btn"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit Answer
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Result Banner */}
                <div className={`p-4 rounded-xl flex items-center gap-4 ${
                  result?.correct 
                    ? "bg-[#84CC16]/20 border border-[#84CC16]/30" 
                    : "bg-destructive/20 border border-destructive/30"
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    result?.correct ? "bg-[#84CC16]" : "bg-destructive"
                  }`}>
                    {result?.correct ? (
                      <Check className="w-6 h-6 text-black" />
                    ) : (
                      <X className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg">
                      {result?.correct ? "Challenge Complete!" : "Not quite..."}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result?.correct 
                        ? `You earned ${result.total_xp_earned || challenge.xp_reward + challenge.bonus_xp} XP!` 
                        : `The correct answer was ${result?.correct_answer || challenge.correct_answer}`
                      }
                    </div>
                  </div>
                  {result?.correct && result?.daily_streak > 0 && (
                    <div className="ml-auto streak-flame">
                      <Flame className="w-4 h-4" />
                      {result.daily_streak} day streak!
                    </div>
                  )}
                </div>

                {/* Explanation Toggle */}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-secondary" />
                    <span className="font-medium">View Explanation</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${showExplanation ? "rotate-90" : ""}`} />
                </button>

                {showExplanation && (
                  <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 animate-slide-up">
                    <p className="text-muted-foreground leading-relaxed">
                      {challenge.explanation}
                    </p>
                  </div>
                )}

                {/* Come Back Tomorrow */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Come back tomorrow for a new challenge!
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>New challenge at midnight UTC</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Level Up Modal */}
        {levelUp && (
          <div className="level-up-celebration" onClick={() => setLevelUp(false)}>
            <div className="glass p-8 rounded-3xl text-center max-w-sm mx-4 animate-bounce-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 gradient-text">Level Up!</h2>
              <p className="text-muted-foreground mb-4">
                You've reached Level {result?.new_level}!
              </p>
              <Button className="btn-primary" onClick={() => setLevelUp(false)}>
                Awesome!
              </Button>
            </div>
          </div>
        )}

        {/* New Badge Modal */}
        {newBadges.length > 0 && !levelUp && (
          <div className="level-up-celebration" onClick={() => setNewBadges([])}>
            <div className="glass p-8 rounded-3xl text-center max-w-sm mx-4 animate-bounce-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 gradient-text">New Badge!</h2>
              <p className="text-muted-foreground mb-4">
                You've earned: {newBadges.map(b => b.replace(/_/g, ' ')).join(', ')}
              </p>
              <Button className="btn-primary" onClick={() => setNewBadges([])}>
                <Sparkles className="w-4 h-4 mr-2" />
                Amazing!
              </Button>
            </div>
          </div>
        )}

        {/* Streak Info */}
        <div className="mt-8 glass p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Streak Rewards
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${(stats?.current_streak || 0) >= 3 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-muted/50'}`}>
              <div className="font-bold">3-Day Streak</div>
              <div className="text-sm text-muted-foreground">Special badge unlocked</div>
            </div>
            <div className={`p-4 rounded-xl ${(stats?.current_streak || 0) >= 7 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-muted/50'}`}>
              <div className="font-bold">7-Day Streak</div>
              <div className="text-sm text-muted-foreground">Week Warrior badge</div>
            </div>
            <div className={`p-4 rounded-xl ${(stats?.current_streak || 0) >= 30 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-muted/50'}`}>
              <div className="font-bold">30-Day Streak</div>
              <div className="text-sm text-muted-foreground">Monthly Master badge</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DailyChallengePage;
