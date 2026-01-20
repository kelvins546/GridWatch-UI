import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function BudgetWidget({ budget, usage, cost }) {
  // 1. Calculate Percentage
  const safeUsage = Number(usage) || 0;
  const safeBudget = Number(budget) || 1;
  const rawPercent = (safeUsage / safeBudget) * 100;
  const percentage = Math.min(Math.round(rawPercent), 100);

  // 2. Colors from your App Theme
  const COLORS = {
    bg: "#18181b", // Dark Card Background
    track: "#27272a", // Zinc-800
    primary: "#00A651", // Your Brand Green
    textMain: "#ffffff", // White
    textSub: "#71717a", // Zinc-500
    divider: "#3f3f46", // Zinc-700
  };

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        borderRadius: 22, // Match rounded-2xl
        padding: 16,
        flexDirection: "column",
        justifyContent: "flex-start", // Push items to top, don't stretch them
      }}
    >
      {/* --- HEADER ROW: "TOTAL SPENDING" & LOGO --- */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          width: "match_parent",
        }}
      >
        <TextWidget
          text="TOTAL SPENDING"
          style={{
            color: COLORS.textSub,
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 1.5, // tracking-widest
          }}
        />
        {/* Simulating the Logo with Text because Images require base64 in widgets */}
        <TextWidget
          text="GridWatch"
          style={{
            color: COLORS.primary,
            fontSize: 12,
            fontWeight: "bold",
            fontStyle: "italic",
          }}
        />
      </FlexWidget>

      {/* --- BIG PRICE --- */}
      <TextWidget
        text={`₱ ${cost}`}
        style={{
          color: COLORS.textMain,
          fontSize: 28, // Scaled for widget
          fontWeight: "bold",
          marginBottom: 16,
        }}
      />

      {/* --- PROGRESS BAR --- */}
      <FlexWidget
        style={{
          flexDirection: "column",
          width: "match_parent",
          marginBottom: 16,
        }}
      >
        {/* Track */}
        <FlexWidget
          style={{
            height: 8,
            width: "match_parent",
            backgroundColor: COLORS.track,
            borderRadius: 4,
            marginBottom: 6,
          }}
        >
          {/* Fill */}
          <FlexWidget
            style={{
              height: "match_parent",
              width: `${percentage}%`, // Dynamic Width
              backgroundColor: COLORS.primary,
              borderRadius: 4,
            }}
          />
        </FlexWidget>

        {/* "48% of Budget Used" */}
        <TextWidget
          text={`${percentage}% of Budget Used`}
          style={{
            color: COLORS.primary,
            fontSize: 11,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      {/* --- DIVIDER LINE --- */}
      <FlexWidget
        style={{
          height: 1,
          width: "match_parent",
          backgroundColor: COLORS.track,
          marginBottom: 12,
        }}
      />

      {/* --- FOOTER STATS (Daily Avg | Forecast) --- */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Stat 1: Daily Avg */}
        <FlexWidget style={{ flexDirection: "column", marginRight: 16 }}>
          <TextWidget
            text="DAILY AVG"
            style={{ color: COLORS.textSub, fontSize: 10, fontWeight: "bold" }}
          />
          <TextWidget
            text="₱ 120.50"
            style={{
              color: COLORS.textMain,
              fontSize: 14,
              fontWeight: "bold",
              marginTop: 2,
            }}
          />
        </FlexWidget>

        {/* Vertical Separator */}
        <FlexWidget
          style={{
            width: 1,
            height: 24,
            backgroundColor: COLORS.track,
            marginHorizontal: 12,
          }}
        />

        {/* Stat 2: Forecast */}
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text="FORECAST"
            style={{ color: COLORS.textSub, fontSize: 10, fontWeight: "bold" }}
          />
          <TextWidget
            text="₱ 3,615"
            style={{
              color: COLORS.textMain,
              fontSize: 14,
              fontWeight: "bold",
              marginTop: 2,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
