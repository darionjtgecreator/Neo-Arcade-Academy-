import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import axios from "axios";
import { ChevronRight, BookOpen, Star, Lock } from "lucide-react";

const GradeSelectPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get(`${API}/grades`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGrades(response.data);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [token]);

  const gradeColors = [
    "from-green-500 to-emerald-600",    // Grade 1
    "from-green-400 to-teal-500",       // Grade 2
    "from-teal-400 to-cyan-500",        // Grade 3
    "from-cyan-400 to-blue-500",        // Grade 4
    "from-blue-400 to-indigo-500",      // Grade 5
    "from-indigo-400 to-violet-500",    // Grade 6
    "from-violet-400 to-purple-500",    // Grade 7
    "from-purple-400 to-fuchsia-500",   // Grade 8
    "from-fuchsia-400 to-pink-500",     // Grade 9
    "from-pink-400 to-rose-500",        // Grade 10
    "from-rose-400 to-red-500",         // Grade 11
    "from-red-400 to-orange-500",       // Grade 12
  ];

  const gradeDescriptions = [
    "Counting & Basic Addition",
    "Addition & Subtraction",
    "Multiplication Basics",
    "Fractions & Decimals",
    "Advanced Fractions",
    "Ratios & Percentages",
    "Intro to Algebra",
    "Linear Equations",
    "Quadratic Equations",
    "Trigonometry",
    "Pre-Calculus",
    "Calculus & Statistics"
  ];

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Select Your <span className="gradient-text">Grade Level</span>
          </h1>
          <p className="text-muted-foreground">
            Choose a grade to see available math topics and start practicing.
          </p>
        </div>

        {/* Grade Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {grades.map((grade, index) => (
            <Link
              key={grade.grade}
              to={`/topics/${grade.grade}`}
              className="group"
              data-testid={`grade-${grade.grade}-card`}
            >
              <div className="card-game p-6 h-full hover-lift relative overflow-hidden">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradeColors[index]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  {/* Grade Number */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColors[index]} flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="text-2xl font-bold text-white">{grade.grade}</span>
                  </div>

                  {/* Grade Info */}
                  <h3 className="text-xl font-bold mb-1">{grade.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {gradeDescriptions[index]}
                  </p>

                  {/* Topics Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {grade.topics.slice(0, 3).map((topic) => (
                      <span 
                        key={topic.id}
                        className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium"
                      >
                        {topic.name}
                      </span>
                    ))}
                    {grade.topics.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        +{grade.topics.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Start Learning</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 glass p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">How It Works</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Select any grade level — start where you're comfortable
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Choose a topic (Geometry, Word Problems, Calculus, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  AI generates unique problems tailored to your level
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Earn XP and badges as you solve problems correctly
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GradeSelectPage;
