import React from "react";
import { BudgetWidget } from "./src/widgets/BudgetWidget";
import { supabase } from "./src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;

  if (widgetInfo.widgetName === "BudgetWidget") {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return <BudgetWidget cost="0.00" budget="0" percentage={0} dailyAvg="0.00" forecast="0.00" />;
      }

      const { data: userSettings } = await supabase
        .from("users")
        .select("monthly_budget, bill_cycle_day, custom_rate, utility_rates(rate_per_kwh)")
        .eq("id", user.id)
        .single();

      const budget = userSettings?.monthly_budget || 0;
      const cycleDay = userSettings?.bill_cycle_day || 1;
      let rate = 12.0;
      if (userSettings?.custom_rate) rate = userSettings.custom_rate;
      else if (userSettings?.utility_rates?.rate_per_kwh) rate = userSettings.utility_rates.rate_per_kwh;

      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay);
      if (now.getDate() < cycleDay) {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, cycleDay);
      }
      const startDateStr = startDate.toISOString();

      const { data: usageData } = await supabase
        .from("usage_analytics")
        .select("cost_incurred")
        .eq("user_id", user.id)
        .gte("date", startDateStr);

      const totalCost = usageData?.reduce((sum, row) => sum + (row.cost_incurred || 0), 0) || 0;

      const diffTime = Math.abs(now - startDate);
      const daysElapsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const dailyAvg = totalCost / daysElapsed;

      const forecast = dailyAvg * 30;

      const percentage = budget > 0 ? (totalCost / budget) * 100 : 0;

      let barColor = "#00A651"; 
      if (percentage >= 90) barColor = "#ef4444"; 
      else if (percentage >= 75) barColor = "#ffaa00"; 

      // Retrieve saved theme preference, default to dark if not set
      const storedTheme = await AsyncStorage.getItem("widget_theme_is_dark");
      const isDarkMode = storedTheme !== null ? JSON.parse(storedTheme) : true;

      return (
        <BudgetWidget
          cost={totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          budget={budget}
          percentage={percentage}
          dailyAvg={dailyAvg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          forecast={forecast.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          barColor={barColor}
          isDarkMode={isDarkMode}
        />
      );
    } catch (e) {
      console.log("Widget Update Error:", e);
      return (
        <BudgetWidget 
          {...props} 
          cost={props.cost || "Error"} 
          budget={props.budget || 0}
        />
      );
    }
  }
  return null;
}

export { BudgetWidget };
