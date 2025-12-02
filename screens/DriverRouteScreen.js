import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { serverUrl } from '../config';
import { checkpointsList as checkpoints } from '../config';
import AddCheckpointModal from '../components/AddCheckpointModal';
import * as Location from 'expo-location';
import { formatDate, formatDateFull } from '../utils/dateUtils';
import CheckpointsList from '../components/CheckpointsList';
import PulseIcon from '../components/PulseIcon';

const DriverRouteScreen = (item) => {

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkpointUpdate, setCheckpointUpdate] = useState(false);

  const handleAddCheckpoint = async (checkpoint) => {
    setCheckpointUpdate(true);
    const token = await AsyncStorage.getItem('token');
    checkpoint = { name: checkpoint.name, date: new Date() };
    try {
      setModalVisible(false);
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
          }, 10000); // Таймаут - 5 секунд
        })
      ]);
      checkpoint.longitude = location.coords.longitude;
      checkpoint.latitude = location.coords.latitude;
      console.log(location);
      console.log(route);
    } catch (error) {
      console.log(error);
    } finally {
      console.log('post request', checkpoint);
      axios.post(`${serverUrl}/api/routes/${route._id}/checkpoints`, checkpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          setCheckpointUpdate(false);
          alert('Статус змінено!');
          console.log('Статус змінено', response.data);

          loadRoute(item.route.params);
        })
        .catch(error => {
          alert('Помилка при оновлені статуса: ' + error);
          setCheckpointUpdate(false);
        });
    }
  };

  const fetchRoute = async (id) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(`${serverUrl}/api/routes/${id}`, {
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

  const loadRoute = async (id) => {
    const data = await fetchRoute(id);
    console.log('data', data)
    if (data) {
      console.log('data[0]', data);
      setRoute(data);

    }
    setLoading(false);

  };

  useEffect(() => {
    console.log('use effect');
    loadRoute(item.route.params);

    const intervalId = setInterval(() => {
      console.log('use effect');
      loadRoute(item.route.params);
    }, 60000); // 5000 миллисекунд = 5 секунд

    return () => clearInterval(intervalId); // очищаем интервал при удалении компонента
  }, []); // пустой массив зависимостей говорит о том, что эффект нужно вызвать только один раз

  if (checkpointUpdate) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', fontSize: RFValue(12) }}>Статус рейса оновлюється... </Text>
      </View>
    )
  }
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', fontSize: RFValue(12) }}> Завантаження ... </Text>
      </View>
    )
  }

  console.log('route1', route);
  if (route) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'tomato' }}>{route.point_load.city}</Text>
            <View style={{ position: 'relative' }}>
              <Icon name="long-arrow-right" size={60} color='tomato' />
              <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), color: 'grey', position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: 6 }] }}>{route.distance} км</Text>
            </View>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'tomato' }}>{route.point_unload.city}</Text>
          </View>


          <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: 'tomato' }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} >
              <TouchableOpacity onPress={() => { openMapWithAddress(route.point_load.country + " " + route.point_load.region + " " + route.point_load.city + " " + route.point_load.street + " " + route.point_load.building) }}>
                <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{formatDateFull(route.load_date)}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_load.city}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }} >{route.point_load.street} {route.point_load.building}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_load.region}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_load.country}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {openMapWithAddress(route.point_unload.country + " " + route.point_unload.region + " " + route.point_unload.city + " " + route.point_unload.street + " " + route.point_unload.building) }}>
                <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{formatDateFull(route.unload_date)}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_unload.city}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_unload.street} {route.point_unload.building}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_unload.region}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{route.point_unload.country}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.persons}>
            <View>
              <Text style={styles.fieldTitle}>Водій:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${route.driver.phone}`)}>
                {route.driver.last_name} {route.driver.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Клієнт:</Text>
              <Text style={styles.personText} >{route.client.name}</Text>
            </View>

            <View>
              <Text style={styles.fieldTitle}>Логіст:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${route.logist.phone}`)}>
                {route.logist.last_name} {route.logist.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Наступний логіст:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${route.next_logist.phone}`)}>
                {route.next_logist.last_name} {route.next_logist.first_name}
              </Text>
            </View>

          </View>
          <View style={styles.otherDetails}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <View style={{ paddingRight: 10 }}>
                <Text style={styles.fieldTitle}>Номер авто: </Text>
                <Text style={styles.fieldText}>{route.truck.number}</Text>
              </View>
              <View style={{ paddingLeft: 10 }}>
                <Text style={styles.fieldTitle}>Номер причепа: </Text>
                <Text style={styles.fieldText}>{route.trailer.number}</Text>
              </View>
            </View>
            <View style={{ paddingTop: 10 }}>
              <Text style={styles.fieldTitle}>Коментар до маршруту: </Text>
              <Text style={[styles.fieldText, {fontSize: RFValue(15), color: 'tomato'}]}>{route.comment ? route.comment : 'Не вказано'}</Text>
            </View>

          </View>

        </View>
        <Text style={[styles.fieldTitle, { paddingLeft: 10, fontSize: RFValue(12), paddingBottom: 5 }]}>Статуси рейса: </Text>
        <CheckpointsList checkpoints={route.checkpoints} />
        <View style={{ padding: 10 }}>
          <Text style={{ textAlign: 'center', paddingBottom: 10, fontFamily: 'OpenSans', }}>Оновити статус рейса:</Text>
          <TouchableOpacity style={[styles.button, { alignSelf: 'center' }]} onPress={() => { setModalVisible(true); Vibration.vibrate(25) }} >
            {modalVisible && (
              <AddCheckpointModal
                checkpoints={checkpoints}
                onAddCheckpoint={handleAddCheckpoint}
                onClose={() => setModalVisible(false)}
                currentCheckpoint={route.checkpoints[route.checkpoints.length - 1]}
              />
            )}
            <PulseIcon />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', fontSize: RFValue(12) }}>На даний момент нових рейсів немає! </Text>
    </View>

  )

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',



  },
  header: {
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
  routeDetailsText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans',

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
    fontWeight: 'bold'

  },
  fieldTitle: {
    fontSize: RFValue(10),
    fontFamily: 'OpenSans',

  },
  fieldText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans',
    fontWeight: 'bold'
  },
  otherDetails: {
    padding: 10,
    alignItems: 'center'
  }
});

export default DriverRouteScreen;