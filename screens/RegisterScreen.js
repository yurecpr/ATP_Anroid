import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TextInput, Button, ImageBackground } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { serverUrl } from '../config';

const RegisterScreen = ({ navigation, onLogin }) => {
  const [registerFailed, setRegisterFailed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${serverUrl}/api/signup`, {
        first_name: firstName,
        last_name: lastName,
        surname,
        phone,
        code,
      });
      await AsyncStorage.setItem('token', response.data.currentToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      onLogin(response.data.currentToken, response.data);
      navigation.replace('Root', {user: response.data, token: response.data.currentToken});
      console.log(response.data);
    } catch (error) {
      console.log(error);
      setRegisterFailed(true);
    }
  };

  const handleLogin = async () => {
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./../assets/logo.png')}></Image>
      <TextInput
        style={styles.input}
        placeholder="Ім'я"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Прізвище"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="По-батькові"
        value={surname}
        onChangeText={setSurname}
      />
      <TextInput
        style={styles.input}
        placeholder="Номер телефону"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Код для входу (запитайте у відділі кадрів)"
        value={code}
        onChangeText={setCode}
      />
      {registerFailed && (
        <Text style={styles.errorMessage}>Виникла помилка! Можливо код невірний!</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Зареєструватися" onPress={handleSubmit} />
        <Button title="Вже маю аккаунт" onPress={handleLogin} />
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
    paddingBottom: 10, // Add this line to add padding to the bottom of the image
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
  errorMessage: {
    padding: 10,
    margin: 15,
    backgroundColor: '#f44336',
    fontSize: 18
  }
});






export default RegisterScreen;
