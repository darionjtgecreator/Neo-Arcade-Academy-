import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { 
  Target, Star, TrendingUp, Award, ChevronRight,
  BookOpen, Zap, Lock, CheckCircle
} from "lucide-react";

const MasteryPage = () => {
  const { token } = useAuth();
  const [mastery, setMastery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masteryRes, adaptiveRes] = await Promise.all([
          axios.get(`${API}/mastery`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/adaptive-difficulty`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setMastery(masteryRes.data);
        setAdaptiveDifficulty(adaptiveRes.data);
      } catch (error) {
        console.error("Failed to fetch mastery data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const getMasteryColor = (level) => {
    switch (level) {
      case "Master": return "from-yellow-500 to-amber-600";
      case "Advanced": return "from-purple-500 to-violet-600";
      case "Intermediate": return "from-blue-500 to-cyan-600";
      case "Beginner": return "from-green-500 to-emerald-600";
      case "Novice": return "from-gray-500 to-gray-600";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getMasteryIcon = (level) => {
    switch (level) {
      case "Master": return <Award className="w-5 h-5" />;
      case "Advanced": return <Star className="w-5 h-5" />;
      case "Intermediate": return <TrendingUp className="w-5 h-5" />;
      case "Beginner": return <BookOpen className="w-5 h-5" />;
      default: return <Lock className="w-5 h-5" />;
    }
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

  const masteredTopics = mastery.filter(m => m.mastery_level === "Master").length;
  const advancedTopics = mastery.filter(m => m.mastery_level === "Advanced").length;
  const startedTopics = mastery.filter(m => m.completed > 0).length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="mastery-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Topic <span className="gradient-text">Mastery</span>
          </h1>
          <p className="text-muted-foreground">
            Track your progress and mastery level for each math topic.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Topics Started</span>
            </div>
            <div className="text-2xl font-bold">{startedTopics}</div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Advanced</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">{advancedTopics}</div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Mastered</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{masteredTopics}</div>
          </div>

          {adaptiveDifficulty && (
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Recommended</span>
              </div>
              <div className="text-2xl font-bold capitalize text-secondary">
                {adaptiveDifficulty.recommended_difficulty}
              </div>
            </div>
          )}
        </div>

        {/* Adaptive Difficulty Card */}
        {adaptiveDifficulty && adaptiveDifficulty.recent_problems > 0 && (
          <div className="card-game p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Adaptive Difficulty</h3>
                <p className="text-muted-foreground text-sm mb-3">{adaptiveDifficulty.reason}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Recent Accuracy: <span className="font-bold">{adaptiveDifficulty.recent_accuracy}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Based on {adaptiveDifficulty.recent_problems} problems
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mastery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mastery.map((topic) => (
            <div 
              key={topic.topic_id}
              className="card-game p-5 hover-lift"
              data-testid={`mastery-${topic.topic_id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{topic.topic_name}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getMasteryColor(topic.mastery_level)} text-white`}>
                    {getMasteryIcon(topic.mastery_level)}
                    {topic.mastery_level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{Math.round(topic.mastery_percent)}%</div>
                  <div className="text-xs text-muted-foreground">Mastery</div>
                </div>
              </div>

              <div className="mb-4">
                <Progress value={topic.mastery_percent} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{topic.completed} solved</span>
                  <span>{topic.accuracy}% accuracy</span>
                </div>
                {topic.completed > 0 && (
                  <Link 
                    to={`/practice/5/${topic.topic_id}`}
                    className="flex items-center gap-1 text-primary font-medium hover:underline"
                  >
                    Practice
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {topic.completed < topic.next_milestone && (
                <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  Next milestone: {topic.next_milestone} problems ({topic.next_milestone - topic.completed} to go)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mastery Levels Legend */}
        <div className="mt-8 glass p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">Mastery Levels</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { level: "Novice", desc: "Just starting", percent: "0-15%", color: "bg-gray-500" },
              { level: "Beginner", desc: "Learning basics", percent: "15-40%", color: "bg-green-500" },
              { level: "Intermediate", desc: "Good progress", percent: "40-70%", color: "bg-blue-500" },
              { level: "Advanced", desc: "Strong skills", percent: "70-90%", color: "bg-purple-500" },
              { level: "Master", desc: "Expert level", percent: "90-100%", color: "bg-yellow-500" }
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                <div>
                  <div className="font-medium text-sm">{item.level}</div>
                  <div className="text-xs text-muted-foreground">{item.percent}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MasteryPage;
