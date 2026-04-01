import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Vibration,
  Dimensions,
  Alert,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - 40) / 5 - 8;

export default function FaultScannerScreen() {
  const { theme, isDarkMode } = useTheme();

  // --- LOCAL GAME STATE ---
  const [walletBalance, setWalletBalance] = useState(2000);
  const [betAmount, setBetAmount] = useState(50);
  const [mineCount, setMineCount] = useState(3);

  const [gameState, setGameState] = useState("idle");
  const [grid, setGrid] = useState([]);
  const [safeClicks, setSafeClicks] = useState(0);

  // --- THE GOD MODE STATE ---
  const [isGodMode, setIsGodMode] = useState(false);

  // --- MODAL STATES ---
  const [showBetModal, setShowBetModal] = useState(false);
  const [showMinesModal, setShowMinesModal] = useState(false);
  const [showJackpotModal, setShowJackpotModal] = useState(false);

  // --- JACKPOT ANIMATION STATES ---
  const [isSpinning, setIsSpinning] = useState(false);
  const [jackpotPrize, setJackpotPrize] = useState(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [sound, setSound] = useState();

  useEffect(() => {
    resetGrid();
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const playSound = async (type) => {
    try {
      let soundAsset;
      if (soundAsset) {
        const { sound: newSound } = await Audio.Sound.createAsync(soundAsset);
        setSound(newSound);
        await newSound.playAsync();
      }
    } catch (error) {
      console.log("Sound error:", error);
    }
  };

  const resetGrid = () => {
    const emptyGrid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
      isChest: false,
    }));
    setGrid(emptyGrid);
    setSafeClicks(0);
    setGameState("idle");
    setJackpotPrize(null);
    setIsSpinning(false);
    spinAnim.setValue(0);
    setIsGodMode(false); // Reset God Mode safely
  };

  const calculateMultiplier = (mines, clicks) => {
    if (clicks === 0) return 0;
    let multiplier = 1;
    for (let i = 0; i < clicks; i++) {
      multiplier *= (25 - i) / (25 - mines - i);
    }
    return multiplier * 0.99;
  };

  const currentMultiplier = calculateMultiplier(mineCount, safeClicks);
  const currentWin = safeClicks > 0 ? betAmount * currentMultiplier : 0;

  const handleStartScan = () => {
    if (betAmount > walletBalance) {
      Alert.alert("Insufficient Funds", "You don't have enough Eco-Coins.");
      return;
    }
    if (betAmount <= 0) return;

    setWalletBalance((prev) => prev - betAmount);
    setGameState("playing");
    setSafeClicks(0);
    setJackpotPrize(null);

    let newGrid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
      isChest: false,
    }));

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const randomIndex = Math.floor(Math.random() * 25);
      if (!newGrid[randomIndex].isMine) {
        newGrid[randomIndex].isMine = true;
        minesPlaced++;
      }
    }
    setGrid(newGrid);
  };

  // --- TOGGLE GOD MODE ---
  const handleSecretHack = () => {
    setIsGodMode((prevMode) => {
      const newMode = !prevMode;
      if (newMode) {
        Vibration.vibrate([0, 50, 100, 50]); // ON
      } else {
        Vibration.vibrate([0, 400]); // OFF
      }
      return newMode;
    });
  };

  const handleTileClick = (index) => {
    if (gameState !== "playing" || grid[index].isRevealed) return;

    let newGrid = [...grid];

    // THE GOD MODE MAGIC TRICK
    if (isGodMode && newGrid[index].isMine) {
      const safeUnrevealedIndex = newGrid.findIndex(
        (t) => !t.isRevealed && !t.isMine,
      );
      if (safeUnrevealedIndex !== -1) {
        newGrid[index].isMine = false;
        newGrid[safeUnrevealedIndex].isMine = true;
      }
    }

    newGrid[index].isRevealed = true;

    if (newGrid[index].isMine) {
      Vibration.vibrate([0, 200, 100, 200]);
      playSound("bomb");
      setGameState("lost");
      newGrid = newGrid.map((tile) =>
        tile.isMine ? { ...tile, isRevealed: true } : tile,
      );
    } else {
      Vibration.vibrate(50);
      playSound("safe");
      const newClicks = safeClicks + 1;
      setSafeClicks(newClicks);

      if (betAmount >= 20 && newClicks === 4) {
        newGrid[index].isChest = true;
        setShowJackpotModal(true);
      }

      if (newClicks === 25 - mineCount) {
        handleCashOut(newGrid, newClicks);
      }
    }
    setGrid(newGrid);
  };

  const handleCashOut = (currentGrid = grid, finalClicks = safeClicks) => {
    if (gameState !== "playing" || finalClicks === 0) return;
    setGameState("won");
    playSound("cashout");
    setWalletBalance(
      (prev) => prev + betAmount * calculateMultiplier(mineCount, finalClicks),
    );

    const revealedGrid = currentGrid.map((tile) => ({
      ...tile,
      isRevealed: true,
    }));
    setGrid(revealedGrid);
  };

  // --- SPINNER LOGIC ---
  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setJackpotPrize(null);
    spinAnim.setValue(0);

    const randomExtraSpins = Math.floor(Math.random() * 4) + 5;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = randomExtraSpins * 360 + randomAngle;

    Animated.timing(spinAnim, {
      toValue: totalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);

      const finalAngle = totalRotation % 360;
      let prizeName = "COIN";
      let prizeAmount = 100;

      if (finalAngle < 90) {
        prizeName = "MAJOR";
        prizeAmount = 1000;
      } else if (finalAngle < 180) {
        prizeName = "GRAND";
        prizeAmount = 5000;
      } else if (finalAngle < 270) {
        prizeName = "MINOR";
        prizeAmount = 500;
      }

      setJackpotPrize({ name: prizeName, amount: prizeAmount });
      setWalletBalance((prev) => prev + prizeAmount);
    });
  };

  const closeJackpot = () => {
    setShowJackpotModal(false);
    setJackpotPrize(null);
    spinAnim.setValue(0);
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const betOptions = [10, 20, 50, 100, 200, 500, 1000];
  const mineOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <View
            style={[
              styles.coinCircle,
              { backgroundColor: theme.buttonPrimary },
            ]}
          >
            <FontAwesome5 name="bolt" size={12} color="#fff" />
          </View>
          <Text style={[styles.headerSideText, { color: theme.text }]}>
            {safeClicks}
          </Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: theme.text }]}>
            DIAGNOSTICS
          </Text>
          <TouchableOpacity activeOpacity={1} onPress={handleSecretHack}>
            <Text style={styles.jackpotText}>SYSTEM OVERRIDE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerSide}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={24}
            color={theme.textSecondary}
          />
          <Text style={[styles.headerSideText, { color: theme.text }]}>
            {mineCount}
          </Text>
        </View>
      </View>

      {/* --- MULTIPLIER TAPE --- */}
      <View style={[styles.multiplierStrip, { backgroundColor: theme.card }]}>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          Current:{" "}
          <Text style={{ color: theme.buttonPrimary }}>
            {currentMultiplier > 0 ? currentMultiplier.toFixed(2) : "1.00"}x
          </Text>
        </Text>
        <MaterialIcons
          name="double-arrow"
          size={16}
          color={theme.textSecondary}
          style={{ marginHorizontal: 10 }}
        />
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          Next:{" "}
          <Text style={{ color: isDarkMode ? "#ffaa00" : "#ff9900" }}>
            {calculateMultiplier(mineCount, safeClicks + 1).toFixed(2)}x
          </Text>
        </Text>
      </View>

      {/* --- 5x5 GAME GRID --- */}
      <View style={styles.gridContainer}>
        {grid.map((tile, index) => {
          let tileStyle = {
            backgroundColor: theme.buttonNeutral,
            borderBottomColor: theme.cardBorder,
          };
          let tileContent = (
            <FontAwesome5
              name="microchip"
              size={20}
              color={theme.textSecondary}
              style={{ opacity: 0.3 }}
            />
          );

          if (tile.isRevealed) {
            if (tile.isMine) {
              tileStyle = {
                backgroundColor: isDarkMode ? "#ff4444" : "#e53935",
                borderBottomColor: "#b71c1c",
              };
              tileContent = (
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={32}
                  color="#fff"
                />
              );
            } else if (tile.isChest) {
              tileStyle = {
                backgroundColor: "#f1c40f",
                borderBottomColor: "#f39c12",
              };
              tileContent = (
                <MaterialCommunityIcons
                  name="treasure-chest"
                  size={32}
                  color="#fff"
                />
              );
            } else {
              tileStyle = {
                backgroundColor: theme.buttonPrimary,
                borderBottomColor: "#007a3c",
              };
              tileContent = (
                <FontAwesome5 name="check-circle" size={24} color="#fff" />
              );
            }
          }

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleTileClick(index)}
              style={[
                styles.tile,
                tileStyle,
                {
                  opacity:
                    (gameState === "won" || gameState === "lost") &&
                    !tile.isRevealed
                      ? 0.6
                      : 1,
                },
              ]}
            >
              {tileContent}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- BALANCE & WIN INFO --- */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Eco-Coins:{" "}
          <Text style={{ color: theme.text, fontWeight: "bold" }}>
            {walletBalance.toFixed(2)}
          </Text>
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Win:{" "}
          <Text style={{ color: theme.buttonPrimary, fontWeight: "bold" }}>
            {currentWin.toFixed(2)}
          </Text>
        </Text>
      </View>

      {/* --- BOTTOM CONTROLS --- */}
      <View
        style={[
          styles.controlsContainer,
          { backgroundColor: theme.card, borderTopColor: theme.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.blueBtn, { backgroundColor: theme.buttonNeutral }]}
          onPress={() => gameState !== "playing" && setShowBetModal(true)}
        >
          <FontAwesome5
            name="leaf"
            size={14}
            color={theme.buttonPrimary}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.blueBtnText, { color: theme.text }]}>
            {betAmount} ECO-COINS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.blueBtn, { backgroundColor: theme.buttonNeutral }]}
          onPress={() => gameState !== "playing" && setShowMinesModal(true)}
        >
          <MaterialCommunityIcons
            name="alert"
            size={16}
            color={theme.text}
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.blueBtnText, { color: theme.text }]}>
            {mineCount} FAULTS
          </Text>
        </TouchableOpacity>

        {gameState === "playing" ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cashoutBtn]}
            onPress={() => handleCashOut()}
            disabled={safeClicks === 0}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              DISCONNECT
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.buttonPrimary, flex: 1 },
            ]}
            onPress={handleStartScan}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              SCAN CIRCUIT
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ================= MODALS ================= */}
      {/* BET MODAL */}
      <Modal visible={showBetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Wager Eco-Coins
            </Text>
            <View style={styles.modalGrid}>
              {betOptions.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.modalGridItem,
                    {
                      backgroundColor:
                        betAmount === amt
                          ? theme.buttonPrimary
                          : theme.buttonNeutral,
                    },
                  ]}
                  onPress={() => {
                    setBetAmount(amt);
                    setShowBetModal(false);
                  }}
                >
                  <Text
                    style={{
                      color: betAmount === amt ? "#fff" : theme.text,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowBetModal(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MINES MODAL */}
      <Modal visible={showMinesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, maxHeight: "80%" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Set Hardware Faults
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalGrid}>
                {mineOptions.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.modalGridItem,
                      {
                        backgroundColor:
                          mineCount === count
                            ? theme.buttonPrimary
                            : theme.buttonNeutral,
                      },
                    ]}
                    onPress={() => {
                      setMineCount(count);
                      setShowMinesModal(false);
                    }}
                  >
                    <Text
                      style={{
                        color: mineCount === count ? "#fff" : theme.text,
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMinesModal(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* JACKPOT WHEEL MODAL */}
      <Modal visible={showJackpotModal} transparent animationType="fade">
        <View style={styles.jackpotOverlay}>
          <Text style={styles.jackpotTitleText}>SYSTEM REWARD</Text>

          <View style={styles.wheelContainer}>
            <View style={styles.wheelPointer} />

            <Animated.View
              style={[
                styles.wheel,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <View
                style={[
                  styles.quadrant,
                  { backgroundColor: "#f1c40f", top: 0, left: 0 },
                ]}
              >
                <View
                  style={{
                    transform: [{ rotate: "45deg" }],
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.segmentText}>GRAND</Text>
                  <Text style={styles.segmentSubText}>5000</Text>
                </View>
              </View>
              <View
                style={[
                  styles.quadrant,
                  { backgroundColor: "#2ecc71", top: 0, right: 0 },
                ]}
              >
                <View
                  style={{
                    transform: [{ rotate: "-45deg" }],
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.segmentText}>COIN</Text>
                  <Text style={styles.segmentSubText}>100</Text>
                </View>
              </View>
              <View
                style={[
                  styles.quadrant,
                  { backgroundColor: "#e74c3c", bottom: 0, left: 0 },
                ]}
              >
                <View
                  style={{
                    transform: [{ rotate: "-45deg" }],
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.segmentText}>MAJOR</Text>
                  <Text style={styles.segmentSubText}>1000</Text>
                </View>
              </View>
              <View
                style={[
                  styles.quadrant,
                  { backgroundColor: "#3498db", bottom: 0, right: 0 },
                ]}
              >
                <View
                  style={{
                    transform: [{ rotate: "45deg" }],
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.segmentText}>MINOR</Text>
                  <Text style={styles.segmentSubText}>500</Text>
                </View>
              </View>
              <View style={styles.wheelCenter} />
            </Animated.View>
          </View>

          {jackpotPrize ? (
            <View style={{ alignItems: "center", marginTop: 30 }}>
              <Text style={styles.prizeText}>
                SYSTEM GRANTED: {jackpotPrize.name}!
              </Text>
              <Text style={styles.prizeAmountText}>
                +{jackpotPrize.amount} Eco-Coins
              </Text>
              <TouchableOpacity
                style={[
                  styles.spinButton,
                  { backgroundColor: theme.buttonPrimary },
                ]}
                onPress={closeJackpot}
              >
                <Text style={styles.spinButtonText}>CLAIM PRIZE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: "center", marginTop: 30 }}>
              <TouchableOpacity
                style={[
                  styles.spinButton,
                  {
                    backgroundColor: isSpinning
                      ? theme.buttonNeutral
                      : theme.buttonPrimary,
                  },
                ]}
                onPress={spinWheel}
                disabled={isSpinning}
              >
                <Text
                  style={[
                    styles.spinButtonText,
                    { color: isSpinning ? theme.textSecondary : "#fff" },
                  ]}
                >
                  {isSpinning ? "AUTHORIZING..." : "INITIATE SPIN"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 5,
  },
  headerSide: { alignItems: "center", justifyContent: "center" },
  coinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerSideText: { fontSize: 16, fontWeight: "bold" },
  titleContainer: { alignItems: "center" },
  titleText: { fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  jackpotText: {
    fontSize: 14,
    color: "#f1c40f",
    fontWeight: "bold",
    marginVertical: 2,
  },

  multiplierStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  infoText: { fontSize: 14 },

  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
  },

  // WIDENED BUTTONS TO FIT TEXT
  blueBtn: {
    width: 95,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.2)",
  },
  blueBtnText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },

  actionBtn: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
    marginHorizontal: 4,
  },
  cashoutBtn: {
    backgroundColor: "#d35400",
    borderBottomColor: "#a04000",
    flex: 1,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modalGridItem: {
    width: "22%",
    margin: "1.5%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseBtn: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },

  // JACKPOT STYLES
  jackpotOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  jackpotTitleText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f1c40f",
    marginBottom: 30,
    letterSpacing: 2,
  },
  wheelContainer: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelPointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    position: "absolute",
    top: -15,
    zIndex: 10,
  },

  wheel: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    borderColor: "#f1c40f",
    overflow: "hidden",
    position: "relative",
  },
  quadrant: {
    position: "absolute",
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  segmentSubText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 2,
  },
  wheelCenter: {
    position: "absolute",
    top: 110,
    left: 110,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#333",
  },

  spinButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
  },
  spinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  prizeText: {
    color: "#2ecc71",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  prizeAmountText: { color: "#f1c40f", fontSize: 24, fontWeight: "900" },
});
