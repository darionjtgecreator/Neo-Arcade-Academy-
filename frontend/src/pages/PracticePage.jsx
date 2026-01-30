import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { 
  ChevronLeft, ChevronRight, Zap, Check, X, 
  Lightbulb, RefreshCw, Award, Flame, Star,
  ArrowRight, Trophy, Sparkles
} from "lucide-react";

const PracticePage = () => {
  const { grade, topic } = useParams();
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  const topicNames = {
    counting: "Counting",
    addition: "Addition",
    subtraction: "Subtraction",
    basic_multiplication: "Basic Multiplication",
    multiplication: "Multiplication",
    division: "Division",
    fractions_intro: "Intro to Fractions",
    fractions: "Fractions",
    decimals: "Decimals",
    geometry_basics: "Basic Geometry",
    geometry: "Geometry",
    ratios: "Ratios",
    percentages: "Percentages",
    algebra_intro: "Intro to Algebra",
    algebra: "Algebra",
    statistics: "Statistics",
    linear_equations: "Linear Equations",
    quadratics: "Quadratic Equations",
    trigonometry: "Trigonometry",
    pre_calculus: "Pre-Calculus",
    calculus: "Calculus",
    word_problems: "Word Problems"
  };

  const generateProblem = async () => {
    setLoading(true);
    setProblem(null);
    setSelectedAnswer(null);
    setResult(null);
    setShowExplanation(false);
    setShowHint(false);
    
    try {
      const response = await axios.post(
        `${API}/problems/generate`,
        { grade: parseInt(grade), topic, difficulty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProblem(response.data);
    } catch (error) {
      console.error("Failed to generate problem:", error);
      toast.error("Failed to generate problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateProblem();
  }, [grade, topic, difficulty]);

  const submitAnswer = async () => {
    if (!selectedAnswer || !problem) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/problems/answer`,
        { problem_id: problem.id, selected_answer: selectedAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      
      if (response.data.correct) {
        setStreak(prev => prev + 1);
        toast.success(`+${response.data.xp_earned} XP!`, {
          icon: <Zap className="w-5 h-5 text-secondary" />
        });
      } else {
        setStreak(0);
      }
      
      // Only show modals after a short delay to not interfere with result display
      if (response.data.level_up) {
        setTimeout(() => setLevelUp(true), 1500);
      }
      
      if (response.data.new_badges && response.data.new_badges.length > 0) {
        setTimeout(() => setNewBadges(response.data.new_badges), response.data.level_up ? 3000 : 1500);
      }
      
      refreshUser();
      
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextProblem = () => {
    setLevelUp(false);
    setNewBadges([]);
    generateProblem();
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/topics/${grade}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-to-topics-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Topics
          </button>
          
          {/* Streak Display */}
          {streak > 0 && (
            <div className="streak-flame animate-bounce-in">
              <Flame className="w-4 h-4" />
              {streak} in a row!
            </div>
          )}
        </div>

        {/* Topic Info */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="gradient-text">{topicNames[topic] || topic}</span>
          </h1>
          <p className="text-muted-foreground">Grade {grade} • AI-Generated Problems</p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex gap-2 mb-6">
          {["easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => !loading && !result && setDifficulty(d)}
              className={`difficulty-btn ${d} ${difficulty === d ? "active" : ""}`}
              disabled={loading || result}
              data-testid={`difficulty-${d}-btn`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Problem Card */}
        <div className="problem-card p-6 sm:p-8" data-testid="problem-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="spinner mb-4"></div>
              <p className="text-muted-foreground">Generating a new problem...</p>
              <p className="text-sm text-muted-foreground mt-2">Our AI is crafting a unique question for you</p>
            </div>
          ) : problem ? (
            <>
              {/* XP Reward Badge */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  +{problem.xp_reward} XP
                </div>
              </div>

              {/* Question */}
              <div className="math-equation mb-8" data-testid="problem-question">
                {problem.question}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {problem.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !result && setSelectedAnswer(option)}
                    disabled={!!result}
                    className={`option-btn ${getOptionClass(option)}`}
                    data-testid={`option-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        result && option === result.correct_answer 
                          ? "bg-[#84CC16] text-black" 
                          : result && option === selectedAnswer && !result.correct
                          ? "bg-destructive text-white"
                          : selectedAnswer === option
                          ? "bg-primary text-white"
                          : "bg-muted"
                      }`}>
                        {result && option === result.correct_answer ? (
                          <Check className="w-5 h-5" />
                        ) : result && option === selectedAnswer && !result.correct ? (
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

              {/* Hint Section - Only show before answering */}
              {!result && problem.hint && (
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
                    <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 animate-slide-up" data-testid="hint-text">
                      <div className="flex items-center gap-2 text-secondary font-medium mb-2">
                        <Lightbulb className="w-4 h-4" />
                        Hint
                      </div>
                      <p className="text-muted-foreground">{problem.hint}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!result ? (
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
                    result.correct 
                      ? "bg-[#84CC16]/20 border border-[#84CC16]/30" 
                      : "bg-destructive/20 border border-destructive/30"
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      result.correct ? "bg-[#84CC16]" : "bg-destructive"
                    }`}>
                      {result.correct ? (
                        <Check className="w-6 h-6 text-black" />
                      ) : (
                        <X className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        {result.correct ? "Correct!" : "Not quite..."}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.correct 
                          ? `You earned ${result.xp_earned} XP!` 
                          : `The correct answer was ${result.correct_answer}`
                        }
                      </div>
                    </div>
                  </div>

                  {/* Explanation Toggle */}
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                    data-testid="show-explanation-btn"
                  >
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 text-secondary" />
                      <span className="font-medium">View Explanation</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${showExplanation ? "rotate-90" : ""}`} />
                  </button>

                  {/* Explanation */}
                  {showExplanation && (
                    <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 animate-slide-up" data-testid="explanation-text">
                      <p className="text-muted-foreground leading-relaxed">
                        {result.explanation}
                      </p>
                    </div>
                  )}

                  {/* Next Problem Button */}
                  <Button
                    onClick={handleNextProblem}
                    className="w-full btn-secondary py-6 text-lg glow-secondary"
                    data-testid="next-problem-btn"
                  >
                    <span className="flex items-center gap-2">
                      Next Problem
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Failed to load problem</p>
              <Button onClick={generateProblem} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Level Up Modal */}
        {levelUp && (
          <div 
            className="level-up-celebration" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setLevelUp(false);
            }}
            data-testid="level-up-modal"
          >
            <div className="glass p-8 rounded-3xl text-center max-w-sm mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 gradient-text">Level Up!</h2>
              <p className="text-muted-foreground mb-4">
                You've reached Level {result?.new_level}!
              </p>
              <Button className="btn-primary" onClick={() => setLevelUp(false)} data-testid="dismiss-level-up-btn">
                Awesome!
              </Button>
            </div>
          </div>
        )}

        {/* New Badge Modal */}
        {newBadges.length > 0 && !levelUp && (
          <div 
            className="level-up-celebration" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setNewBadges([]);
            }}
            data-testid="new-badge-modal"
          >
            <div className="glass p-8 rounded-3xl text-center max-w-sm mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 gradient-text">New Badge!</h2>
              <p className="text-muted-foreground mb-4">
                You've earned: {newBadges.map(b => b.replace(/_/g, ' ')).join(', ')}
              </p>
              <Button className="btn-primary" onClick={() => setNewBadges([])} data-testid="dismiss-badge-btn">
                <Sparkles className="w-4 h-4 mr-2" />
                Sweet!
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-primary">{streak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-secondary">{problem?.xp_reward || 0}</div>
            <div className="text-xs text-muted-foreground">XP Available</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-accent capitalize">{difficulty}</div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PracticePage;
