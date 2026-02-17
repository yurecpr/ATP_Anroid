import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import TrucksScreen from "./screens/TrucksScreen";
import RouteDetails from "./screens/RouteDetails";
import DriverRoutesScreen from './screens/DriverRoutesScreen';
import NewRouteScreen from './screens/NewRouteScreen';
import Splash from './screens/Splash';
import { gStyle } from './styles/style';
import EditRouteScreen from './screens/EditRouteScreen';
import DriverCurrentRouteScreen from './screens/DriverCurrentRouteScreen';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import DriverRouteScreen from './screens/DriverRouteScreen';
import MainScreen from './screens/MainScreen';
import PostScreen from './screens/PostScreen';
import NewsScreen from './screens/NewsScreen';
import ManualsScreen from './screens/ManualsScreen';
import { CommonActions } from '@react-navigation/native';
import { serverUrl, appVersion } from './config';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import axios from 'axios';
import Loading from './screens/Loading';
import UpdateInvoice from './screens/UpdateInvoice';
import CheckpointSelectionScreen from './screens/CheckpointSelectionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Navigate = () => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = React.useRef();
  const [needToUpdate, setNeedToUpdate] = useState(false);
  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    addPushToken(newUser, newToken);
  };

  async function checkAppVersion (userObj){
    try {
      const currentVersion = appVersion;
      const token = await AsyncStorage.getItem('token');
    
      const response = await axios.get(`${serverUrl}/api/version`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      const serverVersion = response.data.version;
      console.log('server version', serverVersion);
      console.log('current version', currentVersion);
      console.log('user code', userObj?.code);
      console.log(currentVersion === serverVersion);
      
      // Перевірка оновлення тільки для тестового користувача з кодом 'Brem'
      if (currentVersion !== serverVersion && userObj?.code === 'Brem'){
        console.log('Показуємо оновлення для тестового користувача');
        setNeedToUpdate(true);
        return true; // Потрібне оновлення
      }
      return false; // Оновлення не потрібне
    } catch (error) {
      console.error(error);
      return false;
    }
  };
  
async function addPushToken(user, token) {
  let pushToken = await AsyncStorage.getItem('expoPushToken');
  console.log(pushToken);
user.pushToken = pushToken;
  axios.put(`${serverUrl}/api/users`, {_id: user._id, pushToken: pushToken}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

}


  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('token', token);

      const userObj = JSON.parse(await AsyncStorage.getItem('user') ?? 'null');
      console.log('userObj', userObj);

      if (token !== null && userObj !== null) {
        setToken(token);
        setUser(userObj);
        
        // Перевіряємо версію для цього користувача
        const needUpdate = await checkAppVersion(userObj);
        
        // Якщо не потрібно оновлення, переходимо в додаток
        if (!needUpdate) {
          await addPushToken(userObj, token);
          navigationRef.current?.navigate('Root');
        }

        console.log('user', userObj);
      } else {
        navigationRef.current?.navigate('Auth');
      }
    } catch (error) {
      navigationRef.current?.navigate('Auth');
      console.log(error);
    }

  }
  useEffect(() => {
    console.log('useEffect');
    getToken();
    setLoading(false);
  }, []);

  const handleLogout = async (navigation) => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);

      navigationRef.current?.navigate('Auth');
      console.log('set null user and token');
    } catch (error) {
      console.log(error);
      console.log('error set null user and token');
    }
  };
  const getHeaderRight = () => {
    return (
      <Button
        onPress={handleLogout}
        title="Вийти"
        color="#000"

      />
    );
  };

  const AuthStack = () => (
    <Stack.Navigator>
      <Stack.Screen name='Login' options={{ headerShown: false }}>
        {props => <LoginScreen {...props} onLogin={handleLogin} />}
      </Stack.Screen>
      <Stack.Screen name='Register' options={{ headerShown: false }}>
        {props => <RegisterScreen {...props} onLogin={handleLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
  const RootStack = () => {
    console.log('rootscreen user', user);
    return (
      <Stack.Navigator>
        <Stack.Screen name="MainScreen" component={MainScreen} options={{ 
          title: "ATP-16363", 
          headerShown: true, 
          headerRight: getHeaderRight, 
          headerLeft: () => { }
        }}>
        </Stack.Screen>
        <Stack.Screen name='Trucks' component={TrucksScreen} options={{ title: 'Список авто' }} />
        <Stack.Screen name='DriverCurrentRoute' component={DriverCurrentRouteScreen} options={{ title: 'Поточний рейс' }} initialParams={{ user: user }} />
        <Stack.Screen name='PostScreen' component={PostScreen} options={{ title: 'Новина' }} />
        <Stack.Screen name='NewsScreen' component={NewsScreen} options={{ title: 'Новини' }} />
        <Stack.Screen name='ManualsScreen' component={ManualsScreen} options={{ title: 'Інструкції та контакти' }} />
        <Stack.Screen name='DriverRoutes' component={DriverRoutesScreen} options={{ title: 'Мої рейси' }} />
        <Stack.Screen name='RouteDetails' component={RouteDetails} options={{ title: 'Маршрути по авто' }} />
        <Stack.Screen name='NewRouteScreen' component={NewRouteScreen} options={{ title: 'Новий рейс' }} />
        <Stack.Screen name='EditRouteScreen' component={EditRouteScreen} options={{ title: 'Редагувати рейс' }} />
        <Stack.Screen name='DriverRouteScreen' component={DriverRouteScreen} options={{ title: 'Деталі рейса' }} />
        <Stack.Screen name='CheckpointSelectionScreen' component={CheckpointSelectionScreen} options={{ title: 'Зміна статусу' }} />
      </Stack.Navigator>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {needToUpdate ? (<Stack.Screen name="UpdateInvoice" options={{ headerShown: false }} component={UpdateInvoice} />) : (
          <Stack.Group>
            {loading ? (<Stack.Screen name="Splash" options={{ headerShown: false }} component={Splash} />) : (null)}
            <Stack.Screen name='Root' options={{ headerShown: false }} component={RootStack} />
            <Stack.Screen name='Auth' options={{ headerShown: false }} component={AuthStack} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

}

export default Navigate;