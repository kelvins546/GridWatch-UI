import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function BudgetWidget({ cost, budget, percentage, dailyAvg, forecast, barColor, isDarkMode }) {
  const safeBudget = Number(budget) || 0;
  const safePercentage = Number(percentage) || 0;
  const progressPercent = Math.min(Math.max(safePercentage, 0), 100);
  const filledBarWidth = Math.round((268 * progressPercent) / 100);

  const finalBarColor = barColor || (safePercentage >= 90 ? "#ef4444" : safePercentage >= 75 ? "#ffaa00" : "#00A651");

  const COLORS = isDarkMode
    ? {
        bg: "#18181b",
        track: "#27272a",
        primary: finalBarColor,
        textMain: "#ffffff",
        textSub: "#71717a",
        divider: "#27272a",
      }
    : {
        bg: "#ffffff",
        track: "#e4e4e7",
        primary: finalBarColor,
        textMain: "#18181b",
        textSub: "#71717a",
        divider: "#e4e4e7",
      };

  return (
    <FlexWidget
      style={{
        height: 191,
        width: 324,
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 0,
        paddingBottom: 0,
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          width: "match_parent",
        }}
      >
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text="TOTAL SPENDING"
            style={{
              color: COLORS.textSub,
              fontSize: 10,
              fontWeight: "bold",
              letterSpacing: 1.5,
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`₱ ${cost}`}
            style={{
              color: COLORS.textMain,
              fontSize: 28,
              fontWeight: "bold",
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: "column", alignItems: "flex-end" }}>
          <TextWidget
            text="BUDGET LIMIT"
            style={{
              color: COLORS.textSub,
              fontSize: 10,
              fontWeight: "bold",
              letterSpacing: 1.5,
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`₱ ${safeBudget.toLocaleString()}`}
            style={{
              color: COLORS.textSub,
              fontSize: 14,
              fontWeight: "bold",
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {}
      <FlexWidget
        style={{
          flexDirection: "column",
          width: "match_parent",
          marginBottom: 12,
        }}
      >
        <FlexWidget
          style={{
            height: 6,
            width: "match_parent",
            backgroundColor: COLORS.track,
            borderRadius: 3,
            marginBottom: 8,
            flexDirection: "row",
          }}
        >
          <FlexWidget
            style={{
              height: "match_parent",
              width: filledBarWidth,
              backgroundColor: COLORS.primary,
              borderRadius: 3,
            }}
          />
        </FlexWidget>

        <TextWidget
          text={safeBudget > 0 ? `${safePercentage.toFixed(0)}% of Budget Used` : "No Limit Set"}
          style={{
            color: safeBudget > 0 ? COLORS.primary : COLORS.textSub,
            fontSize: 10,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{
          height: 1,
          width: "match_parent",
          backgroundColor: COLORS.divider,
          marginBottom: 12,
        }}
      />

      {/* Bottom Stats Section */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "match_parent",
        }}
      >
        {/* Daily Avg */}
        <FlexWidget
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        >
          <FlexWidget
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <TextWidget text="📈" style={{ fontSize: 14 }} />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: "column" }}>
            <TextWidget
              text="DAILY AVG"
              style={{
                color: COLORS.textSub,
                fontSize: 9,
                fontWeight: "bold",
              }}
            />
            <TextWidget
              text={`₱ ${dailyAvg}`}
              style={{
                color: COLORS.textMain,
                fontSize: 13,
                fontWeight: "bold",
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Vertical Divider */}
        <FlexWidget
          style={{
            width: 1,
            height: 24,
            backgroundColor: COLORS.divider,
            marginHorizontal: 8,
          }}
        />

        {/* Forecast */}
        <FlexWidget
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        >
          <FlexWidget
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <TextWidget text="📊" style={{ fontSize: 14 }} />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: "column" }}>
            <TextWidget
              text="FORECAST"
              style={{
                color: COLORS.textSub,
                fontSize: 9,
                fontWeight: "bold",
              }}
            />
            <TextWidget
              text={`₱ ${forecast}`}
              style={{
                color: COLORS.textMain,
                fontSize: 13,
                fontWeight: "bold",
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
