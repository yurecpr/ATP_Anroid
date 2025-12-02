import React from 'react';
import {Text, TouchableOpacity, Linking, Platform} from 'react-native';

const openMapWithAddress = (address) => {
    const formattedAddress = encodeURIComponent(address);
    const scheme = Platform.select({ ios: 'http://maps.apple.com/?daddr=', android: 'geo:0,0?q=' });
    const url = `${scheme}${formattedAddress}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          console.log(`Can't open the URL: ${url}`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };
  export default openMapWithAddress;