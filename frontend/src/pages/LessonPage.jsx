import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import axios from "axios";
import { 
  ChevronLeft, ChevronRight, BookOpen, Lightbulb, 
  Target, Star, CheckCircle, Play
} from "lucide-react";

const LessonPage = () => {
  const { grade, topic } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`${API}/lessons/${grade}/${topic}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLesson(response.data);
      } catch (error) {
        console.error("Failed to fetch lesson:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [grade, topic, token]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "concepts", label: "Key Concepts", icon: Lightbulb },
    { id: "examples", label: "Examples", icon: Target },
    { id: "tips", label: "Tips", icon: Star }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="lesson-page">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/topics/${grade}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            data-testid="back-to-topics-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Topics
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="gradient-text">{lesson.topic_name}</span>
              </h1>
              <p className="text-muted-foreground">Grade {grade} • Interactive Lesson</p>
            </div>
            
            <Link to={`/practice/${grade}/${topic}`}>
              <Button className="btn-primary glow-primary" data-testid="start-practice-btn">
                <Play className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card-game p-6 sm:p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="animate-slide-up" data-testid="overview-content">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Overview</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lesson.overview}
              </p>
              
              <div className="mt-8 flex gap-4">
                <Button 
                  onClick={() => setActiveTab("concepts")}
                  variant="outline"
                  className="rounded-full"
                >
                  View Key Concepts
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Key Concepts Tab */}
          {activeTab === "concepts" && (
            <div className="animate-slide-up" data-testid="concepts-content">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Key Concepts</h2>
              </div>
              
              <div className="space-y-6">
                {lesson.key_concepts.map((concept, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="font-bold text-primary">{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold">{concept.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-11">
                      {concept.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === "examples" && (
            <div className="animate-slide-up" data-testid="examples-content">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Examples</h2>
              </div>
              
              <div className="space-y-6">
                {lesson.examples.map((example, index) => (
                  <div 
                    key={index}
                    className="rounded-xl overflow-hidden border border-border/50"
                  >
                    <div className="p-5 bg-muted/50">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Problem {index + 1}</div>
                      <p className="text-lg font-medium mono">{example.problem}</p>
                    </div>
                    <div className="p-5 bg-[#84CC16]/10 border-t border-[#84CC16]/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#84CC16] mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Solution
                      </div>
                      <p className="text-muted-foreground">{example.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === "tips" && (
            <div className="animate-slide-up" data-testid="tips-content">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Pro Tips</h2>
              </div>
              
              <div className="space-y-4">
                {lesson.tips.map((tip, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-muted-foreground pt-1">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 glass p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Ready to practice?</h3>
            <p className="text-muted-foreground">
              Apply what you've learned with AI-generated problems.
            </p>
          </div>
          <Link to={`/practice/${grade}/${topic}`}>
            <Button className="btn-secondary glow-secondary" data-testid="bottom-practice-btn">
              <Play className="w-4 h-4 mr-2" />
              Practice Now
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default LessonPage;
