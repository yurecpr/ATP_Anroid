import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { RFValue } from 'react-native-responsive-fontsize';
import { serverUrl } from '../config';
import { formatDateFull, formatDateOnly } from '../utils/dateUtils';
import {
  saveLocalDraft,
  getLocalDraft,
  submitOrQueue,
  trySyncQueuedTripReport,
  setFuelingTank,
  addStransFueling,
  removeStransFueling,
} from '../utils/tripReportQueue';

// §6.2 ТЗ: підписи провайдерів заправок для відображення у списку
const FUELING_PROVIDER_LABELS = { ukrnafta: 'УкрНафта', wog: 'WOG', e100: 'E100', strans: 'СТРАНС' };

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
  const [deadheadDistanceKm, setDeadheadDistanceKm] = useState('0');
  const [motorHoursStart, setMotorHoursStart] = useState('');
  const [motorHoursEnd, setMotorHoursEnd] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [ttnNumber, setTtnNumber] = useState('');
  const [ttnDate, setTtnDate] = useState(null);
  const [unloadDateByTTN, setUnloadDateByTTN] = useState(null);
  const [cargoWeightTons, setCargoWeightTons] = useState('');
  const [isTtnDatePickerVisible, setTtnDatePickerVisibility] = useState(false);
  const [isUnloadDateByTTNPickerVisible, setUnloadDateByTTNPickerVisibility] = useState(false);
  const [ttnPhotoUris, setTtnPhotoUris] = useState([]);

  // §6 ТЗ: заправки по паливних картках — довідкові, водій лише розподіляє реф/тягач і додає СТРАНС
  const [fuelings, setFuelings] = useState([]);
  const [fuelDataIncompleteProviders, setFuelDataIncompleteProviders] = useState([]);
  const [fuelingsFetchFailed, setFuelingsFetchFailed] = useState(false);
  const [fuelingActionId, setFuelingActionId] = useState(null);
  const [showStransInput, setShowStransInput] = useState(false);
  const [stransLiters, setStransLiters] = useState('');

  // §6.7 ТЗ: флажок «є заправки, яких немає в списку» — сигнал логісту, без ручного вводу заправки
  const [hasMissingFuelings, setHasMissingFuelings] = useState(false);
  const [missingFuelingsComment, setMissingFuelingsComment] = useState('');

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
        setDeadheadDistanceKm(response.data.deadheadDistanceKm != null ? String(response.data.deadheadDistanceKm) : '0');
        setMotorHoursStart(response.data.motorHoursStart != null ? String(response.data.motorHoursStart) : '');
        if (response.data.ttnNumber) setTtnNumber(response.data.ttnNumber);
        if (response.data.ttnDate) setTtnDate(new Date(response.data.ttnDate));
        if (response.data.unloadDateByTTN) setUnloadDateByTTN(new Date(response.data.unloadDateByTTN));
        if (response.data.cargoWeightTons != null) setCargoWeightTons(String(response.data.cargoWeightTons));
        setFuelings(response.data.fuelings || []);
        setFuelDataIncompleteProviders(response.data.fuelDataIncompleteProviders || []);
        setHasMissingFuelings(!!response.data.hasMissingFuelings);
        if (response.data.missingFuelingsComment) setMissingFuelingsComment(response.data.missingFuelingsComment);
        if (response.data.status === 'submitted') {
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Не вдалося отримати чернетку звіту з сервера', error.message);
        // §6.6 ТЗ: недоступність не блокує форму, лише показуємо, що заправки не підтягнулись
        setFuelingsFetchFailed(true);
      }

      const localDraft = await getLocalDraft(routeId);
      if (localDraft) {
        if (localDraft.odometerStart !== undefined) setOdometerStart(String(localDraft.odometerStart));
        if (localDraft.odometerEnd !== undefined) setOdometerEnd(String(localDraft.odometerEnd));
        if (localDraft.deadheadDistanceKm !== undefined) setDeadheadDistanceKm(String(localDraft.deadheadDistanceKm));
        if (localDraft.motorHoursStart !== undefined) setMotorHoursStart(String(localDraft.motorHoursStart));
        if (localDraft.motorHoursEnd !== undefined) setMotorHoursEnd(String(localDraft.motorHoursEnd));
        if (localDraft.fuelConsumed !== undefined) setFuelConsumed(String(localDraft.fuelConsumed));
        if (localDraft.ttnNumber !== undefined) setTtnNumber(localDraft.ttnNumber);
        if (localDraft.ttnDate !== undefined) setTtnDate(new Date(localDraft.ttnDate));
        if (localDraft.unloadDateByTTN !== undefined) setUnloadDateByTTN(new Date(localDraft.unloadDateByTTN));
        if (localDraft.cargoWeightTons !== undefined) setCargoWeightTons(String(localDraft.cargoWeightTons));
        if (localDraft.hasMissingFuelings !== undefined) setHasMissingFuelings(!!localDraft.hasMissingFuelings);
        if (localDraft.missingFuelingsComment !== undefined) setMissingFuelingsComment(localDraft.missingFuelingsComment);
      }
      draftLoaded.current = true;
      setLoading(false);
    })();
  }, []);

  // Автозбереження чернетки локально та (best-effort) на сервері при кожній зміні поля
  useEffect(() => {
    if (!draftLoaded.current) return;
    const fields = {
      odometerStart, odometerEnd, deadheadDistanceKm, motorHoursStart, motorHoursEnd, fuelConsumed,
      ttnNumber, ttnDate, unloadDateByTTN, cargoWeightTons,
      hasMissingFuelings, missingFuelingsComment,
    };
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
  }, [odometerStart, odometerEnd, deadheadDistanceKm, motorHoursStart, motorHoursEnd, fuelConsumed, ttnNumber, ttnDate, unloadDateByTTN, cargoWeightTons, hasMissingFuelings, missingFuelingsComment]);

  const pickTtnPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу до камери');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const compressedUri = await compressPhoto(result.assets[0].uri);
      setTtnPhotoUris((current) => [...current, compressedUri]);
    }
  };

  const pickTtnPhotosFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу до галереї');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const compressedUris = await Promise.all(
        result.assets.map((asset) => compressPhoto(asset.uri))
      );
      setTtnPhotoUris((current) => [...current, ...compressedUris]);
    }
  };

  const removeTtnPhoto = (uri) => {
    setTtnPhotoUris((current) => current.filter((item) => item !== uri));
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

  // §6.4 ТЗ: тогл стоїть на рядку заправки цілком — реф або тягач
  const handleToggleTank = async (fueling, tank) => {
    const previousFuelings = fuelings;
    setFuelingActionId(fueling._id);
    setFuelings((prev) => prev.map((f) => (f._id === fueling._id ? { ...f, tank } : f)));
    try {
      const token = await AsyncStorage.getItem('token');
      await setFuelingTank(routeId, token, fueling._id, tank);
    } catch (error) {
      setFuelings(previousFuelings);
      Alert.alert('Помилка', 'Не вдалося зберегти зміну. Перевірте з\'єднання.');
    } finally {
      setFuelingActionId(null);
    }
  };

  // §6.3 ТЗ: у СТРАНС нема API — водій додає заправку AdBlue в тягач вручну
  const handleAddStrans = async () => {
    const liters = Number(stransLiters);
    if (!stransLiters || Number.isNaN(liters) || liters <= 0) {
      Alert.alert('Перевірте дані', 'Вкажіть кількість літрів AdBlue');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedReport = await addStransFueling(routeId, token, liters);
      setFuelings(updatedReport.fuelings || []);
      setStransLiters('');
      setShowStransInput(false);
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      Alert.alert('Помилка', message);
    }
  };

  const handleRemoveStrans = async (fuelingId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedReport = await removeStransFueling(routeId, token, fuelingId);
      setFuelings(updatedReport.fuelings || []);
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      Alert.alert('Помилка', message);
    }
  };

  const validate = () => {
    if (ttnPhotoUris.length === 0 && !(report?.ttnPhotos?.length > 0) && !(report && report.ttnPhoto)) {
      return "Додайте фото ТТН/CMR";
    }
    if (!ttnNumber.trim()) {
      return "Вкажіть номер ТТН/CMR";
    }
    if (!ttnDate) {
      return "Вкажіть дату ТТН/CMR";
    }
    if (!unloadDateByTTN) {
      return "Вкажіть дату вивантаження згідно ТТН/CMR";
    }
    if (cargoWeightTons === '' || Number.isNaN(Number(cargoWeightTons)) || Number(cargoWeightTons) <= 0) {
      return "Вкажіть вагу вантажу згідно ТТН (в тоннах)";
    }
    if (Number(cargoWeightTons) > 40) {
      return "Вкажіть вагу в тоннах, а не в кілограмах";
    }
    if (odometerStart === '' || Number.isNaN(Number(odometerStart))) {
      return "Вкажіть початковий показник одометра";
    }
    if (odometerEnd === '' || Number.isNaN(Number(odometerEnd))) {
      return "Вкажіть кінцевий показник одометра";
    }
    if (deadheadDistanceKm === '' || Number.isNaN(Number(deadheadDistanceKm)) || Number(deadheadDistanceKm) < 0) {
      return "Вкажіть коректну відстань перегону";
    }
    if (Number(odometerEnd) >= Number(odometerStart) &&
        Number(deadheadDistanceKm) > Number(odometerEnd) - Number(odometerStart)) {
      return "Перегін не може перевищувати загальний пробіг за рейс";
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

  const submitFields = async (confirmed, includePhotos = true) => {
    const token = await AsyncStorage.getItem('token');
    const geo = await getGeolocation();
    const fields = {
      odometerStart: Number(odometerStart),
      odometerEnd: Number(odometerEnd),
      deadheadDistanceKm: Number(deadheadDistanceKm),
      motorHoursStart: Number(motorHoursStart),
      motorHoursEnd: Number(motorHoursEnd),
      fuelConsumed: Number(fuelConsumed),
      ttnNumber: ttnNumber.trim(),
      ttnDate: ttnDate ? ttnDate.toISOString() : '',
      unloadDateByTTN: unloadDateByTTN ? unloadDateByTTN.toISOString() : '',
      cargoWeightTons: Number(cargoWeightTons),
      hasMissingFuelings,
      missingFuelingsComment: missingFuelingsComment.trim(),
      latitude: geo.latitude || '',
      longitude: geo.longitude || '',
      confirmed,
    };
    const files = { ttnPhotos: includePhotos ? ttnPhotoUris : [] };
    return submitOrQueue(routeId, token, fields, files);
  };

  const finishSubmission = (result) => {
    setSubmitting(false);

    if (result.queued) {
      Alert.alert(
        'Немає з\'єднання',
        'Звіт збережено на пристрої і буде надіслано автоматично, щойно з\'явиться мережа.'
      );
      navigation.goBack();
      return;
    }

    Alert.alert('Рейс завершено', 'Звіт успішно подано.');
    navigation.goBack();
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Перевірте дані', validationError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitFields(false);

      // §5 ТЗ: попередження — водій бачить розрахункові значення і підтверджує перед відправкою
      if (result.needsConfirmation) {
        setSubmitting(false);
        Alert.alert(
          'Перевірте показники',
          `${result.data.warnings.join('\n')}\n\nПідтвердіть, що значення вірні, щоб надіслати звіт.`,
          [
            { text: 'Скасувати', style: 'cancel' },
            {
              text: 'Підтвердити і надіслати',
              onPress: async () => {
                setSubmitting(true);
                try {
                  // Фото вже збережені сервером під час першої перевірки; повторно не завантажуємо.
                  const confirmedResult = await submitFields(true, false);
                  finishSubmission(confirmedResult);
                } catch (error) {
                  setSubmitting(false);
                  const message = error.response?.data?.error?.message || error.message;
                  Alert.alert('Помилка подання звіту', message);
                }
              },
            },
          ]
        );
        return;
      }

      finishSubmission(result);
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

  if (report?.status === 'submitted') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 15 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Звіт по рейсу вже подано</Text>
          <Text style={styles.fieldText}>Рейс: {tripRoute.route_id}</Text>
          <Text style={styles.fieldText}>Одометр: {report.odometerStart} → {report.odometerEnd} км</Text>
          <Text style={styles.fieldText}>Перегін: {report.deadheadDistanceKm || 0} км</Text>
          <Text style={styles.fieldText}>Мотогодини: {report.motorHoursStart} → {report.motorHoursEnd}</Text>
          <Text style={styles.fieldText}>Витрата пального: {report.fuelConsumed} л</Text>
          <Text style={styles.fieldText}>Номер ТТН/CMR: {report.ttnNumber}</Text>
          <Text style={styles.fieldText}>Дата ТТН/CMR: {report.ttnDate ? formatDateOnly(report.ttnDate) : ''}</Text>
          <Text style={styles.fieldText}>Дата вивантаження згідно ТТН/CMR: {report.unloadDateByTTN ? formatDateOnly(report.unloadDateByTTN) : ''}</Text>
          <Text style={styles.fieldText}>Вага вантажу згідно ТТН: {report.cargoWeightTons} т</Text>
        </View>
        {report.fuelings && report.fuelings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Заправки за рейс</Text>
            {report.fuelings.map((f) => (
              <View key={f._id} style={styles.fuelRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldText}>{formatDateFull(f.dateTime)}</Text>
                  <Text style={styles.fieldText}>
                    {FUELING_PROVIDER_LABELS[f.provider] || f.provider}{f.stationName ? ` • ${f.stationName}` : ''}
                  </Text>
                  <Text style={styles.fieldText}>
                    {f.fuelType} — {f.liters} л{f.category === 'diesel' ? ` (${f.tank === 'reefer' ? 'реф' : 'тягач'})` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {report.hasMissingFuelings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Є заправки, яких немає в списку</Text>
            {!!report.missingFuelingsComment && (
              <Text style={styles.fieldText}>{report.missingFuelingsComment}</Text>
            )}
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Назад</Text>
        </TouchableOpacity>
      </ScrollView>
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

      {/* 4.2 ТТН/CMR (обов'язково) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ТТН / CMR *</Text>

        <Text style={styles.fieldTitle}>Номер ТТН/CMR *</Text>
        <TextInput style={styles.input} value={ttnNumber} onChangeText={setTtnNumber} />

        <Text style={styles.fieldTitle}>Дата ТТН/CMR *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setTtnDatePickerVisibility(true)}>
          <Text>{ttnDate ? formatDateOnly(ttnDate) : 'Виберіть дату'}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isTtnDatePickerVisible}
          mode="date"
          date={ttnDate || new Date()}
          onConfirm={(date) => { setTtnDate(date); setTtnDatePickerVisibility(false); }}
          onCancel={() => setTtnDatePickerVisibility(false)}
        />

        <Text style={styles.fieldTitle}>Дата вивантаження згідно ТТН/CMR *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setUnloadDateByTTNPickerVisibility(true)}>
          <Text>{unloadDateByTTN ? formatDateOnly(unloadDateByTTN) : 'Виберіть дату'}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isUnloadDateByTTNPickerVisible}
          mode="date"
          date={unloadDateByTTN || new Date()}
          onConfirm={(date) => { setUnloadDateByTTN(date); setUnloadDateByTTNPickerVisibility(false); }}
          onCancel={() => setUnloadDateByTTNPickerVisibility(false)}
        />

        <Text style={styles.fieldTitle}>Вага вантажу згідно ТТН, в тоннах *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={cargoWeightTons} onChangeText={setCargoWeightTons} />

        <Text style={[styles.fieldTitle, { marginTop: 12 }]}>Фото ТТН *</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={pickTtnPhoto}>
            <Text style={styles.buttonText}>Зробити фото</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={pickTtnPhotosFromGallery}>
            <Text style={styles.buttonText}>Обрати з галереї</Text>
          </TouchableOpacity>
        </View>
        {ttnPhotoUris.length > 0 && (
          <View style={styles.photoGrid}>
            {ttnPhotoUris.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.photoPreviewContainer}>
                <Image source={{ uri }} style={styles.preview} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={() => removeTtnPhoto(uri)}>
                  <Text style={styles.removePhotoText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {ttnPhotoUris.length === 0 && (report?.ttnPhotos?.length > 0 || report?.ttnPhoto) && (
          <Text style={styles.fieldText}>
            Фото вже збережено: {report?.ttnPhotos?.length || 1}
          </Text>
        )}
      </View>

      {/* 4.3 Показання одометра/мотогодин */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Показання одометра та мотогодин</Text>
        <Text style={styles.fieldTitle}>Початковий одометр, км{report?.odometerStartManual ? '' : ' (авто)'}</Text>
        <TextInput
          style={[styles.input, !report?.odometerStartManual && styles.inputDisabled]}
          keyboardType="numeric"
          value={odometerStart}
          editable={!!report?.odometerStartManual}
          onChangeText={setOdometerStart}
        />
        <Text style={styles.fieldTitle}>Кінцевий одометр, км *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={odometerEnd} onChangeText={setOdometerEnd} />

        <Text style={styles.fieldTitle}>Перегін, км *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={deadheadDistanceKm} onChangeText={setDeadheadDistanceKm} />

        <Text style={styles.fieldTitle}>Початкові мотогодини реф установки{report?.motorHoursStartManual ? '' : ' (авто)'}</Text>
        <TextInput
          style={[styles.input, !report?.motorHoursStartManual && styles.inputDisabled]}
          keyboardType="numeric"
          value={motorHoursStart}
          editable={!!report?.motorHoursStartManual}
          onChangeText={setMotorHoursStart}
        />
        <Text style={styles.fieldTitle}>Кінцеві мотогодини реф установки *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={motorHoursEnd} onChangeText={setMotorHoursEnd} />
      </View>

      {/* 4.4 Витрата палива за рейс */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Загальна витрата палива за рейс, л *</Text>
        <Text style={styles.warningText}>Увага! Не вказувати середній розхід!</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={fuelConsumed}
          onChangeText={setFuelConsumed}
          placeholder="Літрів за весь рейс"
        />
      </View>

      {/* §6 ТЗ: Заправки за рейс (довідково, водій лише розподіляє реф/тягач і додає СТРАНС) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Заправки за рейс</Text>

        {fuelingsFetchFailed && (
          <Text style={styles.fuelBanner}>Не вдалося отримати заправки — немає зв'язку</Text>
        )}
        {!fuelingsFetchFailed && fuelDataIncompleteProviders.length > 0 && (
          <Text style={styles.fuelBanner}>
            Не відповів постачальник: {fuelDataIncompleteProviders.join(', ')}
          </Text>
        )}
        {!fuelingsFetchFailed && fuelDataIncompleteProviders.length === 0 && fuelings.length === 0 && (
          <Text style={styles.fieldText}>За цей рейс заправок по картах не знайдено</Text>
        )}

        {fuelings.map((f) => (
          <View key={f._id} style={styles.fuelRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldText}>{formatDateFull(f.dateTime)}</Text>
              <Text style={styles.fieldText}>
                {FUELING_PROVIDER_LABELS[f.provider] || f.provider}{f.stationName ? ` • ${f.stationName}` : ''}
              </Text>
              <Text style={styles.fieldText}>
                {f.fuelType} — {f.liters} л{f.category === 'other' ? ' (не паливо)' : ''}
              </Text>
            </View>

            {f.category === 'diesel' && (
              <View style={styles.tankToggle}>
                <Text style={styles.fieldText}>{f.tank === 'reefer' ? 'Реф' : 'Тягач'}</Text>
                <Switch
                  value={f.tank === 'reefer'}
                  onValueChange={(value) => handleToggleTank(f, value ? 'reefer' : 'tractor')}
                  disabled={fuelingActionId === f._id}
                />
              </View>
            )}

            {f.manual && (
              <TouchableOpacity onPress={() => handleRemoveStrans(f._id)} style={styles.removeFuelButton}>
                <Text style={styles.removeFuelButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!showStransInput ? (
          <TouchableOpacity style={styles.button} onPress={() => setShowStransInput(true)}>
            <Text style={styles.buttonText}>Додати заправку СТРАНС</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stransInputRow}>
            <TextInput
              style={[styles.input, styles.stransInput]}
              keyboardType="numeric"
              placeholder="Літрів AdBlue"
              value={stransLiters}
              onChangeText={setStransLiters}
            />
            <TouchableOpacity style={styles.stransAddButton} onPress={handleAddStrans}>
              <Text style={styles.buttonText}>Додати</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* §6.7 ТЗ: флажок — сигнал логісту, що список неповний з погляду водія; без ручного вводу заправки */}
        <View style={styles.missingFuelRow}>
          <Switch value={hasMissingFuelings} onValueChange={setHasMissingFuelings} />
          <Text style={[styles.fieldText, { flex: 1, marginLeft: 8 }]}>Є заправки, яких немає в списку</Text>
        </View>
        {hasMissingFuelings && (
          <TextInput
            style={[styles.input, styles.missingFuelComment]}
            placeholder="Де і скільки приблизно залили (необов'язково)"
            value={missingFuelingsComment}
            onChangeText={setMissingFuelingsComment}
            multiline
          />
        )}
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
  warningText: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    fontSize: RFValue(12),
    marginTop: 4,
  },
  inputDisabled: {
    backgroundColor: '#eee',
    color: '#888',
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
    width: 105,
    height: 105,
    borderRadius: 5,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: RFValue(16),
    lineHeight: RFValue(17),
    fontWeight: 'bold',
  },
  fuelBanner: {
    fontSize: RFValue(11),
    color: '#d9534f',
    marginBottom: 8,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  tankToggle: {
    alignItems: 'center',
    marginLeft: 8,
  },
  removeFuelButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeFuelButtonText: {
    color: '#d9534f',
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
  stransInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stransInput: {
    flex: 1,
    marginTop: 0,
  },
  stransAddButton: {
    backgroundColor: '#0080ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginLeft: 8,
  },
  missingFuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  missingFuelComment: {
    marginTop: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

export default TripCompletionScreen;
