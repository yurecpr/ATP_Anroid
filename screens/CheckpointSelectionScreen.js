import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RFValue } from "react-native-responsive-fontsize";

// Статуси, для яких перед застосуванням потрібне додаткове підтвердження водія
const CRITICAL_CHECKPOINTS = ['Рейс завершено', 'Водій відхилив рейс'];

const CheckpointSelectionScreen = ({ route, navigation }) => {
  // Параметры, переданные через навигацию
  const { checkpoints, currentCheckpoint, onAddCheckpoint, tripRoute } = route.params;

  const [selectedCheckpoint, setSelectedCheckpoint] = useState(() => {
    const selectedSection = checkpoints.find(section =>
      section.checkpoints.some(cp => cp.name === currentCheckpoint.name)
    );
    return selectedSection
      ? selectedSection.checkpoints.find(cp => cp.name === currentCheckpoint.name)
      : null;
  });

  const applyCheckpoint = () => {
    if (selectedCheckpoint.name === 'Рейс завершено') {
      // "Рейс завершено" не зберігається одразу — відкриваємо форму завершення рейсу
      navigation.replace('TripCompletionScreen', { tripRoute });
      return;
    }
    onAddCheckpoint(selectedCheckpoint);
    navigation.goBack();
  };

  const handleAddCheckpoint = () => {
    if (!selectedCheckpoint) {
      return;
    }
    if (CRITICAL_CHECKPOINTS.includes(selectedCheckpoint.name)) {
      Alert.alert(
        'Підтвердження',
        `Ви впевнені, що хочете встановити статус "${selectedCheckpoint.name}"?`,
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Так', style: 'destructive', onPress: applyCheckpoint },
        ]
      );
      return;
    }
    applyCheckpoint();
  };


  return (
    <View style={styles.container}>
      {/* Заголовок с кнопкой назад */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="tomato" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выберите статус</Text>
      </View> */}

      {/* Основное содержимое со скроллом */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {checkpoints.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="chevron-circle-right" style={styles.icon} />
              <Text style={styles.sectionTitle}>{section.stage}</Text>
            </View>
            {section.checkpoints.map((checkpoint) => (
              <TouchableOpacity
                key={checkpoint.id}
                style={[
                  styles.checkpoint,
                  selectedCheckpoint?.id === checkpoint.id && styles.selectedCheckpoint,
                ]}
                onPress={() => setSelectedCheckpoint(checkpoint)}
              >
                <Text style={styles.checkpointText}>{checkpoint.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Кнопки действий */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.buttonCancel} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Скасувати</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonConfirm} onPress={handleAddCheckpoint}>
          <Text style={styles.buttonText}>Змінити статус</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: 'tomato',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: 'tomato',
  },
  scrollContent: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    color: 'tomato',
    marginRight: 5,
    fontSize: RFValue(20),
  },
  sectionTitle: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
  },
  checkpoint: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: '#e0dcdc',
  },
  selectedCheckpoint: {
    backgroundColor: '#0080ff',
  },
  checkpointText: {
    fontSize: RFValue(12),
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  buttonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: 'tomato',
  },
  buttonConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: 'green',
  },
  buttonText: {
    color: '#fff',
    fontSize: RFValue(14),
  },
});

export default CheckpointSelectionScreen;
