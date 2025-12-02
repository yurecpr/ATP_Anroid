import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Swiper from 'react-native-swiper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { serverUrl } from '../config';
import { formatDate } from '../utils/dateUtils';
import Loading from '../screens/Loading';
import { useNavigation } from '@react-navigation/native';

const NewsSlider = () => {

  const navigation = useNavigation();

  const [activeIndex, setActiveIndex] = useState(0);
 const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);

  const fetchNews = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
        const response = await axios.get(`${serverUrl}/api/posts/latest/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const loadNews = async () => {
    setLoading(true);
    const data = await fetchNews();
    if (data) {
        setNews(data);
    }
    setLoading(false);
}

useEffect(() => {
  loadNews();
}, [])

  const renderNews = () => {
    return news.map(item => (
      <View  key={item._id}>
        <TouchableOpacity style={styles.slide} onPress={()=> navigation.navigate('PostScreen', item)}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.description}</Text>
        <Text style={styles.date}>{formatDate(item.publish_date)}</Text>
        </TouchableOpacity>
      </View>
    ));
  };
  if (loading){
    return <View></View>
  }
  return (
    
    <View style={styles.container}>
    <Text style={styles.sectionTitle}>Останні новини компанії:</Text>
      <Swiper
        loop={true}
        autoplay={true}
        autoplayTimeout={5}
        paginationStyle= {{ marginTop: 25, bottom: 0, justifyContent: 'center',  }}

        showsPagination={true}
        activeDotColor='tomato'
      >
        {renderNews()}
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 150
  },
  slide: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'OpenSans',
    marginTop: 20
  },
  sectionTitle:{
    fontSize: RFValue(12),
    fontFamily: 'OpenSans',
    textAlign: 'center',
  },
  text: {
    fontSize: RFValue(12),
    textAlign: 'center',
    fontFamily: 'OpenSans'
  },
  date: {
    fontSize: RFValue(12),
    textAlign: 'center',
    fontFamily: 'OpenSans',
    color: 'tomato'
  }
});

export default NewsSlider;
