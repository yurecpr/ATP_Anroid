import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { serverUrl } from '../config';
import { useFocusEffect } from '@react-navigation/native';

const LoginScreen = ({navigation, onLogin }) => {
  const [loginFailed, setLoginFailed] = useState(false);
  const [code, setCode] = useState('');


  const handleRegister = async () => {
    navigation.navigate('Register');
  }
  const handleSubmit = async () => {
    try {
      console.log('try login');
      const response = await axios.post(`${serverUrl}/api/login`, {
        code: code,
      });
      console.log(response);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      await AsyncStorage.setItem('token', response.data.currentToken);
      onLogin(response.data.currentToken, response.data);
      navigation.navigate('Root', {user: response.data, token: response.data.currentToken});
      console.log('login response', response.data);
    } catch (error) {
      console.log(error);
      setLoginFailed(true);
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./../assets/logo.png')}></Image>
      <TextInput
        style={styles.input}
        placeholder="Код входу"
        value={code}
        onChangeText={setCode}
      />
      {loginFailed && (
        <Text style={styles.errorMessage}>Виникла помилка! Можливо код невірний!</Text>
      )}
      <View style={styles.buttonContainer}>
        {/* <Button style={styles.button} title="Зареєструватися" onPress={handleRegister} /> */}
        <Button style={styles.button} title="Увійти" onPress={handleSubmit} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  input: {
    width: '90%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  button: {
    width: 120,
  },
  errorMessage: {
    padding: 10,
    margin: 15,
    backgroundColor: '#f44336',
    fontSize: 18
  }
});
export default LoginScreen;
