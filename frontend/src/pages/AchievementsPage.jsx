import { useState, useEffect } from "react";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { 
  Award, Star, Flame, Target, Brain, Trophy, 
  CheckCircle, Crown, Wand, Zap, Footprints,
  Triangle, Infinity, Lock, Medal, Sparkles,
  GraduationCap, Crosshair, Building, Mountain,
  Dumbbell, Shield, Variable, Ruler, FileText,
  BarChart, PieChart, Moon, Sun, Calendar,
  Compass, Layers
} from "lucide-react";

const AchievementsPage = () => {
  const { token } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await axios.get(`${API}/badges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBadges(response.data);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [token]);

  const badgeIcons = {
    first_step: Footprints,
    problems_10: Target,
    problems_50: Brain,
    problems_100: Trophy,
    problems_500: Medal,
    streak_3: Flame,
    streak_5: Zap,
    streak_10: Crown,
    streak_25: Sparkles,
    level_5: Star,
    level_10: Wand,
    level_20: GraduationCap,
    accuracy_80: CheckCircle,
    accuracy_90: Target,
    accuracy_95: Crosshair,
    easy_master: Building,
    medium_master: Mountain,
    hard_master: Dumbbell,
    hard_streak_5: Shield,
    geometry_master: Triangle,
    algebra_master: Variable,
    calculus_master: Infinity,
    trigonometry_master: Ruler,
    word_problems_master: FileText,
    statistics_master: BarChart,
    fractions_master: PieChart,
    grade_1_complete: Award,
    grade_5_complete: Award,
    grade_12_complete: GraduationCap,
    night_owl: Moon,
    early_bird: Sun,
    weekend_warrior: Calendar,
    topic_explorer: Compass,
    grade_hopper: Layers,
    // Daily challenge badges
    daily_first: Calendar,
    daily_10: Calendar,
    daily_50: Calendar,
    daily_streak_3: Flame,
    daily_streak_7: Flame,
    daily_streak_30: Trophy
  };

  const categoryColors = {
    milestone: "from-green-500 to-emerald-600",
    streak: "from-orange-500 to-amber-600",
    level: "from-blue-500 to-cyan-600",
    accuracy: "from-lime-500 to-green-600",
    difficulty: "from-red-500 to-rose-600",
    topic: "from-purple-500 to-violet-600",
    grade: "from-indigo-500 to-blue-600",
    special: "from-pink-500 to-fuchsia-600",
    daily: "from-yellow-500 to-orange-600"
  };

  const categoryNames = {
    milestone: "Milestones",
    streak: "Streaks",
    level: "Levels",
    accuracy: "Accuracy",
    difficulty: "Difficulty",
    topic: "Topic Mastery",
    grade: "Grade Completion",
    special: "Special",
    daily: "Daily Challenges"
  };

  const categories = ["all", ...Object.keys(categoryNames)];

  const filteredBadges = activeCategory === "all" 
    ? badges 
    : badges.filter(b => b.category === activeCategory);

  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="achievements-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Your <span className="gradient-text">Achievements</span>
          </h1>
          <p className="text-muted-foreground">
            Complete challenges to unlock badges and show off your math skills.
          </p>
        </div>

        {/* Progress Card */}
        <div className="card-game p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Badge Collection</h2>
              <p className="text-muted-foreground">
                {earnedCount} of {totalCount} badges earned
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{earnedCount}</span>
            </div>
          </div>
          
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`category-${category}`}
            >
              {category === "all" ? "All Badges" : categoryNames[category]}
              {category !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({badges.filter(b => b.category === category && b.earned).length}/
                  {badges.filter(b => b.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const Icon = badgeIcons[badge.id] || Award;
            const gradient = categoryColors[badge.category] || "from-primary to-secondary";
            
            return (
              <div
                key={badge.id}
                className={`card-game p-6 relative overflow-hidden ${
                  badge.earned ? "badge-earned" : "badge-locked"
                }`}
                data-testid={`badge-${badge.id}`}
              >
                {/* Background Glow for Earned Badges */}
                {badge.earned && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
                )}
                
                <div className="relative z-10">
                  {/* Badge Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 mx-auto ${
                    badge.earned ? "shadow-lg animate-pulse-glow" : "grayscale opacity-50"
                  }`}>
                    {badge.earned ? (
                      <Icon className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-8 h-8 text-white/50" />
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground capitalize">
                      {categoryNames[badge.category] || badge.category}
                    </div>
                  </div>

                  {/* Earned Status */}
                  {badge.earned && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[#84CC16] text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Earned!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">No badges in this category</h3>
            <p className="text-muted-foreground">
              Try selecting a different category.
            </p>
          </div>
        )}

        {/* Motivation Section */}
        <div className="mt-12 glass p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
              <p className="text-muted-foreground">
                {earnedCount === 0 
                  ? "Start solving problems to earn your first badge! Every journey begins with a single step."
                  : earnedCount < 5
                  ? "You're making great progress! Keep solving problems to unlock more badges."
                  : earnedCount < 15
                  ? "Impressive collection! You're becoming a true math champion."
                  : earnedCount < 25
                  ? "Amazing progress! You're well on your way to becoming a badge master."
                  : "Incredible! You're a badge collector extraordinaire. Keep pushing your limits!"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AchievementsPage;
