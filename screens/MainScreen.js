import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Vibration } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import Swiper from 'react-native-swiper';
import NewsSlider from '../components/NewsSlider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from './Loading';

const MainScreen = ({navigation}) => {

  const [ user, setUser ] = useState(null);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    const getUser = async () => {
      setUser( JSON.parse(await AsyncStorage.getItem('user') ?? 'null'));
    }
    getUser()
    setLoading(false);

  }, [])
  
  console.log('user', user);
  if (loading) {
    return <Loading/>
  }
  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./../assets/logo.png')}></Image>
      <NewsSlider></NewsSlider>
      {user?.role == 'logist' ? (
        <View style={styles.buttonsView}>
        <View style={styles.buttonsRow} >
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('Trucks')}}>
            <Icon name="truck"  style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Список авто</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRight]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('NewRouteScreen', {emptyRoute: true})}}>
          <Icon5 name="plus-circle" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Створити рейс</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('NewsScreen')}}>
          <Icon5 name="newspaper" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Новини</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRight]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('ManualsScreen')}}>
          <Icon name="file-text" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText} numberOfLines={2}>Інструкції та контакти</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : (
        <View style={styles.buttonsView}>
        <View style={styles.buttonsRow} >
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={()=> {Vibration.vibrate(25);  navigation.navigate('DriverCurrentRoute', { user: user })}}>
            <Icon name="crosshairs"  style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Поточний рейс</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('DriverRoutes')}}>
          <Icon5 name="route" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Мої рейси</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('NewsScreen')}}>
          <Icon5 name="newspaper" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Новини</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRight]} onPress={()=> { Vibration.vibrate(25); navigation.navigate('ManualsScreen')}}>
          <Icon name="file-text" size={20} style={styles.buttonIcon} />
          <Text style={styles.buttonText} numberOfLines={2}>Інструкції та контакти</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}
     
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 20,
    // marginTop: 20,
  },
  newsView: {
    height: 150
  },
  buttonsView: {
    
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: "center"
  },
  button: {
    flex: 1,
    // flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'grey',
    paddingVertical: 50
  },
  buttonText: {
    textAlign: 'center',
    color: 'tomato',
    fontFamily: 'OpenSans',
    fontSize: RFValue(14)
  },
  buttonLeft: {
    borderLeftWidth: 0,
  },
  buttonRight: {
    borderRightWidth: 0,
  },
  buttonIcon:{
    color: 'tomato',
    paddingRight: 5,
    paddingBottom: 10,
    fontSize: RFValue(25),
  }
})