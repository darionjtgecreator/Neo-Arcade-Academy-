import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  Zap, Trophy, Target, Brain, Sparkles, 
  ChevronRight, Star, Flame, Award, BookOpen 
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Problems",
      description: "Smart questions that adapt to your skill level",
      color: "text-primary"
    },
    {
      icon: Trophy,
      title: "Earn Badges",
      description: "Collect achievements as you master new topics",
      color: "text-secondary"
    },
    {
      icon: Flame,
      title: "Build Streaks",
      description: "Keep your streak alive and earn bonus XP",
      color: "text-accent"
    },
    {
      icon: Target,
      title: "Track Progress",
      description: "See your improvement across all grades",
      color: "text-[#84CC16]"
    }
  ];

  const grades = [
    { range: "1-4", label: "Elementary", topics: "Addition, Subtraction, Basic Geometry" },
    { range: "5-8", label: "Middle School", topics: "Algebra, Fractions, Word Problems" },
    { range: "9-12", label: "High School", topics: "Trigonometry, Calculus, Statistics" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl gradient-text">Neo-Arcade Academy</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold" data-testid="login-nav-btn">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-primary" data-testid="signup-nav-btn">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section pt-32 pb-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Powered by GPT-5.2</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Master Math<br />
                <span className="gradient-text">Like a Game</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                From counting to calculus — learn math through AI-generated challenges, 
                earn XP, unlock badges, and climb the leaderboard. Perfect for grades 1-12.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button className="btn-primary text-lg px-8 py-6 glow-primary" data-testid="get-started-btn">
                    Start Learning Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="text-lg px-8 py-6 rounded-full border-2" data-testid="already-account-btn">
                    I Have an Account
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold gradient-text">12</div>
                  <div className="text-sm text-muted-foreground">Grade Levels</div>
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">20+</div>
                  <div className="text-sm text-muted-foreground">Math Topics</div>
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">Unlimited</div>
                  <div className="text-sm text-muted-foreground">AI Problems</div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Visual */}
            <div className="relative hidden lg:block">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1631947430066-48c30d57b943?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
                  alt="Student learning math"
                  className="rounded-3xl shadow-2xl border border-border/50"
                />
                
                {/* Floating Cards */}
                <div className="absolute -left-8 top-8 glass p-4 rounded-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Badge Earned!</div>
                      <div className="text-xs text-muted-foreground">Math Master</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-4 bottom-12 glass p-4 rounded-2xl animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold xp-counter">+50 XP</div>
                      <div className="text-xs text-muted-foreground">Problem Solved</div>
                    </div>
                  </div>
                </div>

                <div className="absolute right-8 -top-4 glass p-3 rounded-xl animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="streak-flame">
                    <Flame className="w-4 h-4" />
                    5 Day Streak!
                  </div>
                </div>
              </div>
              
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Why Students <span className="gradient-text">Love Us</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Learning math shouldn't be boring. We've gamified the entire experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="card-game p-6 hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grade Levels Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              All <span className="gradient-text">12 Grades</span> Covered
            </h2>
            <p className="text-muted-foreground text-lg">
              From basic counting to advanced calculus — we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {grades.map((grade, index) => (
              <div key={index} className="topic-card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold gradient-text">{grade.range}</div>
                  <div>
                    <div className="font-bold text-lg">{grade.label}</div>
                    <div className="text-sm text-muted-foreground">Grades</div>
                  </div>
                </div>
                <p className="text-muted-foreground">{grade.topics}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
            <div className="relative z-10">
              <Star className="w-16 h-16 text-secondary mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Ready to Level Up Your Math?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of students mastering math the fun way.
              </p>
              <Link to="/register">
                <Button className="btn-primary text-lg px-10 py-6 glow-primary" data-testid="cta-signup-btn">
                  Create Free Account
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <span className="font-bold">Neo-Arcade Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Neo-Arcade Academy. Making math fun for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
