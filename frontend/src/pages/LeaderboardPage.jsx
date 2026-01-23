import { useState, useEffect } from "react";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import axios from "axios";
import { Trophy, Medal, Award, Crown, Star, Zap } from "lucide-react";

const LeaderboardPage = () => {
  const { user, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-orange-600/20 to-amber-600/10 border-orange-600/30";
      default:
        return "bg-card border-border/50";
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="leaderboard-page">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">
            Top math champions ranked by XP
          </p>
        </div>

        {/* Top 3 Podium (Desktop) */}
        {leaderboard.length >= 3 && (
          <div className="hidden md:flex justify-center items-end gap-4 mb-12">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <div className="glass p-4 rounded-2xl text-center w-40">
                <div className="font-bold truncate">{leaderboard[1]?.username}</div>
                <div className="text-sm text-muted-foreground">Level {leaderboard[1]?.level}</div>
                <div className="text-secondary font-bold mt-1">{leaderboard[1]?.xp} XP</div>
              </div>
              <div className="w-32 h-24 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg mt-2"></div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8">
              <Crown className="w-10 h-10 text-yellow-500 mb-2 animate-float" />
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mb-2 shadow-lg glow-primary">
                <span className="text-4xl font-bold text-white">1</span>
              </div>
              <div className="glass p-4 rounded-2xl text-center w-44">
                <div className="font-bold truncate text-lg">{leaderboard[0]?.username}</div>
                <div className="text-sm text-muted-foreground">Level {leaderboard[0]?.level}</div>
                <div className="text-secondary font-bold text-lg mt-1">{leaderboard[0]?.xp} XP</div>
              </div>
              <div className="w-36 h-32 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg mt-2"></div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <div className="glass p-4 rounded-2xl text-center w-40">
                <div className="font-bold truncate">{leaderboard[2]?.username}</div>
                <div className="text-sm text-muted-foreground">Level {leaderboard[2]?.level}</div>
                <div className="text-secondary font-bold mt-1">{leaderboard[2]?.xp} XP</div>
              </div>
              <div className="w-32 h-16 bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-lg mt-2"></div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.username === user?.username;
            
            return (
              <div
                key={index}
                className={`leaderboard-row ${getRankBg(entry.rank)} border ${
                  isCurrentUser ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                }`}
                data-testid={`leaderboard-row-${entry.rank}`}
              >
                {/* Rank */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Level {entry.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Medal className="w-3 h-3" />
                      {entry.badges_count} badges
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-secondary" />
                  <span className="text-lg font-bold xp-counter">{entry.xp}</span>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">No Players Yet</h3>
            <p className="text-muted-foreground">
              Be the first to make it to the leaderboard by earning XP!
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 glass p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">How Rankings Work</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-secondary mt-1" />
              <div>
                <div className="font-medium">Earn XP</div>
                <div className="text-sm text-muted-foreground">
                  Solve problems correctly to gain experience points
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-primary mt-1" />
              <div>
                <div className="font-medium">Level Up</div>
                <div className="text-sm text-muted-foreground">
                  Accumulate XP to increase your level
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <div className="font-medium">Climb Ranks</div>
                <div className="text-sm text-muted-foreground">
                  Higher XP means higher rank on the leaderboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
