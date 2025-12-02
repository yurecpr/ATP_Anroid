import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { gStyle } from '../styles/style';
import { serverUrl } from '../config';
import { formatDateFull } from '../utils/dateUtils';
import CustomDropDownVehicle from '../components/CustomDropDownVehicle';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomDropDownUser from '../components/CustomDropDownUser';
import CustomDropDownClient from '../components/CustomDropDownClient';
import Loading from './Loading';

const NewRoute = ({ route }) => {
  const { emptyRoute } = route.params;

  const navigation = useNavigation();

  const [trucksList, setTrucksList] = useState([]);
  const [trailersList, setTrailersList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [logistsList, setLogistsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const [isLoadDatePickerVisible, setLoadDatePickerVisibility] = useState(false);
  const [isUnloadDatePickerVisible, setUnloadDatePickerVisibility] = useState(false);

  const [loading, setLoading] = useState(true);

  const [routeId, setRouteId] = useState('');
  const [truck, setTruck] = useState(emptyRoute ? {} : route.params.truck);
  const [trailer, setTrailer] = useState({});
  const [driver, setDriver] = useState('');
  const [logist, setLogist] = useState('');
  const [nextLogist, setNextLogist] = useState('');
  const [client, setClient] = useState({});

  const [loadDate, setLoadDate] = useState(new Date());
  const [pointLoadCountry, setPointLoadCountry] = useState('');
  const [pointLoadRegion, setPointLoadRegion] = useState('');
  const [pointLoadCity, setPointLoadCity] = useState('');
  const [pointLoadStreet, setPointLoadStreet] = useState('');
  const [pointLoadBuilding, setPointLoadBuilding] = useState('');

  const [unloadDate, setUnloadDate] = useState(new Date());
  const [pointUnloadCountry, setPointUnloadCountry] = useState('');
  const [pointUnloadRegion, setPointUnloadRegion] = useState('');
  const [pointUnloadCity, setPointUnloadCity] = useState('');
  const [pointUnloadStreet, setPointUnloadStreet] = useState('');
  const [pointUnloadBuilding, setPointUnloadBuilding] = useState('');

  const [price, setPrice] = useState('');
  const [distance, setDistance] = useState('');
  const [logistNote, setLogistNote] = useState('');
  const [comment, setComment] = useState('');
  const [driverComment, setDriverComment] = useState('');
  const [user, setUser] = useState({});

  const [modalTruckVisible, setModalTruckVisible] = useState(false);
  const [modalTrailerVisible, setModalTrailerVisible] = useState(false);
  const [modalDriverVisible, setModalDriverVisible] = useState(false);
  const [modalLogistVisible, setModalLogistVisible] = useState(false);
  const [modalNextLogistVisible, setModalNextLogistVisible] = useState(false);
  const [modalClientVisible, setModalClientVisible] = useState(false);



  useEffect(() => {
    const fetchCreationData = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      try {
        const response = await axios.get(`${serverUrl}/api/creationData`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('response', response.data);
        setUser(user);
        setLogist(user);
        setNextLogist(user);
        setDriver(emptyRoute ? {} : route.params.driver);
        setPointLoadCountry('Україна');
        setPointUnloadCountry('Україна');

        setTrucksList(response.data.trucks);
        setTrailersList(response.data.trailers)
        setDriversList(response.data.drivers);
        setLogistsList(response.data.logists);
        setClientsList(response.data.clients);

        setTruck(emptyRoute ? {} : response.data.trucks.find(truck => truck.number === route.params.truck.number));
        setTrailer(emptyRoute ? {} : response.data.trailers.find(trailer => trailer.number === route.params.trailer.number));
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchCreationData();

  }, []);

  const validateFields = (fields) => {
    console.log(fields);
    for (const field of fields) {
      if (!field.value || JSON.stringify(field.value) === '{}') {

        return false;
      }
    }
    return true;
  }
  const handleSubmit = async () => {
    console.log('client', client);
    const fields = [
      { value: routeId },
      { value: truck },
      { value: trailer },
      { value: driver },
      { value: logist },
      { value: nextLogist },
      { value: client },
      { value: loadDate },
      { value: unloadDate },
      { value: pointLoadCountry },
      { value: pointLoadRegion },
      { value: pointLoadCity },
      { value: pointLoadStreet },
      { value: pointLoadBuilding },
      { value: pointUnloadCountry },
      { value: pointUnloadRegion },
      { value: pointUnloadCity },
      { value: pointUnloadStreet },
      { value: pointUnloadBuilding },
      { value: price },
      { value: distance }

    ];
    console.log('fields', fields);
    if (validateFields(fields)) {
      // все поля заполнены, можно создать рейс
      const newRoute = {
        route_id: routeId,
        truck: truck._id,
        trailer: trailer._id,
        driver: driver._id,
        logist: logist._id,
        next_logist: nextLogist._id,
        point_load: {
          country: pointLoadCountry,
          region: pointLoadRegion,
          city: pointLoadCity,
          street: pointLoadStreet,
          building: pointLoadBuilding,
        },
        point_unload: {
          country: pointUnloadCountry,
          region: pointUnloadRegion,
          city: pointUnloadCity,
          street: pointUnloadStreet,
          building: pointUnloadBuilding,
        },
        client: client._id,
        load_date: loadDate,
        unload_date: unloadDate,
        price: price,
        distance: distance,
        logist_note: logistNote,
        comment: comment,
        driver_comment: driverComment,
        checkpoints: [{
          date: new Date(),
          name: "Рейс створено, водій ще не прийняв",
          latitude: 0.0,
          longitude: 0.0
        }],
      };
      console.log(newRoute);
      const token = await AsyncStorage.getItem('token');
      axios.post(`${serverUrl}/api/routes`, newRoute, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          alert('Рейс створено!');
          emptyRoute ? navigation.goBack() : navigation.navigate('RouteDetails', truck._id);
          console.log(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    } else {
      alert('Будь ласка, заповніть всі необхідні поля!');
    }
  };




  if (loading) {
    return <Loading/>
  }

  return (
    <View>
      <ScrollView>
        <View style={gStyle.container}>
          <Text style={gStyle.fieldTitle}>Номер рейса:</Text>
          <TextInput
            style={gStyle.input}
            value={routeId}
            onChangeText={text => setRouteId(text)}
          />
          <Text style={gStyle.fieldTitle}>Номер вантажівки:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalTruckVisible(true)}>
            {
              truck.number ? (<Text style={gStyle.dropDownSelectedValue}>{truck.short_number} | {truck.number}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть вантажівку</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalTruckVisible && (
            <CustomDropDownVehicle
              items={trucksList}
              onValueChange={(value) => { setTruck(value) }}
              onClose={() => setModalTruckVisible(false)}
            />
          )}
          <Text style={gStyle.fieldTitle}>Номер причепа:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalTrailerVisible(true)}>
            {
              trailer.number ? (<Text style={gStyle.dropDownSelectedValue}>{trailer.short_number} | {trailer.number}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть причеп</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalTrailerVisible && (
            <CustomDropDownVehicle
              items={trailersList}
              onValueChange={(value) => { setTrailer(value) }}
              onClose={() => setModalTrailerVisible(false)}
            />
          )}

          <Text style={gStyle.fieldTitle}>Водій:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalDriverVisible(true)}>
            {
              driver._id ? (<Text style={gStyle.dropDownSelectedValue}>{driver.last_name} {driver.first_name}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть водія</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalDriverVisible && (
            <CustomDropDownUser
              items={driversList}
              onValueChange={(value) => { setDriver(value) }}
              onClose={() => setModalDriverVisible(false)}
            />
          )}
          <Text style={gStyle.fieldTitle}>Логіст:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalLogistVisible(true)}>
            {
              logist._id ? (<Text style={gStyle.dropDownSelectedValue}>{logist.last_name} {logist.first_name}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть логіста</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalLogistVisible && (
            <CustomDropDownUser
              items={logistsList}
              onValueChange={(value) => { setLogist(value) }}
              onClose={() => setModalLogistVisible(false)}
            />
          )}

          <Text style={gStyle.fieldTitle}>Наступний логіст:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalNextLogistVisible(true)}>
            {
              nextLogist._id ? (<Text style={gStyle.dropDownSelectedValue}>{nextLogist.last_name} {nextLogist.first_name}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть наступного логіста</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalNextLogistVisible && (
            <CustomDropDownUser
              items={logistsList}
              onValueChange={(value) => { setNextLogist(value) }}
              onClose={() => setModalNextLogistVisible(false)}
            />
          )}
          <Text style={gStyle.fieldTitle}>Клієнт:</Text>
          <TouchableOpacity style={gStyle.dropDownBox} onPress={() => setModalClientVisible(true)}>
            {
              client._id ? (<Text style={gStyle.dropDownSelectedValue}>{client.name}</Text>) : (<Text style={[gStyle.dropDownNotSelectedValue, gStyle.dropDownSelectedValue]}>Виберіть клієнта</Text>)
            }
            <Icon name="chevron-circle-down" style={{ paddingLeft: 20 }} />
          </TouchableOpacity>
          {modalClientVisible && (
            <CustomDropDownClient
              items={clientsList}
              onValueChange={(value) => { setClient(value) }}
              onClose={() => setModalClientVisible(false)}
            />
          )}

          <Text style={gStyle.fieldTitle}>Дата завантаження:</Text>
          <View>
            <TouchableOpacity onPress={() => {
              setLoadDatePickerVisibility(true)
            }}>
              <Text style={{ fontSize: 18 }}>{formatDateFull(loadDate)}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isLoadDatePickerVisible}
              mode="datetime"
              onConfirm={(date) => {
                setLoadDate(date);
                setLoadDatePickerVisibility(false)
              }}
              onCancel={() => { setLoadDatePickerVisibility(false) }}
            />
          </View>
          <Text style={gStyle.fieldTitle}>Дата вивантаження:</Text>
          <View>
            <TouchableOpacity onPress={() => {
              setUnloadDatePickerVisibility(true)
            }}>
              <Text style={{ fontSize: 18 }}>{formatDateFull(unloadDate)}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isUnloadDatePickerVisible}
              mode="datetime"
              onConfirm={(date) => {
                setUnloadDate(date);
                setUnloadDatePickerVisibility(false)
              }}
              onCancel={() => { setUnloadDatePickerVisibility(false) }}
            />
          </View>
          <Text style={gStyle.sectionTitle}>Точка завантаження:</Text>
          <Text style={gStyle.fieldTitle}>Країна:</Text>
          <TextInput
            style={gStyle.input}
            value={pointLoadCountry}
            onChangeText={text => setPointLoadCountry(text)}
          />
          <Text style={gStyle.fieldTitle}>Область:</Text>
          <TextInput
            style={gStyle.input}
            value={pointLoadRegion}
            onChangeText={text => setPointLoadRegion(text)}
          />
          <Text style={gStyle.fieldTitle}>Населений пункт:</Text>
          <TextInput
            style={gStyle.input}
            value={pointLoadCity}
            onChangeText={text => setPointLoadCity(text)}
          />
          <Text style={gStyle.fieldTitle}>Вулиця:</Text>
          <TextInput
            style={gStyle.input}
            value={pointLoadStreet}
            onChangeText={text => setPointLoadStreet(text)}
          />
          <Text style={gStyle.fieldTitle}>Номер будівлі:</Text>
          <TextInput
            style={gStyle.input}
            value={pointLoadBuilding}
            onChangeText={text => setPointLoadBuilding(text)}
          />
          <Text style={gStyle.sectionTitle}>Точка розвантаження:</Text>
          <Text style={gStyle.fieldTitle}>Країна:</Text>
          <TextInput
            style={gStyle.input}
            value={pointUnloadCountry}
            onChangeText={text => setPointUnloadCountry(text)}
          />
          <Text style={gStyle.fieldTitle}>Область:</Text>
          <TextInput
            style={gStyle.input}
            value={pointUnloadRegion}
            onChangeText={text => setPointUnloadRegion(text)}
          />
          <Text style={gStyle.fieldTitle}>Населений пункт:</Text>
          <TextInput
            style={gStyle.input}
            value={pointUnloadCity}
            onChangeText={text => setPointUnloadCity(text)}
          />
          <Text style={gStyle.fieldTitle}>Вулиця:</Text>
          <TextInput
            style={gStyle.input}
            value={pointUnloadStreet}
            onChangeText={text => setPointUnloadStreet(text)}
          />
          <Text style={gStyle.fieldTitle}>Номер будівлі:</Text>
          <TextInput
            style={gStyle.input}
            value={pointUnloadBuilding}
            onChangeText={text => setPointUnloadBuilding(text)}
          />
          <Text style={gStyle.sectionTitle}>Додаткова інформація:</Text>
          <Text style={gStyle.fieldTitle}>Ціна рейсу:</Text>
          <TextInput
            style={gStyle.input}
            value={price}
            onChangeText={text => setPrice(text)}
            keyboardType="numeric"
          />
          <Text style={gStyle.fieldTitle}>Відстань:</Text>
          <TextInput
            style={gStyle.input}
            value={distance}
            onChangeText={text => setDistance(text)}
            keyboardType="numeric"
          />
          <Text style={gStyle.fieldTitle}>Нотатки логіста:</Text>
          <TextInput
            style={gStyle.input}
            value={logistNote}
            onChangeText={text => setLogistNote(text)}
          />
          <Text style={gStyle.fieldTitle}>Коментар до маршрута:</Text>
          <TextInput
            style={gStyle.input}
            value={comment}
            onChangeText={text => setComment(text)}
          />

          <Button
            color={'green'}
            title="Створити рейс"
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </View>

  );
};

export default NewRoute;

