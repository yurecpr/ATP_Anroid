import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView, RefreshControl, FlatList, Vibration, Linking, PixelRatio } from 'react-native';
import axios from 'axios';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useNavigation } from '@react-navigation/native';
import { serverUrl } from '../config';
import AddCheckpointModal from '../components/AddCheckpointModal';
import MapWithRoute from '../components/MapWithRoute';
import { checkpointsList as checkpoints } from '../config';
import { calculateIdleTimeForCurrentMonth, formatDateFull } from '../utils/dateUtils';
import CheckpointsList from '../components/CheckpointsList';
import openMapWithAddress from '../components/openMapWithAddress';
const RouteDetails = ({ route }) => {

  const fetchRoutes = async (truck_id) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(`${serverUrl}/api/routes/trucks/` + truck_id, {
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
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes(route.params);
    setShowMap(false);
    setRefreshing(false);
  };
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [routeType, setRouteType] = useState('');

  const [statusExpanded, setStatusExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const handleAddCheckpoint = async (checkpoint) => {
    // Выполняем POST запрос на сервер, передавая id рейса и объект чекпоинта
    const token = await AsyncStorage.getItem('token');
    checkpoint = { name: checkpoint.name, date: new Date() }
    axios.post(`${serverUrl}/api/routes/${currentRoute._id}/checkpoints`, checkpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        alert('Статус змінено!');
        loadRoutes(route.params)
      })
      .catch(error => {
        console.log(error);
      });
    setModalVisible(false);
  };

  const loadRoutes = async (truck_id) => {
    setLoading(true);
    const data = await fetchRoutes(truck_id);

    if (data) {
      setRoutes(data);
      let flag = false;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].checkpoints.some(item => item.name === 'Водій прийняв рейс' || data[i].checkpoints[data[i].checkpoints.length-1].name !== 'Рейс створено, водій ще не прийняв')) {
          if (data[i].checkpoints[data[i].checkpoints.length - 1].name === 'Рейс завершено') {
            continue;
          } else {
            flag = true;
            setCurrentRouteIndex(i);
            setCurrentRoute(data[i]);
            break;
          }
        } else {
          flag = true;
          setCurrentRouteIndex(i);
          setCurrentRoute(data[i]);
        }
      }
      if (!flag) {
        setCurrentRouteIndex(data.length - 1);
        setCurrentRoute(data[data.length - 1]);
      }
      navigation.setOptions({ title: `Маршрути по авто ${data[0].truck.number}` })
    }

    setLoading(false);

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


  const previousRoute = () => {
    if (currentRouteIndex > 0) {
      setCurrentRouteIndex(currentRouteIndex - 1);
      setCurrentRoute(routes[currentRouteIndex - 1]);
      setStatusExpanded(false);
      setShowMap(false);
      Vibration.vibrate(25);
    }
  };

  const nextRoute = () => {
    if (currentRouteIndex < routes.length - 1) {
      setCurrentRouteIndex(currentRouteIndex + 1);
      setCurrentRoute(routes[currentRouteIndex + 1]);
      setStatusExpanded(false);
      setShowMap(false);
      Vibration.vibrate(25);
    }
  };

  useEffect(() => {
    loadRoutes(route.params);

  }, []);
  if (loading) {
    return (<View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', fontSize: RFValue(12) }}> Завантаження ... </Text>
    </View>);
  }

  const handleNewRoute = async () => {
    Vibration.vibrate(25);
    navigation.navigate('NewRouteScreen', currentRoute);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ height: 350 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'tomato', padding: 10, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', }}>Авто {currentRoute.truck.short_number}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', }}>Пробіг за місяць: {calculateDistanceCurrentMonth(routes)} км.</Text>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', }}>Простій за місяць: {calculateIdleTimeForCurrentMonth(routes)}</Text>
          </View>
        </View>

        <Text style={styles.routeIndex}>
          {currentRoute.checkpoints[currentRoute.checkpoints.length - 1].name === 'Рейс завершено' ?
            'Минулий рейс №' :
            currentRoute.checkpoints.some(item => item.name === 'Водій прийняв рейс') ||
             (currentRoute.checkpoints[currentRoute.checkpoints.length - 1].name !== 'Рейс створено, водій ще не прийняв')  ?
              'Поточний рейс №' :
              'Запланований рейс №'
          } {currentRoute.route_id}
        </Text>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {currentRouteIndex > 0 ? (
              <TouchableOpacity style={[styles.arrows, { marginLeft: 10 }]} onPress={previousRoute}>
                <Icon name="arrow-left" size={20} color="#fff" style={{ paddingLeft: 0 }} />
              </TouchableOpacity>) : (<TouchableOpacity style={[styles.arrows, { marginLeft: 10, backgroundColor: 'white' }]}>
                <Icon name="arrow-left" size={20} color="white" />
              </TouchableOpacity>)
            }
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'tomato', maxWidth: 100 }} onPress={() => { openMapWithAddress(currentRoute.point_load.country + " " + currentRoute.point_load.region + " " + currentRoute.point_load.city + " " + currentRoute.point_load.street + " " + currentRoute.point_load.building) }}>{currentRoute.point_load.city}</Text>
            <View style={{ position: 'relative' }}>
              <Icon name="long-arrow-right" size={60} color='tomato' />
              <Text style={{ flex: 1, fontFamily: 'OpenSans', fontSize: RFValue(12), color: 'grey', position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: -30 }] }} numberOfLines={1}>{currentRoute.distance} км</Text>
              <Text style={{ flex: 1, fontFamily: 'OpenSans', fontSize: RFValue(12), color: 'grey', position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: -1 }], }} >{Math.round(currentRoute.price / currentRoute.distance)} ₴/км</Text>

              <Text></Text>
            </View>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'tomato', maxWidth: 100 }} onPress={() => { openMapWithAddress(currentRoute.point_unload.country + " " + currentRoute.point_unload.region + " " + currentRoute.point_unload.city + " " + currentRoute.point_unload.street + " " + currentRoute.point_unload.building) }}>{currentRoute.point_unload.city}</Text>
            {currentRouteIndex < routes.length - 1 ? (
              <TouchableOpacity style={[styles.arrows, { marginRight: 10 }]} onPress={nextRoute}>
                <Icon name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (<TouchableOpacity style={[styles.arrows, { marginRight: 10, backgroundColor: 'white' }]} >
              <Icon name="arrow-right" size={20} color="white" />
            </TouchableOpacity>)
            }
          </View>


          <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: 'tomato' }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans' }}>{formatDateFull(currentRoute.load_date)}</Text>
              <TouchableOpacity onPress={() => { openMapWithAddress(currentRoute.point_load.country + " " + currentRoute.point_load.region + " " + currentRoute.point_load.city + " " + currentRoute.point_load.street + " " + currentRoute.point_load.building) }}>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_load.city}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_load.street} {currentRoute.point_load.building}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_load.region}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_load.country}</Text>
              </TouchableOpacity>

            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ paddingBottom: 5, fontFamily: 'OpenSans' }}>{formatDateFull(currentRoute.unload_date)}</Text>
              <TouchableOpacity onPress={() => { openMapWithAddress(currentRoute.point_unload.country + " " + currentRoute.point_unload.region + " " + currentRoute.point_unload.city + " " + currentRoute.point_unload.street + " " + currentRoute.point_unload.building) }}>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_unload.city}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_unload.street} {currentRoute.point_unload.building}</Text>

                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_unload.region}</Text>
                <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(10) }}>{currentRoute.point_unload.country}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.routeButtonsView}>
            <TouchableOpacity style={styles.routeButton}>
              <Button color={'tomato'} title='Редагувати рейс' onPress={() => { navigation.navigate('EditRouteScreen', currentRoute); Vibration.vibrate(25) }}></Button>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routeButton}>
              <Button color={'tomato'} title='Змінити статус' onPress={() => { setModalVisible(true); Vibration.vibrate(25) }}></Button>
              {modalVisible && (
                <AddCheckpointModal
                  checkpoints={checkpoints}
                  onAddCheckpoint={handleAddCheckpoint}
                  onClose={() => setModalVisible(false)}
                  currentCheckpoint={currentRoute.checkpoints[currentRoute.checkpoints.length - 1]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!showMap && (
          <Button
            color={'tomato'}
            title="Відобразити на мапі"
            onPress={() => {
              Vibration.vibrate(25);
              setShowMap(true);
            }}
          />
        )}

        {showMap && (
          <View style={{ flex: 1 }}>
            <MapWithRoute
              startAddress={'' + currentRoute.point_load.country + ' ' + currentRoute.point_load.region + ' ' + currentRoute.point_load.city + ' ' + currentRoute.point_load.street + ' ' + currentRoute.point_load.building}
              endAddress={'' + currentRoute.point_unload.country + ' ' + currentRoute.point_unload.region + ' ' + currentRoute.point_unload.city + ' ' + currentRoute.point_unload.street + ' ' + currentRoute.point_unload.building}
              currentRoute={currentRoute}
            />
          </View>
        )}

        <View style={styles.routeDetails}>
          <View style={styles.persons}>
            <View>
              <Text style={styles.fieldTitle}>Водій:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${currentRoute.driver.phone}`)}>
                {currentRoute.driver.last_name} {currentRoute.driver.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Клієнт:</Text>
              <Text style={styles.personText} >{currentRoute.client.name}</Text>
            </View>

            <View>
              <Text style={styles.fieldTitle}>Логіст:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${currentRoute.logist.phone}`)}>
                {currentRoute.logist.last_name} {currentRoute.logist.first_name}
              </Text>
              <Text style={styles.fieldTitle}>Наступний логіст:</Text>
              <Text style={styles.personText} onPress={() => Linking.openURL(`tel:${currentRoute.next_logist.phone}`)}>
                {currentRoute.next_logist.last_name} {currentRoute.next_logist.first_name}
              </Text>
            </View>

          </View>
          <View style={styles.otherDetails}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <View style={{ paddingRight: 10 }}>
                <Text style={styles.fieldTitle}>Номер авто: </Text>
                <Text style={styles.fieldText}>{currentRoute.truck.number}</Text>
              </View>
              <View style={{ paddingLeft: 10 }}>
                <Text style={styles.fieldTitle}>Номер причепа: </Text>
                <Text style={styles.fieldText}>{currentRoute.trailer.number}</Text>
              </View>
            </View>

            <View style={{ paddingRight: 10 }}>
              <Text style={styles.fieldTitle}>Ціна: <Text style={styles.fieldText}>{currentRoute.price} грн.</Text></Text>
              <Text style={styles.fieldTitle}>Відстань: <Text style={styles.fieldText}>{currentRoute.distance} км.</Text></Text>
              <Text style={styles.fieldTitle}>Нотатка: <Text style={styles.fieldText}>{currentRoute.logist_note ? currentRoute.logist_note : '-'}</Text></Text>
              <Text style={styles.fieldTitle}>Коментар до маршруту: <Text style={styles.fieldText}>{currentRoute.comment ? currentRoute.comment : '-'}</Text></Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View>
      </View>
      <Text style={[styles.fieldTitle, { paddingLeft: 10, fontSize: RFValue(12), paddingBottom: 5 }]}>Статуси рейса: </Text>
      <CheckpointsList checkpoints={currentRoute.checkpoints} />
      <TouchableOpacity style={styles.floatingButton} onPress={handleNewRoute}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
  },
  routeButtonsView: {
    flexDirection: 'row',
    alignContent: 'space-between',
    alignItems: 'center'
  },
  routeButton: {
    flex: 1,
    textAlign: 'center',
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: 'tomato',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrows: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: 'tomato',
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
    alignItems: 'flex-start'
  },
  routeIndex: {
    fontSize: RFValue(10),
    textAlign: 'center',
    fontFamily: 'OpenSans',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'tomato',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: 'tomato',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    fontSize: RFValue(30),
    color: '#fff',
  },
  // container: {
  //   flex: 1,
  //   backgroundColor: '#fff',
  //   padding: 5,
  // },
  // header: {
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   marginBottom: 10,
  //   textAlign: 'center'
  // },
  // routeHeader: {
  //   // display: 'flex',
  //   // flexDirection: 'row',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  // routeHeaderItems: {
  //   borderWidth: 1,
  //   borderColor: '#ccc',
  //   flex: 1,
  //   alignItems: 'center'
  // },
  // routeButtonsView: {
  //   flexDirection: 'row',
  //   alignContent: 'space-between',
  //   alignItems: 'center'
  // },
  // routeButton: {
  //   flex: 1,
  //   textAlign: 'center',
  // },
  // button: {

  //   padding: 10,
  //   borderRadius: 5,
  //   backgroundColor: '#007AFF',
  // },
  // mileage: {
  //   textAlign: 'right'
  // },
  // routeIndex: {
  //   textAlign: 'center',
  //   borderWidth: 2,
  //   borderColor: '#ccc',
  //   padding: 10
  // },
  // section: {
  //   marginBottom: 10,
  // },
  // sectionHeader: {
  //   fontWeight: 'bold',
  //   marginBottom: 5,
  // },
  // status: {
  //   textAlign: 'center',
  //   borderWidth: 2,
  //   borderColor: '#ccc',
  //   padding: 10,
  //   backgroundColor: '#00FF00',
  //   flexDirection: 'row',
  //   justifyContent: 'space-around', alignItems: 'center'
  // },
  // floatingButton: {
  //   position: 'absolute',
  //   bottom: 20,
  //   right: 20,
  //   width: 60,
  //   height: 60,
  //   backgroundColor: '#007AFF',
  //   borderRadius: 30,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // floatingButtonText: {
  //   fontSize: 30,
  //   color: '#fff',
  // },
  // routeDetails: {
  //   padding: 10,
  // },
  // routeDetailsText: {
  //   fontSize: 16
  // },

});

export default RouteDetails;