import { useState } from "react";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import axios from "axios";
import { toast } from "sonner";
import { 
  User, Mail, Calendar, Zap, Star, Target, 
  Flame, Trophy, Medal, BookOpen, Save, Edit2
} from "lucide-react";

const ProfilePage = () => {
  const { user, token, refreshUser } = useAuth();
  const [currentGrade, setCurrentGrade] = useState(user?.current_grade || 5);
  const [saving, setSaving] = useState(false);

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

  const handleSaveGrade = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/user/grade?grade=${currentGrade}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Current grade updated!");
      refreshUser();
    } catch (error) {
      console.error("Failed to update grade:", error);
      toast.error("Failed to update grade");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const accuracy = user?.completed_problems > 0 
    ? Math.round((user.correct_answers / user.completed_problems) * 100) 
    : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="profile-page">
        {/* Profile Header */}
        <div className="card-game p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-1">{user?.username}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(user?.created_at)}
                </span>
              </div>
            </div>

            {/* Level Badge */}
            <div className="text-center">
              <div className="level-badge text-2xl w-16 h-16 mb-2">
                {user?.level || 1}
              </div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Level {(user?.level || 1) + 1}</span>
              <span className="font-medium xp-counter">{currentLevelXP()} / {xpForNextLevel(user?.level || 1)} XP</span>
            </div>
            <Progress value={progressPercent()} className="h-3" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-secondary" />
              <span className="text-sm text-muted-foreground">Total XP</span>
            </div>
            <div className="text-2xl font-bold xp-counter">{user?.xp || 0}</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Problems Solved</span>
            </div>
            <div className="text-2xl font-bold">{user?.completed_problems || 0}</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>
            <div className="text-2xl font-bold">{accuracy}%</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Current Streak</span>
            </div>
            <div className="text-2xl font-bold">{user?.streak || 0}</div>
          </div>
        </div>

        {/* Settings */}
        <div className="card-game p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Learning Settings
          </h2>

          <div className="space-y-4">
            {/* Current Grade Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Grade Level
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                This helps us recommend appropriate difficulty levels for you.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setCurrentGrade(grade)}
                    className={`grade-btn ${currentGrade === grade ? "active" : ""}`}
                    data-testid={`grade-select-${grade}`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              
              {currentGrade !== user?.current_grade && (
                <Button
                  onClick={handleSaveGrade}
                  disabled={saving}
                  className="btn-primary"
                  data-testid="save-grade-btn"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Badges Summary */}
        <div className="card-game p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Medal className="w-5 h-5 text-accent" />
              Badges Earned
            </h2>
            <span className="text-2xl font-bold text-primary">
              {user?.badges?.length || 0}
            </span>
          </div>

          {user?.badges && user.badges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-sm font-medium"
                >
                  {badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No badges earned yet. Start solving problems to earn your first badge!
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
