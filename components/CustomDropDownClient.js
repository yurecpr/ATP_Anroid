// CustomDropDown.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Button, TouchableOpacity, FlatList, TextInput, TouchableWithoutFeedback } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';

import Icon from 'react-native-vector-icons/FontAwesome';
const CustomDropDownClient = ({ items, onValueChange, onClose }) => {
  console.log('items', items);

  console.log('filter', filteredItems);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          console.log(item);
          onValueChange(item);
          onClose();
        }}
        key={item._id}
      >
        <View style={styles.item}>
          <Text>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Modal>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View>
              <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
              />
            </View>
          </View>
          <View style={styles.searchInput}>
            <Icon name="search" style={styles.icon} />
            <TextInput
              onChangeText={setSearchTerm}
              value={searchTerm}
              placeholder="Пошук по назві"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    maxHeight: '50%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  item: {
    padding: 10,
    alignItems: 'center'
  },
  searchInput: {
    flexDirection: 'row',
    height: RFPercentage(4),
    borderRadius: RFValue(10),
    paddingHorizontal: RFValue(10),
    backgroundColor: 'white',
    marginVertical: RFValue(10),
    marginHorizontal: RFValue(20),
    fontSize: RFValue(14),
    fontFamily: 'OpenSans',
  },
  icon: {
    alignSelf: 'center',
    fontSize: RFValue(14),
    paddingRight: 5
  }

})
export default CustomDropDownClient;
