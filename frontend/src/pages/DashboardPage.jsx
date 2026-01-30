import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { 
  Zap, Trophy, Target, Flame, ChevronRight, 
  Medal, BookOpen, BarChart3, Star, Award, TrendingUp,
  Calendar, Gift, Clock
} from "lucide-react";

const DashboardPage = () => {
  const { user, token, refreshUser } = useAuth();
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressRes, leaderboardRes, dailyRes] = await Promise.all([
          axios.get(`${API}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/leaderboard`),
          axios.get(`${API}/daily-challenge`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
        ]);
        setProgress(progressRes.data);
        setLeaderboard(leaderboardRes.data.slice(0, 5));
        if (dailyRes) setDailyChallenge(dailyRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
      refreshUser();
    }
  }, [token, refreshUser]);

  const xpForNextLevel = (level) => {
    let xpNeeded = 100;
    for (let i = 1; i < level; i++) {
      xpNeeded = Math.floor(xpNeeded * 1.2);
    }
    return xpNeeded;
  };

  const currentLevelXP = () => {
    if (!user) return 0;
    let totalXP = 0;
    let xpNeeded = 100;
    for (let i = 1; i < user.level; i++) {
      totalXP += xpNeeded;
      xpNeeded = Math.floor(xpNeeded * 1.2);
    }
    return user.xp - totalXP;
  };

  const progressPercent = () => {
    if (!user) return 0;
    const current = currentLevelXP();
    const needed = xpForNextLevel(user.level);
    return Math.min((current / needed) * 100, 100);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="student-dashboard">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.username}</span>!
          </h1>
          <p className="text-muted-foreground">Ready to crush some math problems today?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <div className="card-game p-6 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                  <div className="text-2xl font-bold xp-counter">{user?.xp || 0}</div>
                </div>
              </div>
              <div className="level-badge text-lg">Lv {user?.level || 1}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Level {(user?.level || 1) + 1}</span>
                <span className="font-medium">{currentLevelXP()} / {xpForNextLevel(user?.level || 1)} XP</span>
              </div>
              <Progress value={progressPercent()} className="h-3" />
            </div>
          </div>

          {/* Streak Card */}
          <div className="card-game p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <div className="text-3xl font-bold">{user?.streak || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">correct in a row</div>
          </div>

          {/* Accuracy Card */}
          <div className="card-game p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-green-500" />
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>
            <div className="text-3xl font-bold">{progress?.accuracy || 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">{progress?.correct_answers || 0}/{progress?.total_problems || 0} correct</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Card */}
            {dailyChallenge && (
              <div className="card-game p-6 relative overflow-hidden border-2 border-yellow-500/30">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center animate-pulse-glow">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        Daily Challenge
                        {!dailyChallenge.completed && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">NEW</span>
                        )}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {dailyChallenge.completed 
                          ? `Completed! ${dailyChallenge.was_correct ? '✓ Correct' : '✗ Incorrect'}`
                          : `Earn ${dailyChallenge.xp_reward + dailyChallenge.bonus_xp} XP with bonus!`
                        }
                      </p>
                    </div>
                  </div>
                  <Link to="/daily-challenge">
                    <Button 
                      className={dailyChallenge.completed ? "btn-secondary" : "btn-primary glow-primary"}
                      data-testid="daily-challenge-btn"
                    >
                      {dailyChallenge.completed ? (
                        <span className="flex items-center gap-2">
                          View Results
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          Play Now
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Start */}
            <div className="card-game p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Start Practicing
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose a grade level and topic to begin your practice session.
              </p>
              <Link to="/grades">
                <Button className="btn-primary glow-primary" data-testid="start-practice-btn">
                  Choose Grade & Topic
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Recent Progress */}
            <div className="card-game p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Your Progress
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Grade Progress */}
                <div className="stat-card">
                  <div className="text-sm text-muted-foreground mb-2">Problems Solved</div>
                  <div className="text-2xl font-bold">{progress?.total_problems || 0}</div>
                  <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Keep going!
                  </div>
                </div>

                {/* Topics Progress */}
                <div className="stat-card">
                  <div className="text-sm text-muted-foreground mb-2">Badges Earned</div>
                  <div className="text-2xl font-bold">{progress?.badges?.length || 0}</div>
                  <Link to="/achievements" className="text-sm text-primary hover:underline">
                    View all badges →
                  </Link>
                </div>
              </div>

              {/* Topic Stats */}
              {progress?.topic_progress && Object.keys(progress.topic_progress).length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-medium mb-3">Topics Practiced</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(progress.topic_progress).map(([topic, data]) => (
                      <div 
                        key={topic}
                        className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                      >
                        {topic.replace(/_/g, ' ')}: {data.completed}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Leaderboard & Badges */}
          <div className="space-y-6">
            {/* Mini Leaderboard */}
            <div className="card-game p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Players
                </h2>
                <Link to="/leaderboard" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      entry.username === user?.username ? 'bg-primary/20 border border-primary/30' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-foreground'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entry.username}</div>
                      <div className="text-xs text-muted-foreground">Level {entry.level}</div>
                    </div>
                    <div className="text-sm font-bold xp-counter">{entry.xp} XP</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Preview */}
            <div className="card-game p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Medal className="w-5 h-5 text-accent" />
                  Recent Badges
                </h2>
                <Link to="/achievements" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              
              {progress?.badges && progress.badges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {progress.badges.slice(-4).map((badge, index) => (
                    <div 
                      key={index}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center glow-primary"
                    >
                      <Award className="w-7 h-7 text-primary" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Complete problems to earn badges!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
