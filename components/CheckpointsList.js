import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {formatDate} from '../utils/dateUtils';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import moment from 'moment';

const CheckpointsList = ({ checkpoints }) => {
  const sortedCheckpoints = [...checkpoints].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

const renderItem = ({ item, index}) => {
  let duration = null;
  let prevItem;
  if (index > 0) {
    prevItem = sortedCheckpoints[index - 1];
  } else {
    prevItem = {date: new Date()};
  }
  const diff =  new Date(prevItem.date).getTime() - new Date(item.date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  duration = `${days} днів ${hours} годин ${minutes} хвилин`;

  return (
    <View style={[styles.item, index === 0 && styles.firstItem]}>
      <Icon name="angle-double-up" size={20} color="tomato"  style={{padding: 10}}/>
      <View>
        <Text style={styles.nameText}>{item.name}</Text>
        <View style={{flexDirection:'row', justifyContent: 'space-between'}}>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text> 
        {duration && <Text style={styles.dateText}> | {duration}</Text>}
        </View>
         

      </View>
    </View>
  );
};

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedCheckpoints}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  
  },
  list: {
    
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  nameText: {
    fontSize: RFValue(12),
    fontFamily: 'OpenSans'
  },
  dateText: {
    fontFamily: 'OpenSans',
    color: 'gray'
  },
  firstItem: {
    backgroundColor: '#f2f2f2',
  }
});

export default CheckpointsList;
