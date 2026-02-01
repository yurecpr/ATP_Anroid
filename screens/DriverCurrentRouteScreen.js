import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { serverUrl } from '../config';
import { checkpointsList as checkpoints } from '../config';
import * as Location from 'expo-location';
import { formatDate, formatDateFull } from '../utils/dateUtils';
import CheckpointsList from '../components/CheckpointsList';
import PulseIcon from '../components/PulseIcon';
import openMapWithAddress from '../components/openMapWithAddress';

// Предполагаем, что этот компонент является экраном и получает navigation через props
const DriverCurrentRouteScreen = ({ route, navigation }) => {
  console.log('routeParams', route);
  const { user } = route.params;
  const [currentRoute, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkpointUpdate, setCheckpointUpdate] = useState(false);

  const handleAddCheckpoint = async (checkpoint) => {
    setCheckpointUpdate(true);
    const token = await AsyncStorage.getItem('token');
    checkpoint = { name: checkpoint.name, date: new Date() };
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
      console.log('try get geo');
      let location = await Promise.race([
        Location.getCurrentPositionAsync({}),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout exceeded'));
          }, 10000);
        })
      ]);
      checkpoint.longitude = location.coords.longitude;
      checkpoint.latitude = location.coords.latitude;
      console.log(location);
      console.log(currentRoute);
    } catch (error) {
      console.log(error);
    } finally {
      console.log('post request', checkpoint);
      axios.post(`${serverUrl}/api/routes/${currentRoute._id}/checkpoints`, checkpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          setCheckpointUpdate(false);
          alert('Статус змінено!');
          console.log('Статус змінено', response.data);
          loadRoute(user);
        })
        .catch(error => {
          alert('Помилка при оновлені статуса: ' + error);
          setCheckpointUpdate(false);
        });
    }
  };

  const fetchCurrentRoute = async (user) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(`${serverUrl}/api/routes/driver/current/${user._id}`, {
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

  const loadRoute = async (user) => {
    const data = await fetchCurrentRoute(user);
    console.log('data', data);
    if (data) {
      console.log('route', data);
      console.log('route_id:', data.route_id);
      setRoute(data);
    } else {
      setRoute(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log('use effect');
    loadRoute(user);

    const intervalId = setInterval(() => {
      console.log('use effect');
      loadRoute(user);
    }, 60000); // обновление каждые 60 секунд

    return () => clearInterval(intervalId);
  }, []);

  if (checkpointUpdate) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', fontSize: RFValue(12) }}>
          Статус рейса оновлюється...
        </Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', fontSize: RFValue(12) }}>
          Завантаження...
        </Text>
      </View>
    );
  }

  if (currentRoute) {
    return (
      <View style={styles.container}>
        <ScrollView 
          style={{ height: 350 }} 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
            <Text
              style={{
                fontFamily: 'OpenSans',
                fontSize: RFValue(12),
                fontWeight: 'bold',
                borderBottomWidth: 1,
                borderBottomColor: 'tomato'
              }}
              onPress={() => {
                openMapWithAddress(
                  `${currentRoute.point_load.country} ${currentRoute.point_load.region} ${currentRoute.point_load.city} ${currentRoute.point_load.street} ${currentRoute.point_load.building}`
                );
              }}
            >
              {currentRoute.point_load.city}
            </Text>
            <View style={{ position: 'relative' }}>
              <Icon name="long-arrow-right" size={60} color='tomato' />
              <Text
                style={{
                  fontFamily: 'OpenSans',
                  fontSize: RFValue(12),
                  color: 'grey',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -30 }, { translateY: 6 }]
                }}
              >
                {currentRoute.distance} км
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'OpenSans',
                fontSize: RFValue(12),
                fontWeight: 'bold',
                borderBottomWidth: 1,
                borderBottomColor: 'tomato'
              }}
              onPress={() => {
                openMapWithAddress(
                  `${currentRoute.point_unload.country} ${currentRoute.point_unload.region} ${currentRoute.point_unload.city} ${currentRoute.point_unload.street} ${currentRoute.point_unload.building}`
                );
              }}
            >
              {currentRoute.point_unload.city}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: 'tomato' }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                openMapWithAddress(
                  `${currentRoute.point_load.country} ${currentRoute.point_load.region} ${currentRoute.point_load.city} ${currentRoute.point_load.street} ${currentRoute.point_load.building}`
                );
              }}>
                <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {formatDateFull(currentRoute.load_date)}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_load.city}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_load.street} {currentRoute.point_load.building}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_load.region}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_load.country}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                openMapWithAddress(
                  `${currentRoute.point_unload.country} ${currentRoute.point_unload.region} ${currentRoute.point_unload.city} ${currentRoute.point_unload.street} ${currentRoute.point_unload.building}`
                );
              }}>
                <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {formatDateFull(currentRoute.unload_date)}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_unload.city}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_unload.street} {currentRoute.point_unload.building}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_unload.region}
                </Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>
                  {currentRoute.point_unload.country}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.persons}>
            <View>
              <Text style={styles.fieldTitle}>Водій:</Text>
              <Text
                style={styles.personText}
                onPress={() => Linking.openURL(`tel:${currentRoute.driver.phone}`)}
              >
                {currentRoute.driver.last_name} {currentRoute.driver.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Клієнт:</Text>
              <Text style={styles.personText}>
                {currentRoute.client.name}
              </Text>
            </View>

            <View>
              <Text style={styles.fieldTitle}>Логіст:</Text>
              <Text
                style={styles.personText}
                onPress={() => Linking.openURL(`tel:${currentRoute.logist.phone}`)}
              >
                {currentRoute.logist.last_name} {currentRoute.logist.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Наступний логіст:</Text>
              <Text
                style={styles.personText}
                onPress={() => Linking.openURL(`tel:${currentRoute.next_logist.phone}`)}
              >
                {currentRoute.next_logist.last_name} {currentRoute.next_logist.first_name}
              </Text>
            </View>
          </View>
          <View style={styles.otherDetails}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.fieldTitle}>Номер авто: </Text>
                <Text style={styles.fieldText}>{currentRoute.truck.number}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.fieldTitle}>Номер причепа: </Text>
                <Text style={styles.fieldText}>{currentRoute.trailer.number}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.fieldTitle}>Номер рейсу: </Text>
                <Text style={styles.fieldText}>{currentRoute.route_id}</Text>
              </View>
            </View>
            <View style={{ paddingTop: 10 }}>
              <Text style={styles.fieldTitle}>Коментар до маршруту: </Text>
              <Text style={[styles.fieldText, { fontSize: RFValue(15), color: 'tomato' }]}>
                {currentRoute.comment ? currentRoute.comment : 'Не вказано'}
              </Text>
            </View>
          </View>
        </View>
        </ScrollView>
        
        <View style={{ flex: 1, paddingTop: 5 }}>
          <Text style={[styles.fieldTitle, { paddingLeft: 10, fontSize: RFValue(12), paddingBottom: 5 }]}>
            Статуси рейса:
          </Text>
          <CheckpointsList checkpoints={currentRoute.checkpoints} />
        </View>
        
        <View style={{ padding: 10, paddingTop: 5, backgroundColor: '#fff' }}>
          <Text style={{ textAlign: 'center', paddingBottom: 10, fontFamily: 'OpenSans', }}>Оновити статус рейса:</Text>
          <TouchableOpacity
            style={[styles.button, { alignSelf: 'center' }]}
            onPress={() => {
              Vibration.vibrate(25);
              navigation.navigate('CheckpointSelectionScreen', {
                checkpoints: checkpoints,
                currentCheckpoint: currentRoute.checkpoints[currentRoute.checkpoints.length - 1],
                onAddCheckpoint: handleAddCheckpoint,
              });
            }}
          >
            <PulseIcon />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={{ textAlign: 'center', fontSize: RFValue(12) }}>
        На даний момент нових рейсів немає!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    // здесь можно добавить стили для шапки
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#008000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDetails: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'tomato',
  },
  persons: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
  },
  personText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans',
    fontWeight: 'bold',
  },
  fieldTitle: {
    fontSize: RFValue(10),
    fontFamily: 'OpenSans',
  },
  fieldText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans',
    fontWeight: 'bold',
  },
  otherDetails: {
    padding: 10,
    alignItems: 'center',
  },
});

export default DriverCurrentRouteScreen;
