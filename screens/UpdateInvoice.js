import React, {useEffect} from 'react';
import { View, Text, StyleSheet, Button, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import * as Linking from 'expo-linking';
import { serverUrl } from '../config';

const UpdateInvoice = () => {

  const downloadApk = async () => {
    // Пряме посилання на APK файл на вашому сервері
    const apkUrl = `${serverUrl}/atp_app.apk`;

    const supported = await Linking.canOpenURL(apkUrl);

    if (supported) {
      await Linking.openURL(apkUrl);
    } else {
      alert('Не вдалося завантажити оновлення.');
    }
  };  

  return (<View style={styles.container}>
    <Text style={styles.text}>Вийшла нова версія застосунку. Завантажте та встановіть оновлення!</Text>
    <Button color={'tomato'} title='Завантажити оновлення' onPress={()=> downloadApk()}></Button>
  </View>);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  text: {
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: RFValue(18),
    fontFamily: 'OpenSans',
    paddingBottom: 20
  }
});

  export default UpdateInvoice;