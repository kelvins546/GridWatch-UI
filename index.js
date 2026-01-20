// 1. Add these lines at the VERY TOP
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./widget-task-handler";

registerWidgetTaskHandler(widgetTaskHandler);

// 2. Your existing code follows below
import { registerRootComponent } from "expo";
import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
