import { View, Text, Button, FlatList, TouchableOpacity, RefreshControl, Vibration, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {serverUrl} from '../config';
import {gStyle} from '../styles/style';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatDateFull } from '../utils/dateUtils';
import Loading from './Loading';


const fetchRoutes = async () => {
  const token = await AsyncStorage.getItem('token');
  const user = JSON.parse(await AsyncStorage.getItem('user') ?? 'null');
  console.log('userId', user._id)
  try {
    const response = await axios.get(`${serverUrl}/api/routes/driver/${user._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

function calculateDistanceCurrentMonth(routes) {
  // Получаем текущую дату и первый день текущего месяца
  const currentDate = new Date();
  const currentMonthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Отфильтровываем все рейсы за текущий месяц, которые содержат чекпоинт с именем "Водій завершив рейс"
  const routesCurrentMonth = routes.filter(route => {
    const lastCheckpoint = route.checkpoints[route.checkpoints.length - 1];
    return lastCheckpoint.name === 'Рейс завершено'
      && new Date(route.creation_date) >= currentMonthFirstDay
      && new Date(route.creation_date) <= currentDate;
  });

  // Для каждого рейса вычисляем дистанцию и суммируем их
  const distanceCurrentMonth = routesCurrentMonth.reduce((acc, route) => {
    return acc + route.distance;
  }, 0);

  return distanceCurrentMonth;
}


const DriverRoutesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

    
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadRoutes = async (_id) => {
    setLoading(true);
    const data = await fetchRoutes(_id);
    console.log('data', data)
    if (data) {
      setRoutes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  if (loading) {
    return <Loading/>
  }
  const renderItem = ({ item }) => (
    <TouchableOpacity
    onPress={() => {
      console.log('truck', item);
      Vibration.vibrate(25);
      navigation.navigate('DriverRouteScreen', item._id);
    }}
  >
    <View
      style={[
        styles.container,
        item.checkpoints[item.checkpoints.length - 1].name === 'Рейс завершено' && styles.completed,
        item.checkpoints[item.checkpoints.length - 1].name === 'Рейс створено, водій ще не прийняв' && styles.pending,
      ]}
    >
      <Text style={styles.text}>
        {item.truck.number} | {item.checkpoints[item.checkpoints.length - 1].name}
      </Text>
      <View>
        <Text style={styles.loadUnloadText}>
          {item.point_load.city} - {item.point_unload.city}
        </Text>
        <Text style={styles.loadUnloadText}>
          {formatDateFull(item.load_date)} |{' '}
          {formatDateFull(item.unload_date)}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
  
  );
  

  return (
    <View style={{ flex: 1 }}>
    <Text style={{ padding: 10, fontSize:RFValue(14), fontFamily:'OpenSans', color: 'red' }}>Пробіг за поточний місяць: {calculateDistanceCurrentMonth(routes)} км</Text>
    <FlatList
    data={routes}
    renderItem={renderItem}
    keyExtractor={(item) => item._id}
    refreshControl={
    <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
       />
    }
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#D2FFEB',
  },
  completed: {
    backgroundColor: '#e0dcdc',
  },
  pending: {
    backgroundColor: 'orange',
  },
  text: {
    color: 'black',
    fontSize: RFValue(12),
    fontFamily: 'OpenSans'
  },
  loadUnloadText: {
    fontFamily: 'OpenSans',
    fontSize: RFValue(10),
    color: 'black',
  },
});

  export default DriverRoutesScreen;