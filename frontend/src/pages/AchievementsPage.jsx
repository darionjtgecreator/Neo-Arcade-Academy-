import { useState, useEffect } from "react";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import axios from "axios";
import { 
  Award, Star, Flame, Target, Brain, Trophy, 
  CheckCircle, Crown, Wand, Zap, Footprints,
  Triangle, Infinity, Lock
} from "lucide-react";

const AchievementsPage = () => {
  const { token } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

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
    streak_3: Flame,
    streak_5: Zap,
    streak_10: Crown,
    level_5: Star,
    level_10: Wand,
    problems_10: Target,
    problems_50: Brain,
    problems_100: Trophy,
    accuracy_80: CheckCircle,
    geometry_master: Triangle,
    calculus_master: Infinity
  };

  const badgeColors = {
    first_step: "from-green-500 to-emerald-600",
    streak_3: "from-orange-500 to-amber-600",
    streak_5: "from-yellow-500 to-orange-600",
    streak_10: "from-amber-500 to-yellow-600",
    level_5: "from-blue-500 to-cyan-600",
    level_10: "from-purple-500 to-violet-600",
    problems_10: "from-teal-500 to-cyan-600",
    problems_50: "from-pink-500 to-fuchsia-600",
    problems_100: "from-rose-500 to-red-600",
    accuracy_80: "from-lime-500 to-green-600",
    geometry_master: "from-indigo-500 to-blue-600",
    calculus_master: "from-fuchsia-500 to-purple-600"
  };

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
          
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const Icon = badgeIcons[badge.id] || Award;
            const gradient = badgeColors[badge.id] || "from-primary to-secondary";
            
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
                  : earnedCount < 10
                  ? "Impressive collection! You're becoming a true math champion."
                  : "Amazing! You're a badge collector extraordinaire. Keep pushing your limits!"
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
