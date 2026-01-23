import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import axios from "axios";
import { 
  ChevronRight, ChevronLeft, Calculator, Shapes, 
  FileText, TrendingUp, Divide, Percent, Variable,
  Triangle, PieChart, Sigma, Infinity, BarChart
} from "lucide-react";

const TopicSelectPage = () => {
  const { grade } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(`${API}/topics/${grade}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopics(response.data);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [grade, token]);

  const topicIcons = {
    counting: Calculator,
    addition: Calculator,
    subtraction: Calculator,
    basic_multiplication: Calculator,
    multiplication: Calculator,
    division: Divide,
    fractions_intro: PieChart,
    fractions: PieChart,
    decimals: Percent,
    geometry_basics: Shapes,
    geometry: Shapes,
    ratios: Percent,
    percentages: Percent,
    algebra_intro: Variable,
    algebra: Variable,
    statistics: BarChart,
    linear_equations: TrendingUp,
    quadratics: TrendingUp,
    trigonometry: Triangle,
    pre_calculus: Sigma,
    calculus: Infinity,
    word_problems: FileText
  };

  const topicColors = {
    counting: "from-green-500 to-emerald-600",
    addition: "from-blue-500 to-cyan-600",
    subtraction: "from-purple-500 to-violet-600",
    basic_multiplication: "from-orange-500 to-amber-600",
    multiplication: "from-orange-500 to-amber-600",
    division: "from-red-500 to-rose-600",
    fractions_intro: "from-pink-500 to-fuchsia-600",
    fractions: "from-pink-500 to-fuchsia-600",
    decimals: "from-teal-500 to-cyan-600",
    geometry_basics: "from-indigo-500 to-blue-600",
    geometry: "from-indigo-500 to-blue-600",
    ratios: "from-yellow-500 to-orange-600",
    percentages: "from-lime-500 to-green-600",
    algebra_intro: "from-violet-500 to-purple-600",
    algebra: "from-violet-500 to-purple-600",
    statistics: "from-sky-500 to-blue-600",
    linear_equations: "from-emerald-500 to-teal-600",
    quadratics: "from-rose-500 to-pink-600",
    trigonometry: "from-amber-500 to-orange-600",
    pre_calculus: "from-fuchsia-500 to-purple-600",
    calculus: "from-red-500 to-rose-600",
    word_problems: "from-cyan-500 to-blue-600"
  };

  const topicDescriptions = {
    counting: "Count objects and understand number sequences",
    addition: "Add numbers together to find sums",
    subtraction: "Subtract numbers to find differences",
    basic_multiplication: "Learn the basics of multiplying numbers",
    multiplication: "Multiply larger numbers and understand products",
    division: "Divide numbers and understand quotients",
    fractions_intro: "Introduction to parts of a whole",
    fractions: "Work with fractions, add, subtract, and multiply",
    decimals: "Understand decimal numbers and operations",
    geometry_basics: "Learn about shapes and their properties",
    geometry: "Explore angles, areas, perimeters, and volumes",
    ratios: "Compare quantities using ratios",
    percentages: "Calculate percentages and conversions",
    algebra_intro: "Introduction to variables and simple equations",
    algebra: "Solve equations and work with expressions",
    statistics: "Analyze data, find mean, median, and mode",
    linear_equations: "Graph and solve linear equations",
    quadratics: "Work with quadratic equations and parabolas",
    trigonometry: "Explore sine, cosine, tangent and triangles",
    pre_calculus: "Prepare for calculus with advanced functions",
    calculus: "Learn derivatives, integrals, and limits",
    word_problems: "Apply math skills to real-world scenarios"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/grades")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            data-testid="back-to-grades-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Grades
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Grade {grade} <span className="gradient-text">Topics</span>
          </h1>
          <p className="text-muted-foreground">
            Choose a topic to start practicing. AI will generate unique problems for you.
          </p>
        </div>

        {/* Topics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => {
            const Icon = topicIcons[topic.id] || Calculator;
            const gradient = topicColors[topic.id] || "from-primary to-secondary";
            const description = topicDescriptions[topic.id] || "Practice this topic";
            
            return (
              <Link
                key={topic.id}
                to={`/practice/${grade}/${topic.id}`}
                className="group"
                data-testid={`topic-${topic.id}-card`}
              >
                <div className="topic-card h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1">{topic.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Grade {grade} Level
                    </span>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Practice</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Difficulty Info */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#84CC16]"></div>
              <span className="font-medium">Easy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Basic problems to build confidence. +10-20 XP per correct answer.
            </p>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
              <span className="font-medium">Medium</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Moderate challenge with multi-step problems. +20-30 XP per correct answer.
            </p>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
              <span className="font-medium">Hard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Complex problems for advanced learners. +30-50 XP per correct answer.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TopicSelectPage;
