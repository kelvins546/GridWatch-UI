import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function BudgetWidget({ budget, usage, cost }) {
  const safeUsage = Number(usage) || 0;
  const safeBudget = Number(budget) || 1;
  const rawPercent = (safeUsage / safeBudget) * 100;
  const percentage = Math.min(Math.round(rawPercent), 100);

  const COLORS = {
    bg: "#18181b",
    track: "#27272a",
    primary: "#00A651",
    textMain: "#ffffff",
    textSub: "#71717a",
    divider: "#3f3f46",
  };

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        borderRadius: 22,
        padding: 16,
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {}
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
            letterSpacing: 1.5,
          }}
        />
        {}
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

      {}
      <TextWidget
        text={`₱ ${cost}`}
        style={{
          color: COLORS.textMain,
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 16,
        }}
      />

      {}
      <FlexWidget
        style={{
          flexDirection: "column",
          width: "match_parent",
          marginBottom: 16,
        }}
      >
        {}
        <FlexWidget
          style={{
            height: 8,
            width: "match_parent",
            backgroundColor: COLORS.track,
            borderRadius: 4,
            marginBottom: 6,
          }}
        >
          {}
          <FlexWidget
            style={{
              height: "match_parent",
              width: `${percentage}%`,
              backgroundColor: COLORS.primary,
              borderRadius: 4,
            }}
          />
        </FlexWidget>

        {}
        <TextWidget
          text={`${percentage}% of Budget Used`}
          style={{
            color: COLORS.primary,
            fontSize: 11,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      {}
      <FlexWidget
        style={{
          height: 1,
          width: "match_parent",
          backgroundColor: COLORS.track,
          marginBottom: 12,
        }}
      />

      {}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        {}
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

        {}
        <FlexWidget
          style={{
            width: 1,
            height: 24,
            backgroundColor: COLORS.track,
            marginHorizontal: 12,
          }}
        />

        {}
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
