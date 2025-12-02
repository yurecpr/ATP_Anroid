import React, {useEffect} from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import * as Linking from 'expo-linking';
const UpdateInvoice = () => {

  const openAppStore = async () => {
    // Откройте магазин приложений для обновления
    const appStoreUrl =
      Platform.OS === 'ios'
        ? 'itms-apps://apps.apple.com/app/idYOUR_APP_ID'
        : 'market://details?id=com.vladositto.atp16363';

    const supported = await Linking.canOpenURL(appStoreUrl);

    if (supported) {
      await Linking.openURL(appStoreUrl);
    } else {
      alert('Не вдалося відкрити магазин застосунків, оновіть застосунок вручну.');
    }
  };  

  return (<View style={styles.container}>
    <Text style={styles.text}> Вийшла нова версія застосунку. Оновіть застосунок! </Text>
    <Button color={'tomato'}  title='Оновити' onPress={()=> openAppStore()}></Button>
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