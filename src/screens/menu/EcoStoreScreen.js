import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  FlatList,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 40;

export default function EcoStoreScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [walletBalance, setWalletBalance] = useState(3500);
  const [searchQuery, setSearchQuery] = useState("");

  // PRE-OWNED ITEMS INJECTED HERE
  const [ownedItems, setOwnedItems] = useState(["mode_simple", "mode_light"]);

  // Eco-Bank State
  const [bankBalance, setBankBalance] = useState(0);

  // Ledger State
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [modalState, setModalState] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    selectedItem: null,
  });

  // --- AUTO-SCROLLING CAROUSEL ---
  const featuredBanners = [
    {
      id: "b1",
      title: "Win ₱5,000 Rebate!",
      desc: "Enter the Mega-Raffle for a chance to pay zero bills.",
      icon: "ticket-alt",
      color: "#f39c12",
      type: "fa5",
    },
    {
      id: "b2",
      title: "Unlock Simple Mode",
      desc: "A clean, easy-to-use interface for older family members.",
      icon: "mobile-alt",
      color: "#3498db",
      type: "fa5",
    },
    {
      id: "b3",
      title: "Drill Sergeant AI",
      desc: "Make your Smart Coach yell at you to save power.",
      icon: "robot",
      color: "#e84393",
      type: "mci",
    },
  ];

  const flatListRef = useRef(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (searchQuery !== "") return;
    const interval = setInterval(() => {
      let nextIndex = (currentBannerIndex + 1) % featuredBanners.length;
      setCurrentBannerIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3500);
    return () => clearInterval(interval);
  }, [currentBannerIndex, searchQuery]);

  // --- STORE INVENTORY ---
  const storeInventory = [
    {
      category: "Premium Grid Features",
      items: [
        {
          id: "saas_scheduler",
          title: "Auto-Kill Pro",
          desc: "Unlimited complex relay timers for your 4-outlet hub.",
          cost: 1500,
          icon: "clock",
          type: "fa5",
          color: "#e67e22",
          repeatable: false,
        },
        {
          id: "saas_pdf",
          title: "PDF Energy Reports",
          desc: "Export monthly analytics to PDF.",
          cost: 500,
          icon: "file-pdf",
          type: "fa5",
          color: "#c0392b",
          repeatable: false,
        },
        {
          id: "saas_ai_slots",
          title: "AI Track Slots",
          desc: "Allow AI to track 5 extra appliances.",
          cost: 800,
          icon: "brain",
          type: "fa5",
          color: "#8e44ad",
          repeatable: false,
        },
      ],
    },
    {
      category: "Real-World Rewards",
      items: [
        {
          id: "gift_family",
          title: "Gift: ₱50 GCash",
          desc: "Send a voucher to a connected family member.",
          cost: 1000,
          icon: "gift",
          type: "fa5",
          color: "#ff4757",
          repeatable: true,
          isGift: true,
        },
        {
          id: "raffle",
          title: "Mega-Raffle Ticket",
          desc: "Monthly ₱5,000 Rebate Entry.",
          cost: 100,
          icon: "ticket-alt",
          type: "fa5",
          color: "#f39c12",
          repeatable: true,
        },
        {
          id: "voucher",
          title: "Hardware Discounts",
          desc: "20% Off Smart Plugs/Routers.",
          cost: 5000,
          icon: "tools",
          type: "fa5",
          color: "#e74c3c",
          repeatable: true,
        },
      ],
    },
    {
      category: "AI Personalities",
      items: [
        {
          id: "ai_drill",
          title: "Drill Sergeant AI",
          desc: "Aggressive, strict Smart Coach.",
          cost: 800,
          icon: "robot",
          type: "mci",
          color: "#e84393",
          repeatable: false,
        },
        {
          id: "ai_zen",
          title: "Zen Master AI",
          desc: "Peaceful, calm riddle Coach.",
          cost: 800,
          icon: "leaf",
          type: "mci",
          color: "#2ecc71",
          repeatable: false,
        },
      ],
    },
    {
      category: "App Modes & Themes",
      items: [
        {
          id: "mode_simple",
          title: "Simple Mode Unlock",
          desc: "Clean UI for older users.",
          cost: 2000,
          icon: "mobile-alt",
          type: "fa5",
          color: "#3498db",
          repeatable: false,
        },
        {
          id: "mode_light",
          title: "Light Mode Unlock",
          desc: "Bright, daytime app theme.",
          cost: 2000,
          icon: "sun",
          type: "fa5",
          color: "#f1c40f",
          repeatable: false,
        },
        {
          id: "theme_cyber",
          title: "Cyber-Grid Theme",
          desc: "Neon hacker aesthetic theme.",
          cost: 1500,
          icon: "palette",
          type: "fa5",
          color: "#1abc9c",
          repeatable: false,
        },
      ],
    },
    {
      category: "Gaming Power-Ups",
      items: [
        {
          id: "gacha_gold",
          title: "Golden Hub Box",
          desc: "Guaranteed Rare+. 1% Physical Prize.",
          cost: 1500,
          icon: "box-open",
          type: "fa5",
          color: "#f1c40f",
          repeatable: true,
          isGoldGacha: true,
        },
        {
          id: "power_surge",
          title: "Surge Protector",
          desc: "Extra life in Fault Scanner.",
          cost: 500,
          icon: "shield-alt",
          type: "fa5",
          color: "#3498db",
          repeatable: true,
        },
        {
          id: "power_ping",
          title: "Diagnostics Ping",
          desc: "Reveals one safe node.",
          cost: 100,
          icon: "radar",
          type: "mci",
          color: "#2ecc71",
          repeatable: true,
        },
      ],
    },
    {
      category: "IoT Hardware Flex",
      items: [
        {
          id: "hw_ringtone",
          title: "Custom Ringtones",
          desc: "Change the physical hub buzzer.",
          cost: 300,
          icon: "music",
          type: "fa5",
          color: "#9b59b6",
          repeatable: false,
        },
        {
          id: "hw_led",
          title: "LED Status Colors",
          desc: "Custom RGB standby glow.",
          cost: 400,
          icon: "lightbulb-on",
          type: "mci",
          color: "#f1c40f",
          repeatable: false,
        },
      ],
    },
  ];

  const filteredInventory = storeInventory
    .map((section) => {
      return {
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      };
    })
    .filter((section) => section.items.length > 0);

  const getCurrentTime = () => {
    const now = new Date();
    return (
      now.toLocaleDateString() +
      " " +
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // --- ECO-BANK STAKING LOGIC ---
  const handleBankStake = () => {
    if (walletBalance >= 1000) {
      setModalState({
        visible: true,
        type: "confirm_bank",
        title: "Stake 1,000 Coins?",
        message:
          "Lock 1,000 Eco-Coins for 7 days to earn 15% interest (1,150 Coins total payout).",
        selectedItem: null,
      });
    } else {
      setModalState({
        visible: true,
        type: "error",
        title: "Insufficient Funds",
        message: `You need at least 1,000 Eco-Coins to invest in the bank.`,
        selectedItem: null,
      });
    }
  };

  const executeBankStake = () => {
    setWalletBalance((prev) => prev - 1000);
    setBankBalance((prev) => prev + 1000);

    const newTransaction = {
      id: Date.now().toString(),
      title: "Eco-Bank Deposit",
      amount: -1000,
      date: getCurrentTime(),
    };
    setPurchaseHistory((prev) => [newTransaction, ...prev]);

    setModalState({
      visible: true,
      type: "success",
      title: "Staked Successfully!",
      message:
        "1,000 Coins have been locked in the Eco-Bank. Check back in 7 days to claim your 15% interest!",
      selectedItem: null,
    });
  };

  // --- MODAL & PURCHASE LOGIC ---
  const handleItemPress = (item) => {
    if (walletBalance >= item.cost) {
      setModalState({
        visible: true,
        type: "confirm",
        title: item.isGoldGacha
          ? "Open Golden Box?"
          : item.isGift
            ? "Send Gift?"
            : "Confirm Purchase",
        message: item.isGoldGacha
          ? `Spend ${item.cost} Coins for a guaranteed Rare+ reward?`
          : item.isGift
            ? `Spend ${item.cost} Coins to send this gift to a family member's account?`
            : `Unlock '${item.title}' for ${item.cost} Eco-Coins?`,
        selectedItem: item,
      });
    } else {
      setModalState({
        visible: true,
        type: "error",
        title: "Insufficient Funds",
        message: `You need more Eco-Coins. Keep saving energy!`,
        selectedItem: null,
      });
    }
  };

  const executePurchase = () => {
    const item = modalState.selectedItem;
    if (item) {
      setWalletBalance((prev) => prev - item.cost);

      // Handle Tiered Golden Gacha
      if (item.isGoldGacha) {
        const roll = Math.random();
        let prize = "";
        let wonAmount = 0;

        if (roll < 0.05) {
          prize = "Legendary: Free ESP32 Sensor Upgrade!";
          wonAmount = 0;
        } else if (roll < 0.3) {
          prize = "Epic: 3,000 Coins!";
          wonAmount = 3000;
        } else {
          prize = "Rare: 1,500 Coins (Break Even).";
          wonAmount = 1500;
        }

        setWalletBalance((prev) => prev + wonAmount);

        const costTx = {
          id: Date.now().toString() + "cg",
          title: "Golden Box Unlock",
          amount: -item.cost,
          date: getCurrentTime(),
        };
        const newHistory = [costTx, ...purchaseHistory];

        if (wonAmount > 0) {
          const rewardTx = {
            id: Date.now().toString() + "wg",
            title: `Golden Box Reward`,
            amount: wonAmount,
            date: getCurrentTime(),
          };
          newHistory.unshift(rewardTx);
        }
        setPurchaseHistory(newHistory);

        setModalState({
          visible: true,
          type: "success",
          title: "Golden Box Opened!",
          message: `You unlocked the premium crate and found:\n\n${prize}`,
          selectedItem: null,
        });
        return; // Exit early for gacha
      }

      // Normal Purchase Logic
      if (!item.repeatable) {
        setOwnedItems((prev) => [...prev, item.id]);
      }

      const newTransaction = {
        id: Date.now().toString(),
        title: item.title,
        amount: -item.cost,
        date: getCurrentTime(),
      };
      setPurchaseHistory((prev) => [newTransaction, ...prev]);

      let successMessage = `'${item.title}' is now active on your account.`;
      if (item.isGift)
        successMessage = `You have successfully gifted '${item.title}' to your family group!`;
      if (item.id === "charity_tree")
        successMessage =
          "Thank you! GridWatch will fund the planting of a real tree in the Philippines on your behalf.";

      setModalState({
        visible: true,
        type: "success",
        title:
          item.id === "charity_tree"
            ? "Donation Received!"
            : item.isGift
              ? "Gift Sent!"
              : "Unlock Successful!",
        message: successMessage,
        selectedItem: null,
      });
    }
  };

  // --- STANDARD MYSTERY LOOT BOX LOGIC ---
  const handleMysteryBox = () => {
    if (walletBalance >= 300) {
      setModalState({
        visible: true,
        type: "confirm_mystery",
        title: "Open Mystery Box?",
        message:
          "Spend 300 Eco-Coins to open a standard Mystery Hub Box? You could win up to 5,000 coins!",
        selectedItem: null,
      });
    } else {
      setModalState({
        visible: true,
        type: "error",
        title: "Insufficient Funds",
        message: `You need 300 Eco-Coins to open a Mystery Box.`,
        selectedItem: null,
      });
    }
  };

  const executeMysteryBox = () => {
    setWalletBalance((prev) => prev - 300);

    const roll = Math.random();
    let prize = "";
    let wonAmount = 0;

    if (roll < 0.05) {
      prize = "Jackpot: 5,000 Coin Voucher!";
      wonAmount = 5000;
    } else if (roll < 0.2) {
      prize = "Epic: 1,000 Coins!";
      wonAmount = 1000;
    } else if (roll < 0.5) {
      prize = "Rare: 400 Coins (Profit!)";
      wonAmount = 400;
    } else if (roll < 0.8) {
      prize = "Common: 100 Coin Dud.";
      wonAmount = 100;
    } else {
      prize = "Empty... A busted circuit!";
      wonAmount = 0;
    }

    setWalletBalance((prev) => prev + wonAmount);

    const costTx = {
      id: Date.now().toString() + "c",
      title: "Mystery Box Unlock",
      amount: -300,
      date: getCurrentTime(),
    };
    const newHistory = [costTx, ...purchaseHistory];

    if (wonAmount > 0) {
      const rewardTx = {
        id: Date.now().toString() + "w",
        title: `Mystery Box Reward`,
        amount: wonAmount,
        date: getCurrentTime(),
      };
      newHistory.unshift(rewardTx);
    }

    setPurchaseHistory(newHistory);

    setModalState({
      visible: true,
      type: wonAmount > 0 ? "success" : "error",
      title: wonAmount > 0 ? "Jackpot!" : "Aww, Snapped Wire.",
      message: `You opened the box and found:\n\n${prize}`,
      selectedItem: null,
    });
  };

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, visible: false }));

  const handleModalExecute = () => {
    if (modalState.type === "confirm_mystery") executeMysteryBox();
    else if (modalState.type === "confirm_bank") executeBankStake();
    else executePurchase();
  };

  const renderIcon = (item, size = 28) => {
    if (item.type === "fa5")
      return <FontAwesome5 name={item.icon} size={size} color={item.color} />;
    return (
      <MaterialCommunityIcons name={item.icon} size={size} color={item.color} />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- HEADER WITH HISTORY ICON --- */}
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
          ECO-STORE
        </Text>

        <View
          style={[
            styles.headerSide,
            {
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "flex-end",
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowHistoryModal(true)}
            style={{ marginRight: 12 }}
          >
            <MaterialIcons
              name="receipt-long"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
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
        {/* --- SEARCH BAR --- */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <MaterialIcons
            name="search"
            size={22}
            color={theme.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search rewards, features, modes..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons
                name="close"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* --- AUTO-SCROLLING HERO BANNER --- */}
        {searchQuery === "" && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={featuredBanners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(data, index) => ({
                length: BANNER_WIDTH,
                offset: BANNER_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / BANNER_WIDTH,
                );
                setCurrentBannerIndex(index);
              }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.heroBanner,
                    {
                      width: BANNER_WIDTH,
                      backgroundColor: isDarkMode ? "#1a2530" : "#eaf4ff",
                      borderColor: theme.buttonPrimary,
                    },
                  ]}
                >
                  <View style={styles.heroContent}>
                    <View
                      style={[
                        styles.heroBadge,
                        { backgroundColor: theme.buttonPrimary },
                      ]}
                    >
                      <Text style={styles.heroBadgeText}>FEATURED</Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.heroDesc, { color: theme.textSecondary }]}
                    >
                      {item.desc}
                    </Text>
                  </View>
                  {renderIcon(item, 45)}
                </View>
              )}
            />
            <View style={styles.pagination}>
              {featuredBanners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentBannerIndex
                      ? { backgroundColor: theme.buttonPrimary, width: 20 }
                      : { backgroundColor: theme.textSecondary, opacity: 0.5 },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* --- REAL-WORLD IMPACT (PLANT A TREE) HERO CARD --- */}
        {searchQuery === "" && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Community Impact
            </Text>

            <View style={styles.treeCardWrapper}>
              <ImageBackground
                source={{
                  uri: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop",
                }}
                style={styles.treeImageBase}
              >
                <View style={styles.treeOverlay} />

                <View style={styles.treeContent}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <FontAwesome5
                      name="tree"
                      size={18}
                      color="#2ecc71"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.treeTitle}>Plant a Real Tree</Text>
                  </View>

                  <Text style={styles.treeDesc}>
                    Use your saved energy to heal the earth. For every 2,000
                    Eco-Coins donated, the GridWatch team funds the planting of
                    a real tree in a local Philippine forest.
                  </Text>

                  <View style={styles.treeProgressWrapper}>
                    <View style={styles.treeProgressContainer}>
                      <View style={styles.treeProgressBar} />
                    </View>
                    <Text style={styles.treeProgressText}>
                      128 / 500 Trees Funded
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.treeBtn}
                    onPress={() =>
                      handleItemPress({
                        id: "charity_tree",
                        title: "Plant a Real Tree",
                        cost: 2000,
                        repeatable: true,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <FontAwesome5
                      name="leaf"
                      size={14}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.treeBtnText}>DONATE 2000 COINS</Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          </View>
        )}

        {/* --- STORE INVENTORY (GRID LAYOUT) --- */}
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="store-search"
              size={60}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.emptyStateText, { color: theme.textSecondary }]}
            >
              No items found.
            </Text>
          </View>
        ) : (
          filteredInventory.map((section, idx) => (
            <View key={idx} style={styles.sectionContainer}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                {section.category}
              </Text>

              <View style={styles.gridContainer}>
                {section.items.map((item) => {
                  const isOwned =
                    !item.repeatable && ownedItems.includes(item.id);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      disabled={isOwned}
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.card,
                          borderColor: isOwned
                            ? theme.cardBorder
                            : item.isGoldGacha
                              ? "#f1c40f"
                              : theme.cardBorder,
                          borderWidth: item.isGoldGacha ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconBox,
                            {
                              backgroundColor: isDarkMode
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              opacity: isOwned ? 0.5 : 1,
                            },
                          ]}
                        >
                          {renderIcon(item, 28)}
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color: isOwned
                              ? theme.textSecondary
                              : item.isGoldGacha
                                ? "#f1c40f"
                                : theme.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardDesc,
                          {
                            color: theme.textSecondary,
                            opacity: isOwned ? 0.6 : 1,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {item.desc}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.buyBtn,
                          {
                            backgroundColor: isOwned
                              ? theme.buttonNeutral
                              : walletBalance >= item.cost
                                ? item.isGoldGacha
                                  ? "#f1c40f"
                                  : theme.buttonPrimary
                                : theme.buttonNeutral,
                          },
                        ]}
                        onPress={() => !isOwned && handleItemPress(item)}
                        disabled={isOwned}
                      >
                        {!isOwned && (
                          <FontAwesome5
                            name="leaf"
                            size={10}
                            color={
                              walletBalance >= item.cost && !item.isGoldGacha
                                ? "#fff"
                                : item.isGoldGacha && walletBalance >= item.cost
                                  ? "#000"
                                  : theme.textSecondary
                            }
                            style={{ marginRight: 5 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.buyBtnText,
                            {
                              color: isOwned
                                ? theme.textSecondary
                                : walletBalance >= item.cost &&
                                    !item.isGoldGacha
                                  ? "#fff"
                                  : item.isGoldGacha &&
                                      walletBalance >= item.cost
                                    ? "#000"
                                    : theme.textSecondary,
                            },
                          ]}
                        >
                          {isOwned ? "EQUIPPED" : item.cost}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* --- MOVED DOWN: ECO-BANK STAKING CARD (PLACED RIGHT AFTER HARDWARE FLEX) --- */}
        {searchQuery === "" && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Investment
            </Text>

            <View
              style={[
                styles.bankCard,
                {
                  backgroundColor: isDarkMode ? "#11224d" : "#eaf4ff",
                  borderColor: theme.buttonPrimary,
                },
              ]}
            >
              <View style={styles.bankHeaderRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.buttonPrimary },
                  ]}
                >
                  <MaterialCommunityIcons name="bank" size={28} color="#fff" />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={[styles.bankTitle, { color: theme.text }]}>
                    Eco-Bank Staking
                  </Text>
                  <Text
                    style={[styles.bankDesc, { color: theme.textSecondary }]}
                  >
                    Lock 1,000 Coins for 7 Days - Earn 15% Interest.
                  </Text>
                </View>
              </View>

              <View style={styles.bankBottomRow}>
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.textSecondary,
                      fontWeight: "bold",
                    }}
                  >
                    STAKED BALANCE
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "900",
                      color: theme.text,
                    }}
                  >
                    {bankBalance}{" "}
                    <FontAwesome5
                      name="leaf"
                      size={14}
                      color={theme.buttonPrimary}
                    />
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bankBtn,
                    {
                      backgroundColor:
                        walletBalance >= 1000 ? "#27ae60" : theme.buttonNeutral,
                    },
                  ]}
                  onPress={handleBankStake}
                >
                  <Text
                    style={[
                      styles.bankBtnText,
                      {
                        color:
                          walletBalance >= 1000 ? "#fff" : theme.textSecondary,
                      },
                    ]}
                  >
                    STAKE 1000
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- FLOATING MYSTERY BOX BUTTON --- */}
      {searchQuery === "" && (
        <TouchableOpacity
          style={styles.floatingMysteryBox}
          onPress={handleMysteryBox}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="treasure-chest"
            size={24}
            color="#fff"
          />
          <Text style={styles.floatingText}>Mystery Box</Text>
        </TouchableOpacity>
      )}

      {/* ================= PURCHASE HISTORY MODAL ================= */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.historyModalOverlay}>
          <View
            style={[
              styles.historyModalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.historyHeader,
                { borderBottomColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.historyTitle, { color: theme.text }]}>
                Ledger History
              </Text>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={{ padding: 5 }}
              >
                <MaterialIcons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            {purchaseHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <MaterialIcons
                  name="receipt"
                  size={60}
                  color={theme.textSecondary}
                  style={{ opacity: 0.5 }}
                />
                <Text
                  style={[
                    styles.emptyHistoryText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No transactions yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={purchaseHistory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.transactionRow,
                      { borderBottomColor: theme.cardBorder },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txTitle, { color: theme.text }]}>
                        {item.title}
                      </Text>
                      <Text
                        style={[styles.txDate, { color: theme.textSecondary }]}
                      >
                        {item.date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            item.amount > 0
                              ? theme.buttonPrimary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ================= COMPACT CONFIRMATION MODAL ================= */}
      <Modal visible={modalState.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.customModalContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <View
              style={[
                styles.modalIconCircle,
                {
                  backgroundColor:
                    modalState.type === "error"
                      ? "#fdecea"
                      : modalState.type === "success"
                        ? "#e8f5e9"
                        : "#eaf4ff",
                },
              ]}
            >
              {modalState.type === "error" && (
                <MaterialIcons name="error-outline" size={28} color="#e74c3c" />
              )}
              {modalState.type === "success" && (
                <MaterialIcons
                  name="check-circle-outline"
                  size={28}
                  color="#27ae60"
                />
              )}
              {(modalState.type === "confirm" ||
                modalState.type === "confirm_mystery" ||
                modalState.type === "confirm_bank") && (
                <FontAwesome5
                  name={
                    modalState.type === "confirm_bank"
                      ? "university"
                      : "shopping-cart"
                  }
                  size={20}
                  color="#3498db"
                />
              )}
            </View>

            <Text style={[styles.customModalTitle, { color: theme.text }]}>
              {modalState.title}
            </Text>
            <Text
              style={[
                styles.customModalMessage,
                { color: theme.textSecondary },
              ]}
            >
              {modalState.message}
            </Text>

            {modalState.type === "confirm" ||
            modalState.type === "confirm_mystery" ||
            modalState.type === "confirm_bank" ? (
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: theme.buttonNeutral, marginRight: 8 },
                  ]}
                  onPress={closeModal}
                >
                  <Text style={[styles.modalBtnText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        modalState.type === "confirm_mystery"
                          ? "#9b59b6"
                          : modalState.type === "confirm_bank"
                            ? "#27ae60"
                            : theme.buttonPrimary,
                    },
                  ]}
                  onPress={handleModalExecute}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                    {modalState.type === "confirm_mystery"
                      ? "Open Box"
                      : modalState.type === "confirm_bank"
                        ? "Stake Now"
                        : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.modalFullBtn,
                  { backgroundColor: theme.buttonPrimary },
                ]}
                onPress={closeModal}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  {modalState.type === "error" ? "Okay" : "Awesome"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  headerSide: { width: 110, justifyContent: "center" },
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

  scrollContent: { padding: 20, paddingBottom: 100 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", height: "100%" },

  carouselContainer: { marginBottom: 20 },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroContent: { flex: 1, paddingRight: 10 },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  heroDesc: { fontSize: 12, lineHeight: 16 },

  pagination: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },

  // --- ECO-BANK STYLES ---
  bankCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  bankInfo: { flex: 1, marginLeft: 15 },
  bankTitle: { fontSize: 18, fontWeight: "900", marginBottom: 3 },
  bankDesc: { fontSize: 12, lineHeight: 16 },
  bankBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.2)",
    paddingTop: 15,
  },
  bankBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bankBtnText: {
    fontSize: 14,
    fontWeight: "900",
  },

  // --- TREE CARD STYLES ---
  treeCardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  treeImageBase: { width: "100%", justifyContent: "flex-end", minHeight: 220 },
  treeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  treeContent: { padding: 20, zIndex: 1 },
  treeTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  treeDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
  },
  treeProgressWrapper: { marginBottom: 15 },
  treeProgressContainer: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  treeProgressBar: {
    width: "25%",
    height: "100%",
    backgroundColor: "#2ecc71",
    borderRadius: 4,
  },
  treeProgressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "right",
  },
  treeBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  treeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sectionContainer: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 5,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: (width - 55) / 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  cardDesc: { fontSize: 11, lineHeight: 15, height: 30, marginBottom: 12 },

  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    width: "100%",
  },
  buyBtnText: { fontSize: 13, fontWeight: "900" },

  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 50 },
  emptyStateText: { fontSize: 14, fontWeight: "bold", marginTop: 15 },

  floatingMysteryBox: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#9b59b6",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#9b59b6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    marginLeft: 8,
  },

  historyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  historyModalContainer: {
    height: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  historyTitle: { fontSize: 20, fontWeight: "900" },
  emptyHistory: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyHistoryText: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  txTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  customModalContainer: {
    width: "85%",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  customModalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modalFullBtn: {
    width: "100%",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15, fontWeight: "bold" },
});
