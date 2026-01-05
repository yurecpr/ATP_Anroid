import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet, ScrollView } from 'react-native';
import { RFValue } from "react-native-responsive-fontsize";
import Icon from 'react-native-vector-icons/FontAwesome';

const AddCheckpointModal = ({ visible, checkpoints, onAddCheckpoint, onClose, currentCheckpoint }) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(() => {
    const stage = checkpoints.find(
      (s) => s.checkpoints.some((cp) => cp.name === currentCheckpoint.name)
    );
    return stage?.checkpoints.find((cp) => cp.name === currentCheckpoint.name) ?? null;
  });

  const handleAddCheckpoint = () => {
    if (selectedCheckpoint) {
      onAddCheckpoint(selectedCheckpoint);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {checkpoints.map((section) => (
              <View key={section.id}>
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

          <View style={styles.buttonsWrapper}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.buttonText}>Відміна</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submit]} onPress={handleAddCheckpoint}>
              <Text style={styles.buttonText}>Обрати статус</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    width: '92%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'relative',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkpoint: {
    padding: 10,
    marginVertical: 5,
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
  icon: {
    color: 'tomato',
    marginRight: 5,
    fontSize: RFValue(20),
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
  },
  buttonsWrapper: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancel: {
    backgroundColor: 'tomato',
  },
  submit: {
    backgroundColor: 'green',
  },
  buttonText: {
    color: 'white',
    fontSize: RFValue(15),
  },
});

export default AddCheckpointModal;
