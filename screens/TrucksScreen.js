import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, RefreshControl, Vibration, StyleSheet, TextInput } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useNavigation } from '@react-navigation/native';
import { serverUrl } from '../config';
import { calculateIdleTime, formatDateFull } from '../utils/dateUtils';
import Icon from 'react-native-vector-icons/FontAwesome';

const fetchTrucks = async () => {
  const token = await AsyncStorage.getItem('token');
  console.log('token ', token);
  try {
    const response = await axios.get(`${serverUrl}/api/routes/trucks`, {
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

const TrucksScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrucks = async () => {
    setLoading(true);
    const data = await fetchTrucks();
    console.log('data', data)
    if (data) {
      setTrucks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrucks();
    setRefreshing(false);
  };

  if (loading) {
    return (<View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', fontSize: RFValue(12) }}> Завантаження ... </Text>
    </View>);
  }

  const filteredTrucks = trucks.filter(truck => truck.truck.short_number.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderItem = ({ item }) => {
    item.routes = item.routes.sort((a, b) => new Date(a.load_date) - new Date(b.load_date));
    return (
    <TouchableOpacity onPress={() => { console.log('truck', item); Vibration.vibrate(25); navigation.navigate('RouteDetails', item.truck._id) }}>
      <View style={[styles.item]}>
        {
          item.routes.length == 0 ? (
            <View>
              <Text style={[styles.nameText, item.routes.length == 0 && { color: 'red' }]}>
                {item.truck.short_number} | Простій
              </Text>
              <Text style={{ color: 'red', paddingLeft: 20, paddingTop: 5 }}> {calculateIdleTime(item.last_unload_date)}</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={[styles.nameText, { color: 'black' }]}>
              {item.truck.short_number} | {item.routes[0].last_checkpoint.name}
            </Text>
            {
              item.routes.length > 1 ? ( <Icon name="circle" color={'green'} />) : (<Icon name="circle" color={'red'} />)
            }
           
            </View>
          )
        }
        {item.routes.length > 0 ? (
          <View>
            <Text style={{ fontFamily: 'OpenSans', fontSize: RFValue(12), paddingLeft: 20 }}>
              {item.routes[0].point_load.city} - {item.routes[0].point_unload.city}
            </Text>
            <Text style={styles.dateText}>
              {formatDateFull(item.routes[0].load_date)} |{' '}{formatDateFull(item.routes[0].unload_date)}
            </Text>
          </View>
        ) : (null)
        }
      </View>
    </TouchableOpacity>
  );}


  return (
    <View style={styles.container}>


      <FlatList
        data={filteredTrucks}
        renderItem={renderItem}
        keyExtractor={(item) => item.truck._id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh} />}

      />
      <View style={styles.searchInput}>
        <Icon name="search" style={styles.icon} />
        <TextInput
          keyboardType='numeric'
          onChangeText={setSearchTerm}
          value={searchTerm}
          placeholder="Пошук по номеру авто"
        />
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',

  },
  list: {
    padding: 5
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  nameText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans'
  },
  dateText: {
    fontFamily: 'OpenSans',
    color: 'gray',
    paddingLeft: 20
  },
  firstItem: {
    backgroundColor: '#f2f2f2',
  },
  searchInput: {
    flexDirection: 'row',
    height: RFPercentage(4),
    borderRadius: RFValue(10),
    paddingHorizontal: RFValue(10),
    backgroundColor: 'white',
    marginVertical: RFValue(10),
    marginHorizontal: RFValue(20),
    fontSize: RFValue(14),
    fontFamily: 'OpenSans',
  },
  icon: {
    alignSelf: 'center',
    fontSize: RFValue(14),
    paddingRight: 5
  }

});

export default TrucksScreen;
