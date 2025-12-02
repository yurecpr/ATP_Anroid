import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet, ScrollView } from 'react-native';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Icon from 'react-native-vector-icons/FontAwesome';
const AddCheckpointModal = ({ visible, checkpoints, onAddCheckpoint, onClose, currentCheckpoint }) => {
  console.log(currentCheckpoint);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(() => {
    const selectedStage = checkpoints.find(stage => stage.checkpoints.some(checkpoint => checkpoint.name === currentCheckpoint.name));
    return selectedStage.checkpoints.find(checkpoint => checkpoint.name === currentCheckpoint.name);
  });
  

  const handleAddCheckpoint = () => {
    if (selectedCheckpoint) {
      onAddCheckpoint(selectedCheckpoint);
      setSelectedCheckpoint(null);
    }
  };

  const handleCheckpointPress = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Ваш контент */}
          <View style={styles.checkpoints}>
            {checkpoints.map((section) => (
              <View key={section.id}>
                <View style={{ flexDirection: 'row' }}>
                  <Icon name="chevron-circle-right" style={styles.icon} />
                  <Text>{section.stage}</Text>
                </View>
                {section.checkpoints.map((checkpoint) => (
                  <TouchableOpacity
                    key={checkpoint.id}
                    style={[
                      styles.checkpoint,
                      selectedCheckpoint?.id === checkpoint.id && styles.selectedCheckpoint,
                    ]}
                    onPress={() => handleCheckpointPress(checkpoint)}
                  >
                    <Text style={styles.checkpointText}>{checkpoint.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Відміна</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleAddCheckpoint}>
              <Text style={styles.buttonText}>Обрати статус</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  </Modal>
  
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    // Если хотите, чтобы при небольшом контенте он центрировался, можно добавить:
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // Если контент может быть больше экрана, лучше использовать flex-start:
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    // Убираем marginTop: 'auto' и marginBottom: 'auto'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkpoints: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  checkpoint: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: '#e0dcdc',
  },
  checkpointText: {
    fontSize: RFValue(12),
  },
  selectedCheckpoint: {
    backgroundColor: '#0080ff',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: 'tomato',
  },
  buttonText: {
    color: 'white',
    fontSize: RFValue(15),
  },
  icon: {
    color: 'tomato',
    paddingRight: 5,
    paddingBottom: 10,
    fontSize: RFValue(20),
  },
});


export default AddCheckpointModal;
