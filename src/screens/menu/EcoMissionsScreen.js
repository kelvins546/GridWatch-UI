import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ADDED: For persistent timers
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// Helper to safely get local date string (YYYY-MM-DD)
const getLocalYYYYMMDD = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function EcoMissionsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // --- RPG LEVELING SYSTEM ---
  const [userLevel, setUserLevel] = useState(1);
  const [userExp, setUserExp] = useState(0);
  const expToNextLevel = 1000;

  const getRankName = (level) => {
    if (level < 5) return "Novice Saver";
    if (level < 15) return "Eco-Warrior";
    if (level < 30) return "Grid Master";
    return "Carbon Slayer";
  };

  const getRankIcon = (level) => {
    if (level < 5) return "seedling";
    if (level < 15) return "shield-alt";
    if (level < 30) return "chess-rook";
    return "crown";
  };

  // --- 7-DAY STREAK STATE ---
  const [currentStreak, setCurrentStreak] = useState(1);
  const [streakClaimedToday, setStreakClaimedToday] = useState(false);
  const streakRewards = [50, 50, 50, 100, 100, 150, 500];

  // --- LIMITED TIME EVENT (GACHA STYLE) ---
  const [flashTarget, setFlashTarget] = useState(null); // Now persistent!
  const [flashEvent, setFlashEvent] = useState({
    id: "evt1",
    title: "Earth Hour Challenge",
    desc: "Turn off ALL hub outlets for 1 hour straight tonight.",
    reward: 1000,
    exp: 500,
    icon: "globe-asia",
    color: "#9b59b6",
    progress: 0,
    target: 1,
    isClaimed: false,
    timeLeft: "Calculating...",
  });

  // --- QUEST DATABASES ---
  const [dailyQuests, setDailyQuests] = useState([
    {
      id: "dq1",
      title: "Early Riser",
      desc: "Manually turn off a device before 6:00 AM.",
      reward: 50,
      exp: 25,
      icon: "sun",
      color: "#f39c12",
      progress: 1,
      target: 1,
      isClaimed: false,
    },
    {
      id: "dq2",
      title: "Phantom Killer",
      desc: "Let Auto-Kill stop 2 devices from drawing standby power.",
      reward: 150,
      exp: 75,
      icon: "bolt",
      color: "#e74c3c",
      progress: 1,
      target: 2,
      isClaimed: false,
    },
    {
      id: "dq3",
      title: "Diagnostic Tech",
      desc: "Play 3 rounds of the Fault Scanner mini-game.",
      reward: 100,
      exp: 50,
      icon: "gamepad",
      color: "#3498db",
      progress: 3,
      target: 3,
      isClaimed: false,
    },
  ]);

  const [weeklyChallenges, setWeeklyChallenges] = useState([
    {
      id: "wc1",
      title: "Green Grid Champion",
      desc: "Keep total hub usage under 15kWh this week.",
      reward: 800,
      exp: 400,
      icon: "leaf",
      color: "#2ecc71",
      progress: 12.4,
      target: 15.0,
      isClaimed: false,
      isReverseLogic: true,
    },
    {
      id: "wc2",
      title: "High Roller",
      desc: "Spin the Golden Hub Box in the Eco-Store at least once.",
      reward: 500,
      exp: 250,
      icon: "box-open",
      color: "#f1c40f",
      progress: 0,
      target: 1,
      isClaimed: false,
    },
  ]);

  const [achievements, setAchievements] = useState([
    {
      id: "ac1",
      title: "Hardware Master",
      desc: "Add 3 physical devices to your GridWatch Hub.",
      reward: 1000,
      exp: 1000,
      icon: "microchip",
      color: "#3498db",
      progress: 3,
      target: 3,
      isClaimed: false,
    },
    {
      id: "ac2",
      title: "Safety First",
      desc: "Catch and resolve 5 real hardware faults.",
      reward: 2000,
      exp: 2000,
      icon: "shield-alt",
      color: "#e67e22",
      progress: 2,
      target: 5,
      isClaimed: false,
    },
  ]);

  const [timeLeft, setTimeLeft] = useState("Calculating...");

  // ==========================================
  // PERSISTENT FLASH EVENT TARGET INITIALIZATION
  // ==========================================
  useEffect(() => {
    const initFlashTarget = async () => {
      try {
        const savedTarget = await AsyncStorage.getItem("flash_event_target");
        const now = new Date().getTime();

        // If we have a saved target and it hasn't expired yet
        if (savedTarget && parseInt(savedTarget, 10) > now) {
          setFlashTarget(parseInt(savedTarget, 10));
        } else {
          // Timer expired or doesn't exist, create a fresh 8h 14m timer
          const newTarget = now + 8 * 3600000 + 14 * 60000;
          await AsyncStorage.setItem(
            "flash_event_target",
            newTarget.toString(),
          );
          setFlashTarget(newTarget);

          // Reset claim status on new event cycle
          setFlashEvent((prev) => ({ ...prev, isClaimed: false }));
        }
      } catch (e) {
        console.log("Error loading timer", e);
      }
    };
    initFlashTarget();
  }, []);

  // ==========================================
  // LIVE COUNTDOWN TIMER LOGIC
  // ==========================================
  useEffect(() => {
    if (!flashTarget) return; // Wait until target is loaded from storage

    const timerInterval = setInterval(() => {
      const now = new Date();

      // 1. Daily Quests Countdown (to midnight)
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Sets to 00:00:00 of the NEXT day
      const diffDaily = midnight.getTime() - now.getTime();

      if (diffDaily > 0) {
        const h = Math.floor((diffDaily / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diffDaily / 1000 / 60) % 60);
        const s = Math.floor((diffDaily / 1000) % 60);
        setTimeLeft(
          `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
        );
      } else {
        setTimeLeft("00h 00m 00s");
      }

      // 2. Flash Event Countdown (Persistent)
      const diffFlash = flashTarget - now.getTime();
      if (diffFlash > 0) {
        const fh = Math.floor((diffFlash / (1000 * 60 * 60)) % 24);
        const fm = Math.floor((diffFlash / 1000 / 60) % 60);
        const fs = Math.floor((diffFlash / 1000) % 60);
        setFlashEvent((prev) => ({
          ...prev,
          timeLeft: `${String(fh).padStart(2, "0")}h ${String(fm).padStart(2, "0")}m ${String(fs).padStart(2, "0")}s`,
        }));
      } else {
        setFlashEvent((prev) => ({ ...prev, timeLeft: "00h 00m 00s" }));
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [flashTarget]);

  // ==========================================
  // SUPABASE: FETCH REAL DATA ON LOAD
  // ==========================================
  useEffect(() => {
    if (!user) return;

    const loadGameData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "eco_coins, user_level, user_exp, claimed_missions, current_streak, last_streak_claim",
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setWalletBalance(data.eco_coins || 0);
          setUserLevel(data.user_level || 1);
          setUserExp(data.user_exp || 0);

          // === SMART STREAK LOGIC ===
          const todayStr = getLocalYYYYMMDD(new Date());

          let yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayStr = getLocalYYYYMMDD(yesterdayDate);

          let calculatedStreak = 1;
          let claimedToday = false;

          if (data.last_streak_claim) {
            const lastClaimStr = getLocalYYYYMMDD(
              new Date(data.last_streak_claim),
            );
            const dbStreak = data.current_streak || 1;

            if (lastClaimStr === todayStr) {
              // Already claimed today
              calculatedStreak = dbStreak;
              claimedToday = true;
            } else if (lastClaimStr === yesterdayStr) {
              // Consecutive day! Logged in yesterday but hasn't claimed today yet
              calculatedStreak = dbStreak + 1;
              if (calculatedStreak > 7) {
                calculatedStreak = 1; // Loop back to Day 1 after completing a 7-day chest
              }
            } else {
              // Missed a day (or more)
              calculatedStreak = 1;
            }
          }

          setCurrentStreak(calculatedStreak);
          setStreakClaimedToday(claimedToday);
          // ==========================

          // Mark missions as claimed if they exist in the DB
          if (data.claimed_missions && Array.isArray(data.claimed_missions)) {
            const markClaimed = (arr) =>
              arr.map((item) =>
                data.claimed_missions.includes(item.id)
                  ? { ...item, isClaimed: true }
                  : item,
              );

            setDailyQuests(markClaimed(dailyQuests));
            setWeeklyChallenges(markClaimed(weeklyChallenges));
            setAchievements(markClaimed(achievements));

            if (data.claimed_missions.includes(flashEvent.id)) {
              setFlashEvent((prev) => ({ ...prev, isClaimed: true }));
            }
          }
        }
      } catch (err) {
        console.log("Error loading game data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGameData();
  }, [user]);

  // ==========================================
  // SUPABASE: SYNC EXP, COINS & MISSIONS
  // ==========================================
  const syncToDatabase = async (
    newCoins,
    newLevel,
    newExp,
    missionId = null,
  ) => {
    if (!user) return;
    try {
      const updates = {
        eco_coins: newCoins,
        user_level: newLevel,
        user_exp: newExp,
      };

      if (missionId) {
        const { data } = await supabase
          .from("users")
          .select("claimed_missions")
          .eq("id", user.id)
          .single();
        const currentMissions = data?.claimed_missions || [];
        if (!currentMissions.includes(missionId)) {
          updates.claimed_missions = [...currentMissions, missionId];
        }
      }

      await supabase.from("users").update(updates).eq("id", user.id);
    } catch (e) {
      console.log("DB Sync Error:", e);
    }
  };

  const handleGainExpAndSync = (expGained, rewardGained, missionId) => {
    let newCoins = walletBalance + rewardGained;
    let newExp = userExp + expGained;
    let newLevel = userLevel;

    if (newExp >= expToNextLevel) {
      newLevel = userLevel + 1;
      newExp = newExp - expToNextLevel;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setWalletBalance(newCoins);
    setUserLevel(newLevel);
    setUserExp(newExp);

    syncToDatabase(newCoins, newLevel, newExp, missionId);
  };

  const handleClaim = (category, id, reward, exp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updateState = (setter) => {
      setter((prev) =>
        prev.map((q) => (q.id === id ? { ...q, isClaimed: true } : q)),
      );
    };

    if (category === "daily") updateState(setDailyQuests);
    else if (category === "weekly") updateState(setWeeklyChallenges);
    else if (category === "achievement") updateState(setAchievements);
    else if (category === "event")
      setFlashEvent({ ...flashEvent, isClaimed: true });

    handleGainExpAndSync(exp, reward, id);
  };

  const handleClaimStreak = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStreakClaimedToday(true);

    const reward = streakRewards[currentStreak - 1] || 50;

    let newCoins = walletBalance + reward;
    let newExp = userExp + 100; // 100 EXP for daily login
    let newLevel = userLevel;

    if (newExp >= expToNextLevel) {
      newLevel = userLevel + 1;
      newExp = newExp - expToNextLevel;
    }

    setWalletBalance(newCoins);
    setUserLevel(newLevel);
    setUserExp(newExp);

    // Sync streak specifically to database
    if (user) {
      await supabase
        .from("users")
        .update({
          eco_coins: newCoins,
          user_level: newLevel,
          user_exp: newExp,
          current_streak: currentStreak,
          last_streak_claim: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  };

  const isComplete = (item) => {
    if (item.isReverseLogic) return item.progress <= item.target;
    return item.progress >= item.target;
  };

  const getProgressPercent = (item) => {
    return item.isReverseLogic
      ? 100
      : Math.min((item.progress / item.target) * 100, 100);
  };

  // ==========================================
  // UI: COMPACT RPG PLAYER PROFILE
  // ==========================================
  const renderPlayerProfile = () => {
    const expPercent = (userExp / expToNextLevel) * 100;

    return (
      <View
        style={[
          styles.compactProfileContainer,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FontAwesome5
              name={getRankIcon(userLevel)}
              size={18}
              color={theme.buttonPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.compactRankTitle, { color: theme.text }]}>
              {getRankName(userLevel)}
            </Text>
          </View>

          <View
            style={[
              styles.compactLevelBadge,
              { backgroundColor: theme.buttonPrimary },
            ]}
          >
            <Text style={styles.compactLevelBadgeText}>LVL {userLevel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: theme.buttonNeutral,
                height: 6,
                borderRadius: 3,
                flex: 1,
                marginRight: 10,
                marginBottom: 0,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: `${expPercent}%`,
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: 3,
                },
              ]}
            />
          </View>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {userExp} / {expToNextLevel} EXP
          </Text>
        </View>
      </View>
    );
  };

  // ==========================================
  // UI: 7-DAY STREAK
  // ==========================================
  const renderStreakTimeline = () => {
    return (
      <View
        style={[
          styles.streakContainer,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <View style={styles.streakHeaderRow}>
          <View>
            <Text style={[styles.streakTitle, { color: theme.text }]}>
              Daily Login Streak
            </Text>
            <Text
              style={[styles.streakSubtitle, { color: theme.textSecondary }]}
            >
              Log in 7 days in a row for a massive chest!
            </Text>
          </View>
          <View
            style={[
              styles.streakFireBadge,
              { backgroundColor: "rgba(243, 156, 18, 0.15)" },
            ]}
          >
            <FontAwesome5 name="fire" size={14} color="#f39c12" />
            <Text style={[styles.streakFireText, { color: "#f39c12" }]}>
              {currentStreak} Days
            </Text>
          </View>
        </View>

        <View style={styles.streakTimelineWrapper}>
          <View
            style={[
              styles.streakLineBg,
              { backgroundColor: theme.buttonNeutral },
            ]}
          />
          <View
            style={[
              styles.streakLineActive,
              {
                backgroundColor: theme.buttonPrimary,
                width: `${((currentStreak - (streakClaimedToday ? 0 : 1)) / 6) * 100}%`,
              },
            ]}
          />

          <View style={styles.streakDaysRow}>
            {streakRewards.map((reward, index) => {
              const dayNum = index + 1;
              const isPast =
                dayNum < currentStreak ||
                (dayNum === currentStreak && streakClaimedToday);
              const isToday = dayNum === currentStreak && !streakClaimedToday;
              const isFuture = dayNum > currentStreak;

              return (
                <View key={`day-${dayNum}`} style={styles.streakDayCol}>
                  <View
                    style={[
                      styles.streakCircle,
                      {
                        backgroundColor: isPast
                          ? theme.buttonPrimary
                          : isToday
                            ? theme.background
                            : theme.buttonNeutral,
                        borderColor: isToday
                          ? theme.buttonPrimary
                          : "transparent",
                        borderWidth: isToday ? 2 : 0,
                      },
                    ]}
                  >
                    {isPast ? (
                      <MaterialIcons name="check" size={16} color="#fff" />
                    ) : dayNum === 7 ? (
                      <MaterialCommunityIcons
                        name="treasure-chest"
                        size={18}
                        color={
                          isFuture ? theme.textSecondary : theme.buttonPrimary
                        }
                      />
                    ) : (
                      <FontAwesome5
                        name="leaf"
                        size={12}
                        color={
                          isFuture ? theme.textSecondary : theme.buttonPrimary
                        }
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.streakDayText,
                      {
                        color:
                          isPast || isToday ? theme.text : theme.textSecondary,
                        fontWeight: isToday ? "bold" : "normal",
                      },
                    ]}
                  >
                    Day {dayNum}
                  </Text>
                  <Text
                    style={[
                      styles.streakRewardText,
                      { color: isToday ? "#2ecc71" : theme.textSecondary },
                    ]}
                  >
                    {reward}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.streakClaimBtn,
            {
              backgroundColor: streakClaimedToday
                ? theme.buttonNeutral
                : theme.buttonPrimary,
            },
          ]}
          disabled={streakClaimedToday}
          onPress={handleClaimStreak}
        >
          <Text
            style={[
              styles.streakClaimBtnText,
              { color: streakClaimedToday ? theme.textSecondary : "#fff" },
            ]}
          >
            {streakClaimedToday
              ? "COME BACK TOMORROW"
              : `CLAIM DAY ${currentStreak} REWARD`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // UI: FLASH EVENT
  // ==========================================
  const renderFlashEvent = () => {
    const completed = isComplete(flashEvent);
    const progressPercent = getProgressPercent(flashEvent);

    return (
      <View
        style={[
          styles.flashEventCard,
          {
            borderColor: "#9b59b6",
            backgroundColor: isDarkMode ? "#1f0f29" : "#fdf4ff",
          },
        ]}
      >
        <View style={styles.flashEventHeaderRow}>
          <View style={[styles.flashBadge, { backgroundColor: "#9b59b6" }]}>
            <MaterialIcons
              name="local-fire-department"
              size={12}
              color="#fff"
            />
            <Text style={styles.flashBadgeText}>LIMITED EVENT</Text>
          </View>
          <Text style={{ color: "#9b59b6", fontSize: 12, fontWeight: "bold" }}>
            Ends in: {flashEvent.timeLeft}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <FontAwesome5
            name={flashEvent.icon}
            size={24}
            color="#9b59b6"
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.weeklyTitle, { color: theme.text }]}>
              {flashEvent.title}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {flashEvent.desc}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <View
            style={[
              styles.rewardBadge,
              { backgroundColor: "rgba(46, 204, 113, 0.15)" },
            ]}
          >
            <FontAwesome5 name="leaf" size={10} color="#2ecc71" />
            <Text style={[styles.rewardText, { color: "#2ecc71" }]}>
              +{flashEvent.reward} Coins
            </Text>
          </View>
          <View
            style={[
              styles.rewardBadge,
              { backgroundColor: "rgba(52, 152, 219, 0.15)" },
            ]}
          >
            <Text style={[styles.rewardText, { color: "#3498db" }]}>
              +{flashEvent.exp} EXP
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, marginRight: 15 }}>
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: theme.buttonNeutral,
                  height: 8,
                  borderRadius: 4,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: "#9b59b6",
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.claimBtn,
              {
                backgroundColor: flashEvent.isClaimed
                  ? theme.buttonNeutral
                  : completed
                    ? "#9b59b6"
                    : theme.buttonNeutral,
              },
            ]}
            disabled={!completed || flashEvent.isClaimed}
            onPress={() =>
              handleClaim(
                "event",
                flashEvent.id,
                flashEvent.reward,
                flashEvent.exp,
              )
            }
          >
            <Text
              style={[
                styles.claimBtnText,
                {
                  color:
                    flashEvent.isClaimed || !completed
                      ? theme.textSecondary
                      : "#fff",
                },
              ]}
            >
              {flashEvent.isClaimed
                ? "CLAIMED"
                : completed
                  ? "CLAIM EVENT"
                  : "IN PROGRESS"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // UI: DAILY QUESTS
  // ==========================================
  const renderDailyCard = (item) => {
    const completed = isComplete(item);
    const progressPercent = getProgressPercent(item);

    return (
      <View
        key={item.id}
        style={[
          styles.missionCard,
          {
            backgroundColor: theme.card,
            borderColor: item.isClaimed
              ? theme.buttonNeutral
              : theme.cardBorder,
          },
        ]}
      >
        <View style={styles.missionHeader}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: item.isClaimed
                  ? theme.buttonNeutral
                  : item.color + "20",
              },
            ]}
          >
            <FontAwesome5
              name={item.icon}
              size={22}
              color={item.isClaimed ? theme.textSecondary : item.color}
            />
          </View>
          <View style={styles.missionInfo}>
            <Text
              style={[
                styles.missionTitle,
                { color: item.isClaimed ? theme.textSecondary : theme.text },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.missionDesc, { color: theme.textSecondary }]}>
              {item.desc}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={[
                styles.rewardBadge,
                {
                  backgroundColor: item.isClaimed
                    ? theme.buttonNeutral
                    : "rgba(46, 204, 113, 0.15)",
                  marginBottom: 4,
                },
              ]}
            >
              <FontAwesome5
                name="leaf"
                size={10}
                color={item.isClaimed ? theme.textSecondary : "#2ecc71"}
              />
              <Text
                style={[
                  styles.rewardText,
                  {
                    color: item.isClaimed ? theme.textSecondary : "#2ecc71",
                    fontSize: 11,
                  },
                ]}
              >
                +{item.reward}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                color: item.isClaimed ? theme.textSecondary : "#3498db",
                fontWeight: "bold",
              }}
            >
              +{item.exp} EXP
            </Text>
          </View>
        </View>

        <View style={styles.missionFooter}>
          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: theme.buttonNeutral },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: item.isClaimed
                      ? theme.textSecondary
                      : item.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {item.isReverseLogic
                ? `${item.progress} / ${item.target} kWh limit`
                : `${item.progress} / ${item.target} completed`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.claimBtn,
              {
                backgroundColor: item.isClaimed
                  ? theme.buttonNeutral
                  : completed
                    ? theme.buttonPrimary
                    : theme.buttonNeutral,
              },
            ]}
            disabled={!completed || item.isClaimed}
            onPress={() => handleClaim("daily", item.id, item.reward, item.exp)}
          >
            <Text
              style={[
                styles.claimBtnText,
                {
                  color:
                    item.isClaimed || !completed ? theme.textSecondary : "#fff",
                },
              ]}
            >
              {item.isClaimed ? "CLAIMED" : completed ? "CLAIM" : "IN PROGRESS"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // UI: WEEKLY CHALLENGES
  // ==========================================
  const renderWeeklyCard = (item) => {
    const completed = isComplete(item);
    const progressPercent = getProgressPercent(item);

    return (
      <View
        key={item.id}
        style={[
          styles.missionCard,
          styles.weeklyCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderLeftColor: item.isClaimed ? theme.buttonNeutral : item.color,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <FontAwesome5
              name={item.icon}
              size={18}
              color={item.isClaimed ? theme.textSecondary : item.color}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.weeklyTitle,
                { color: item.isClaimed ? theme.textSecondary : theme.text },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={[
                styles.weeklyRewardText,
                { color: item.isClaimed ? theme.textSecondary : "#2ecc71" },
              ]}
            >
              +{item.reward} COINS
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: item.isClaimed ? theme.textSecondary : "#3498db",
                fontWeight: "bold",
              }}
            >
              +{item.exp} EXP
            </Text>
          </View>
        </View>

        <Text style={[styles.weeklyDesc, { color: theme.textSecondary }]}>
          {item.desc}
        </Text>

        <View style={{ marginTop: 15 }}>
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: theme.buttonNeutral,
                height: 12,
                borderRadius: 6,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: item.isClaimed
                    ? theme.textSecondary
                    : item.color,
                  borderRadius: 6,
                },
              ]}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
              alignItems: "center",
            }}
          >
            <Text
              style={[
                styles.progressText,
                { color: theme.textSecondary, fontSize: 12 },
              ]}
            >
              {item.isReverseLogic
                ? `${item.progress} / ${item.target} kWh`
                : `${item.progress} / ${item.target}`}
            </Text>

            <TouchableOpacity
              style={[
                styles.claimBtn,
                {
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  backgroundColor: item.isClaimed
                    ? theme.buttonNeutral
                    : completed
                      ? theme.buttonPrimary
                      : theme.buttonNeutral,
                },
              ]}
              disabled={!completed || item.isClaimed}
              onPress={() =>
                handleClaim("weekly", item.id, item.reward, item.exp)
              }
            >
              <Text
                style={[
                  styles.claimBtnText,
                  {
                    color:
                      item.isClaimed || !completed
                        ? theme.textSecondary
                        : "#fff",
                  },
                ]}
              >
                {item.isClaimed
                  ? "CLAIMED"
                  : completed
                    ? "CLAIM BOUNTY"
                    : "IN PROGRESS"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ==========================================
  // UI: ACHIEVEMENTS
  // ==========================================
  const renderAchievementCard = (item) => {
    const completed = isComplete(item);

    return (
      <View
        key={item.id}
        style={[
          styles.missionCard,
          styles.achievementCard,
          {
            backgroundColor: item.isClaimed
              ? isDarkMode
                ? "rgba(241, 196, 15, 0.05)"
                : "#fffdf5"
              : theme.card,
            borderColor: item.isClaimed ? "#f1c40f" : theme.cardBorder,
            borderStyle: item.isClaimed ? "solid" : "dashed",
            borderWidth: item.isClaimed ? 2 : 1,
          },
        ]}
      >
        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.iconBox,
              styles.achievementIconBox,
              {
                backgroundColor: item.isClaimed
                  ? "#f1c40f"
                  : theme.buttonNeutral,
              },
            ]}
          >
            <FontAwesome5
              name={item.icon}
              size={24}
              color={item.isClaimed ? "#000" : theme.textSecondary}
            />
          </View>

          <View style={styles.missionInfo}>
            <Text
              style={[
                styles.missionTitle,
                { color: item.isClaimed ? "#f1c40f" : theme.text },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.missionDesc, { color: theme.textSecondary }]}>
              {item.desc}
            </Text>
          </View>
        </View>

        <View style={styles.missionFooter}>
          <Text
            style={[
              styles.progressText,
              { color: theme.textSecondary, flex: 1 },
            ]}
          >
            Lifetime Progress: {item.progress} / {item.target}
          </Text>

          <TouchableOpacity
            style={[
              styles.claimBtn,
              {
                backgroundColor: item.isClaimed
                  ? "transparent"
                  : completed
                    ? "#f1c40f"
                    : theme.buttonNeutral,
                borderWidth: item.isClaimed ? 1 : 0,
                borderColor: "#f1c40f",
              },
            ]}
            disabled={!completed || item.isClaimed}
            onPress={() =>
              handleClaim("achievement", item.id, item.reward, item.exp)
            }
          >
            <Text
              style={[
                styles.claimBtnText,
                {
                  color: item.isClaimed
                    ? "#f1c40f"
                    : completed
                      ? "#000"
                      : theme.textSecondary,
                },
              ]}
            >
              {item.isClaimed
                ? `UNLOCKED (+${item.reward})`
                : completed
                  ? "UNLOCK TROPHY"
                  : `REWARD: ${item.reward}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.buttonPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          MISSIONS
        </Text>

        <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
          <View
            style={[
              styles.walletBadge,
              { backgroundColor: theme.buttonNeutral },
            ]}
          >
            <FontAwesome5 name="leaf" size={10} color={theme.buttonPrimary} />
            <Text style={[styles.walletText, { color: theme.text }]}>
              {walletBalance}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* === COMPACT RPG PLAYER PROFILE === */}
        {renderPlayerProfile()}

        {/* === 7-DAY LOGIN STREAK TRACKER === */}
        {renderStreakTimeline()}

        {/* === LIMITED TIME FLASH EVENT === */}
        {renderFlashEvent()}

        {/* --- DAILY QUESTS SECTION --- */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Daily Quests
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
            >
              Refresh every 24 hours.
            </Text>
          </View>
          <View
            style={[
              styles.timerBadge,
              { backgroundColor: isDarkMode ? "#2c3e50" : "#eaf4ff" },
            ]}
          >
            <MaterialIcons name="timer" size={14} color={theme.buttonPrimary} />
            <Text style={[styles.timerText, { color: theme.buttonPrimary }]}>
              {timeLeft}
            </Text>
          </View>
        </View>

        {dailyQuests.map((q) => renderDailyCard(q))}

        {/* --- WEEKLY CHALLENGES SECTION --- */}
        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Weekly Challenges
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
            >
              Massive payouts for consistent efficiency.
            </Text>
          </View>
        </View>

        {weeklyChallenges.map((q) => renderWeeklyCard(q))}

        {/* --- LIFETIME ACHIEVEMENTS SECTION --- */}
        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Achievements
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
            >
              One-time rewards for app milestones.
            </Text>
          </View>
        </View>

        {achievements.map((q) => renderAchievementCard(q))}

        {/* Link to Store */}
        <TouchableOpacity
          style={[
            styles.storeLinkBtn,
            {
              borderColor: theme.buttonPrimary,
              backgroundColor: isDarkMode
                ? "rgba(52, 152, 219, 0.1)"
                : "#f0f8ff",
            },
          ]}
          onPress={() => navigation.navigate("EcoStore")}
        >
          <MaterialIcons
            name="storefront"
            size={24}
            color={theme.buttonPrimary}
          />
          <View style={{ marginLeft: 12 }}>
            <Text
              style={[styles.storeLinkText, { color: theme.buttonPrimary }]}
            >
              Spend Eco-Coins
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Head to the Eco-Store to unlock rewards.
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerSide: { width: 90, justifyContent: "center" },
  backBtn: { padding: 5, alignSelf: "flex-start" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
    flex: 1,
    textAlign: "center",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  walletText: { fontWeight: "900", marginLeft: 6, fontSize: 14 },

  scrollContent: { padding: 20, paddingBottom: 50 },

  // --- NEW COMPACT RPG PROFILE STYLES ---
  compactProfileContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  compactRankTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  compactLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactLevelBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
  },

  // --- FLASH EVENT STYLES ---
  flashEventCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
  },
  flashEventHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  flashBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flashBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
    letterSpacing: 0.5,
  },

  // --- STREAK UI STYLES ---
  streakContainer: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  streakHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  streakTitle: { fontSize: 16, fontWeight: "900" },
  streakSubtitle: { fontSize: 12, marginTop: 2 },
  streakFireBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  streakFireText: { fontWeight: "bold", fontSize: 12, marginLeft: 5 },

  streakTimelineWrapper: {
    position: "relative",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  streakLineBg: {
    position: "absolute",
    top: 14,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
  },
  streakLineActive: {
    position: "absolute",
    top: 14,
    left: 20,
    height: 3,
    borderRadius: 2,
    zIndex: 1,
  },
  streakDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  streakDayCol: {
    alignItems: "center",
    width: 36,
  },
  streakCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  streakDayText: { fontSize: 10, marginBottom: 2 },
  streakRewardText: { fontSize: 10, fontWeight: "bold" },

  streakClaimBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  streakClaimBtnText: {
    fontWeight: "900",
    letterSpacing: 1,
  },

  // --- GENERAL SECTION STYLES ---
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900" },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 2,
  },
  timerText: { fontSize: 12, fontWeight: "bold", marginLeft: 5 },

  // Base Card
  missionCard: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  // Daily Specific
  missionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  missionInfo: { flex: 1, paddingRight: 5 },
  missionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  missionDesc: { fontSize: 12, lineHeight: 16 },

  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: { fontWeight: "900", fontSize: 13, marginLeft: 4 },

  missionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  progressSection: { flex: 1, marginRight: 15 },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 11, fontWeight: "bold" },

  claimBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  claimBtnText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },

  // Weekly Specific
  weeklyCard: {
    borderLeftWidth: 6,
    paddingVertical: 18,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  weeklyDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  weeklyRewardText: {
    fontWeight: "900",
    fontSize: 14,
  },

  // Achievement Specific
  achievementCard: {
    borderWidth: 2,
    paddingVertical: 18,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  achievementIconBox: {
    borderRadius: 24,
    marginRight: 15,
  },

  storeLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: 20,
  },
  storeLinkText: { fontSize: 16, fontWeight: "900", marginBottom: 2 },
});
