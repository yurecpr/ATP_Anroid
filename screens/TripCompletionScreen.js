import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { RFValue } from 'react-native-responsive-fontsize';
import { serverUrl } from '../config';
import { formatDateFull } from '../utils/dateUtils';
import {
  saveLocalDraft,
  getLocalDraft,
  submitOrQueue,
  trySyncQueuedTripReport,
} from '../utils/tripReportQueue';

// Стискаємо фото перед завантаженням, щоб не вантажити мобільний трафік водія
async function compressPhoto(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

const TripCompletionScreen = ({ route, navigation }) => {
  const { tripRoute } = route.params;
  const routeId = tripRoute._id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  const [odometerStart, setOdometerStart] = useState('');
  const [odometerEnd, setOdometerEnd] = useState('');
  const [motorHoursStart, setMotorHoursStart] = useState('');
  const [motorHoursEnd, setMotorHoursEnd] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [ttnPhotoUri, setTtnPhotoUri] = useState(null);
  const [protocolVideoUri, setProtocolVideoUri] = useState(null);

  const draftLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');

      // Спершу пробуємо дослати раніше збережений офлайн-звіт по цьому рейсу
      await trySyncQueuedTripReport(routeId, token);

      try {
        const response = await axios.get(`${serverUrl}/api/routes/${routeId}/trip-report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(response.data);
        setOdometerStart(response.data.odometerStart != null ? String(response.data.odometerStart) : '');
        setMotorHoursStart(response.data.motorHoursStart != null ? String(response.data.motorHoursStart) : '');
      } catch (error) {
        console.log('Не вдалося отримати чернетку звіту з сервера', error.message);
      }

      const localDraft = await getLocalDraft(routeId);
      if (localDraft) {
        if (localDraft.odometerStart !== undefined) setOdometerStart(String(localDraft.odometerStart));
        if (localDraft.odometerEnd !== undefined) setOdometerEnd(String(localDraft.odometerEnd));
        if (localDraft.motorHoursStart !== undefined) setMotorHoursStart(String(localDraft.motorHoursStart));
        if (localDraft.motorHoursEnd !== undefined) setMotorHoursEnd(String(localDraft.motorHoursEnd));
        if (localDraft.fuelConsumed !== undefined) setFuelConsumed(String(localDraft.fuelConsumed));
      }
      draftLoaded.current = true;
      setLoading(false);
    })();
  }, []);

  // Автозбереження чернетки локально та (best-effort) на сервері при кожній зміні поля
  useEffect(() => {
    if (!draftLoaded.current) return;
    const fields = { odometerStart, odometerEnd, motorHoursStart, motorHoursEnd, fuelConsumed };
    saveLocalDraft(routeId, fields);
    const timeoutId = setTimeout(async () => {
      const token = await AsyncStorage.getItem('token');
      axios.put(`${serverUrl}/api/routes/${routeId}/trip-report/draft`, fields, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Немає з'єднання — дані вже збережені локально, синхронізуються при наступному відкритті
      });
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [odometerStart, odometerEnd, motorHoursStart, motorHoursEnd, fuelConsumed]);

  const pickTtnPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу до камери');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const compressedUri = await compressPhoto(result.assets[0].uri);
      setTtnPhotoUri(compressedUri);
    }
  };

  const pickProtocolVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу до камери');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.5 });
    if (!result.canceled) {
      setProtocolVideoUri(result.assets[0].uri);
    }
  };

  const getGeolocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return {};
      const location = await Promise.race([
        Location.getCurrentPositionAsync({}),
        new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
      ]);
      if (!location) return {};
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch (error) {
      return {};
    }
  };

  const validate = () => {
    if (!ttnPhotoUri && !(report && report.ttnPhoto)) {
      return "Додайте фото ТТН/CMR";
    }
    if (odometerStart === '' || Number.isNaN(Number(odometerStart))) {
      return "Вкажіть початковий показник одометра";
    }
    if (odometerEnd === '' || Number.isNaN(Number(odometerEnd))) {
      return "Вкажіть кінцевий показник одометра";
    }
    if (motorHoursStart === '' || Number.isNaN(Number(motorHoursStart))) {
      return "Вкажіть початковий показник мотогодин";
    }
    if (motorHoursEnd === '' || Number.isNaN(Number(motorHoursEnd))) {
      return "Вкажіть кінцевий показник мотогодин";
    }
    if (fuelConsumed === '' || Number.isNaN(Number(fuelConsumed))) {
      return "Вкажіть витрату пального";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Перевірте дані', validationError);
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const geo = await getGeolocation();
      const fields = {
        odometerStart: Number(odometerStart),
        odometerEnd: Number(odometerEnd),
        motorHoursStart: Number(motorHoursStart),
        motorHoursEnd: Number(motorHoursEnd),
        fuelConsumed: Number(fuelConsumed),
        latitude: geo.latitude || '',
        longitude: geo.longitude || '',
      };
      const files = { ttnPhoto: ttnPhotoUri, protocolVideo: protocolVideoUri };

      const result = await submitOrQueue(routeId, token, fields, files);
      setSubmitting(false);

      if (result.queued) {
        Alert.alert(
          'Немає з\'єднання',
          'Звіт збережено на пристрої і буде надіслано автоматично, щойно з\'явиться мережа.'
        );
        navigation.goBack();
        return;
      }

      if (result.data.warnings && result.data.warnings.length > 0) {
        Alert.alert('Рейс завершено', 'Звіт подано. Деякі показники позначені як аномальні та передані диспетчеру на перевірку.');
      } else {
        Alert.alert('Рейс завершено', 'Звіт успішно подано.');
      }
      navigation.goBack();
    } catch (error) {
      setSubmitting(false);
      const message = error.response?.data?.error?.message || error.message;
      Alert.alert('Помилка подання звіту', message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 15 }}>
      {/* 4.1 Зведення (авто, read-only) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Зведення по рейсу</Text>
        <Text style={styles.fieldText}>Рейс: {tripRoute.route_id}</Text>
        <Text style={styles.fieldText}>Тягач: {tripRoute.truck?.number}</Text>
        <Text style={styles.fieldText}>Причіп: {tripRoute.trailer?.number}</Text>
        <Text style={styles.fieldText}>Клієнт: {tripRoute.client?.name}</Text>
        <Text style={styles.fieldText}>Завантаження: {formatDateFull(tripRoute.load_date)}</Text>
        <Text style={styles.fieldText}>Розвантаження: {formatDateFull(tripRoute.unload_date)}</Text>
      </View>

      {/* 4.2 Фото ТТН/CMR (обов'язково) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Фото ТТН / CMR *</Text>
        <TouchableOpacity style={styles.button} onPress={pickTtnPhoto}>
          <Text style={styles.buttonText}>{ttnPhotoUri ? 'Перефотографувати' : 'Зробити фото'}</Text>
        </TouchableOpacity>
        {ttnPhotoUri && <Image source={{ uri: ttnPhotoUri }} style={styles.preview} />}
        {!ttnPhotoUri && report?.ttnPhoto && <Text style={styles.fieldText}>Фото вже збережено</Text>}
      </View>

      {/* 4.3 Показання одометра/мотогодин */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Показання одометра та мотогодин</Text>
        <Text style={styles.fieldTitle}>Початковий одометр, км{report?.odometerStartManual ? '' : ' (авто)'}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={odometerStart}
          editable={!!report?.odometerStartManual}
          onChangeText={setOdometerStart}
        />
        <Text style={styles.fieldTitle}>Кінцевий одометр, км *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={odometerEnd} onChangeText={setOdometerEnd} />

        <Text style={styles.fieldTitle}>Початкові мотогодини{report?.motorHoursStartManual ? '' : ' (авто)'}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={motorHoursStart}
          editable={!!report?.motorHoursStartManual}
          onChangeText={setMotorHoursStart}
        />
        <Text style={styles.fieldTitle}>Кінцеві мотогодини *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={motorHoursEnd} onChangeText={setMotorHoursEnd} />
      </View>

      {/* 4.4 Витрата палива */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Витрата пального, л *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={fuelConsumed} onChangeText={setFuelConsumed} />
      </View>

      {/* 4.6 Відео протоколу (опційно) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Відео протоколу (необов'язково)</Text>
        <TouchableOpacity style={styles.button} onPress={pickProtocolVideo}>
          <Text style={styles.buttonText}>{protocolVideoUri ? 'Перезняти відео' : 'Зняти відео'}</Text>
        </TouchableOpacity>
        {protocolVideoUri && <Text style={styles.fieldText}>Відео додано</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Підтвердити завершення рейсу</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'tomato',
  },
  fieldTitle: {
    fontSize: RFValue(10),
    marginTop: 8,
  },
  fieldText: {
    fontSize: RFValue(11),
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    fontSize: RFValue(12),
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0080ff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: 'green',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
  preview: {
    width: 150,
    height: 150,
    marginTop: 10,
    borderRadius: 5,
  },
});

export default TripCompletionScreen;
