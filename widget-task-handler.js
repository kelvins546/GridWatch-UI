import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function BudgetWidget({ cost, budget, usage }) {
  const safeUsage = Number(usage) || 0;
  const safeBudget = Number(budget) || 1;
  const rawPercent = (safeUsage / safeBudget) * 100;
  const percentage = Math.min(Math.round(rawPercent), 100);

  const barColor = percentage > 90 ? "#ef4444" : "#00A651";

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#18181b",
        borderRadius: 16,
        padding: 16,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "match_parent",
        }}
      >
        <TextWidget
          text="TOTAL SPENDING"
          style={{
            color: "#a1a1aa",
            fontSize: 12,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        />
        <TextWidget
          text="GridWatch"
          style={{
            color: "#00A651",
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
          color: "#ffffff",
          fontSize: 32,
          fontWeight: "bold",
          marginTop: 8,
          marginBottom: 8,
        }}
      />

      {}
      <FlexWidget style={{ flexDirection: "column", width: "match_parent" }}>
        {}
        <FlexWidget
          style={{
            height: 8,
            width: "match_parent",
            backgroundColor: "#27272a",
            borderRadius: 4,
            marginBottom: 6,
          }}
        >
          {}
          <FlexWidget
            style={{
              height: "match_parent",
              width: `${percentage}%`,
              backgroundColor: barColor,
              borderRadius: 4,
            }}
          />
        </FlexWidget>

        {}
        <FlexWidget
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "match_parent",
          }}
        >
          <TextWidget
            text={`${percentage}% Used`}
            style={{ color: barColor, fontSize: 12, fontWeight: "bold" }}
          />
          <TextWidget
            text={`Limit: ₱${safeBudget.toLocaleString()}`}
            style={{ color: "#71717a", fontSize: 11 }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
