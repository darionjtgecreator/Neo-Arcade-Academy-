import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { 
  History, CheckCircle, XCircle, Clock, Target, 
  TrendingUp, BarChart3, ChevronRight, RefreshCw
} from "lucide-react";

const HistoryPage = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, statsRes] = await Promise.all([
          axios.get(`${API}/history?limit=50`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/history/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setHistory(historyRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const topicNames = {
    counting: "Counting",
    addition: "Addition",
    subtraction: "Subtraction",
    multiplication: "Multiplication",
    division: "Division",
    fractions: "Fractions",
    decimals: "Decimals",
    geometry: "Geometry",
    algebra: "Algebra",
    trigonometry: "Trigonometry",
    calculus: "Calculus",
    word_problems: "Word Problems",
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="history-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Practice <span className="gradient-text">History</span>
          </h1>
          <p className="text-muted-foreground">
            Review your past problems and track your improvement over time.
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Problems</span>
              </div>
              <div className="text-2xl font-bold">{stats.total_problems}</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Correct</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{stats.correct_answers}</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{stats.accuracy}%</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Incorrect</span>
              </div>
              <div className="text-2xl font-bold text-red-500">
                {stats.total_problems - stats.correct_answers}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
              activeTab === "recent"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-recent"
          >
            <History className="w-4 h-4" />
            Recent Problems
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
              activeTab === "stats"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-stats"
          >
            <BarChart3 className="w-4 h-4" />
            Detailed Stats
          </button>
        </div>

        {/* Recent Problems Tab */}
        {activeTab === "recent" && (
          <div className="space-y-4" data-testid="recent-problems">
            {history.length > 0 ? (
              history.map((entry, index) => (
                <div 
                  key={entry.id}
                  className={`card-game p-4 sm:p-6 border-l-4 ${
                    entry.correct 
                      ? "border-l-green-500" 
                      : "border-l-red-500"
                  }`}
                  data-testid={`history-entry-${index}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {entry.correct ? (
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {topicNames[entry.topic] || entry.topic}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            Grade {entry.grade}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            entry.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                            entry.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {entry.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(entry.answered_at)}
                        </div>
                      </div>
                    </div>
                    {entry.correct && (
                      <div className="text-sm font-bold text-secondary">
                        +{entry.xp_earned} XP
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-13 pl-13">
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {entry.question}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={entry.correct ? "text-green-500" : "text-red-500"}>
                        Your answer: {entry.user_answer}
                      </span>
                      {!entry.correct && (
                        <span className="text-green-500">
                          Correct: {entry.correct_answer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-bold mb-2">No Practice History Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start solving problems to build your practice history!
                </p>
                <Link to="/grades">
                  <Button className="btn-primary">
                    Start Practicing
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Detailed Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="grid lg:grid-cols-2 gap-6" data-testid="detailed-stats">
            {/* Topic Stats */}
            <div className="card-game p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Performance by Topic
              </h3>
              
              {Object.keys(stats.topic_stats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.topic_stats).map(([topic, data]) => {
                    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                    return (
                      <div key={topic}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {topicNames[topic] || topic}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {data.correct}/{data.total} ({accuracy}%)
                          </span>
                        </div>
                        <Progress value={accuracy} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No topic data yet
                </p>
              )}
            </div>

            {/* Difficulty Stats */}
            <div className="card-game p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Performance by Difficulty
              </h3>
              
              <div className="space-y-4">
                {Object.entries(stats.difficulty_stats).map(([difficulty, data]) => {
                  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  const color = difficulty === 'easy' ? 'bg-green-500' : 
                               difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={difficulty}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm capitalize flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          {difficulty}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.correct}/{data.total} ({accuracy}%)
                        </span>
                      </div>
                      <Progress value={accuracy} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        {history.length > 0 && (
          <div className="mt-8 glass p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Keep improving!</h3>
              <p className="text-muted-foreground">
                Practice more to boost your accuracy and earn more XP.
              </p>
            </div>
            <Link to="/grades">
              <Button className="btn-primary glow-primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Practice More
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
