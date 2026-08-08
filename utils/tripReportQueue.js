import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { serverUrl } from '../config';

const queueKey = (routeId) => `tripReportQueue_${routeId}`;
const draftKey = (routeId) => `tripReportDraft_${routeId}`;

// Копіює файл у постійну директорію застосунку, щоб він пережив очищення кешу до моменту відправки
async function persistFile(uri, folder) {
  if (!uri) return null;
  const dir = FileSystem.documentDirectory + folder + '/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const fileName = uri.split('/').pop();
  const destination = dir + Date.now() + '_' + fileName;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

async function buildFormData(fields, files) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });
  if (files.ttnPhoto) {
    formData.append('ttnPhoto', { uri: files.ttnPhoto, name: 'ttn.jpg', type: 'image/jpeg' });
  }
  if (files.protocolVideo) {
    formData.append('protocolVideo', { uri: files.protocolVideo, name: 'protocol.mp4', type: 'video/mp4' });
  }
  return formData;
}

async function postSubmit(routeId, token, fields, files) {
  const formData = await buildFormData(fields, files);
  return axios.post(`${serverUrl}/api/routes/${routeId}/trip-report/submit`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Локальна чернетка (для відновлення полів форми при повторному відкритті/офлайн)
export async function saveLocalDraft(routeId, fields) {
  await AsyncStorage.setItem(draftKey(routeId), JSON.stringify(fields));
}

export async function getLocalDraft(routeId) {
  const raw = await AsyncStorage.getItem(draftKey(routeId));
  return raw ? JSON.parse(raw) : null;
}

export async function clearLocalDraft(routeId) {
  await AsyncStorage.removeItem(draftKey(routeId));
}

// Ставить звіт у чергу на відправку (файли копіюються в постійне сховище)
export async function queueSubmission(routeId, fields, files) {
  const persistedTtnPhoto = await persistFile(files.ttnPhoto, 'trip_reports');
  const persistedProtocolVideo = await persistFile(files.protocolVideo, 'trip_reports');
  const payload = { fields, files: { ttnPhoto: persistedTtnPhoto, protocolVideo: persistedProtocolVideo } };
  await AsyncStorage.setItem(queueKey(routeId), JSON.stringify(payload));
  return payload;
}

export async function getQueuedSubmission(routeId) {
  const raw = await AsyncStorage.getItem(queueKey(routeId));
  return raw ? JSON.parse(raw) : null;
}

export async function clearQueuedSubmission(routeId) {
  await AsyncStorage.removeItem(queueKey(routeId));
}

// Намагається відправити звіт водія на сервер; при мережевій помилці ставить/лишає його в черзі
export async function submitOrQueue(routeId, token, fields, files) {
  try {
    const response = await postSubmit(routeId, token, fields, files);
    // §5 ТЗ: при попередженнях звіт ще не подано—чекаємо підтвердження водія
    if (response.data.needsConfirmation) {
      return { success: true, needsConfirmation: true, data: response.data };
    }
    await clearQueuedSubmission(routeId);
    await clearLocalDraft(routeId);
    return { success: true, data: response.data };
  } catch (error) {
    // Помилка валідації сервера (є відповідь) — не ставимо в чергу, водій має виправити дані
    if (error.response) {
      throw error;
    }
    await queueSubmission(routeId, fields, files);
    return { success: false, queued: true };
  }
}

// Викликається при відкритті екранів, щоб автоматично дослати раніше збережений офлайн-звіт
export async function trySyncQueuedTripReport(routeId, token) {
  const queued = await getQueuedSubmission(routeId);
  if (!queued) return null;
  try {
    const response = await postSubmit(routeId, token, queued.fields, queued.files);
    // Попередження вимагають явного підтвердження водія—автосинх не завершуємо, лишаємо в черзі
    if (response.data.needsConfirmation) {
      return { success: false, needsConfirmation: true, data: response.data };
    }
    await clearQueuedSubmission(routeId);
    await clearLocalDraft(routeId);
    return { success: true, data: response.data };
  } catch (error) {
    // Сервер явно відповів (напр. "вже подано") — повтор нічого не дасть, чистимо чергу, щоб не зациклюватись
    if (error.response) {
      await clearQueuedSubmission(routeId);
      return { success: false };
    }
    // Досі немає зв'язку або сервер недоступний — лишаємо в черзі до наступної спроби
    return { success: false };
  }
}

// §6.4 ТЗ: перемкнути заправку між баком тягача і рефа (лише дизельні позиції)
export async function setFuelingTank(routeId, token, fuelingId, tank) {
  const response = await axios.put(
    `${serverUrl}/api/routes/${routeId}/trip-report/fuelings/${fuelingId}/tank`,
    { tank },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// §6.3 ТЗ: додати заправку AdBlue від СТРАНС вручну (авто-поставщик/тягач, водій вводить лише літри)
export async function addStransFueling(routeId, token, liters) {
  const response = await axios.post(
    `${serverUrl}/api/routes/${routeId}/trip-report/fuelings/strans`,
    { liters },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function removeStransFueling(routeId, token, fuelingId) {
  const response = await axios.delete(
    `${serverUrl}/api/routes/${routeId}/trip-report/fuelings/${fuelingId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
