import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

const Loading = () => {
  return (<View style={styles.container}>
    <Text style={styles.text}> Завантаження ... </Text>
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
    fontFamily: 'OpenSans'
  }
});

export default Loading;