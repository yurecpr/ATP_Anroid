import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const PulseIcon = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 300, useNativeDriver: true }),
       Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => pulse());
  };

  useEffect(() => {
    pulse();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale }] }]}>
        <Icon name="bullseye" size={50} color="#fff" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 25, // половина значения width или height
    overflow: 'hidden', //
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    borderWidth: 5,
    borderRadius: 999,
    borderColor: '#fff',
    padding: 10,
  },
});

export default PulseIcon;
