import React, { useState, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { gStyle } from "./styles/style";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RegisterScreen from "./screens/RegisterScreen";
import LoginScreen from "./screens/LoginScreen";
import TrucksScreen from "./screens/TrucksScreen";
import RouteDetails from "./screens/RouteDetails";
import DriverRoutesScreen from "./screens/DriverRoutesScreen";
import MainStack from "./navigate";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

let customFonts = {
  OpenSans: require("./assets/OpenSans.ttf"),
};

export default function App({ navigation }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const _loadFontsAsync = async () => {
    await Font.loadAsync(customFonts);
    setFontsLoaded(true);
  };

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token for push notification!");
        return;
      }

      token = (await Notifications.getDevicePushTokenAsync()).data;//(await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo Push Token:", token);

      // Сохраняем токен в локальное хранилище
      await AsyncStorage.setItem("expoPushToken", token);
    } else {
      Alert.alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  useEffect(() => {
    _loadFontsAsync();

    // Регистрируем устройство для получения токенов
    async function getPushNotificationToken() {
      const token = await registerForPushNotificationsAsync();
      console.log("Push Notification Token:", token);
    }

    getPushNotificationToken();

    // Слушатели для уведомлений
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received!", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received!", response);
      });

    return () => {
      // Удаляем слушатели
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return <MainStack navigation={navigation} />;
}
