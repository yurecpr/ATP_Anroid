import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, FlatList, TouchableOpacity, Text, Vibration } from 'react-native';
import Loading from "../screens/Loading.js";
import { serverUrl } from '../config';
import { RFValue } from "react-native-responsive-fontsize";
import { formatDate } from "../utils/dateUtils.js";
import Icon from 'react-native-vector-icons/FontAwesome';

const NewsScreen = ({ navigation }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await axios.get(`${serverUrl}/api/posts/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error) {
            alert('Не вдалося завантажити новини!');
            console.log(error);
            return null;
        }
    }

    const loadNews = async () => {
        setLoading(true);
        const data = await fetchNews();
        console.log('data', data)
        if (data) {
            setNews(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadNews();
    }, [])

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => { console.log('truck', item); Vibration.vibrate(25); navigation.navigate('PostScreen', item) }}>
            <View style={[styles.item]}>
                <View>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="chevron-circle-right" style={styles.icon} />
                        <Text style={styles.title}>
                            {item.title}
                        </Text>
                    </View>

                    <Text style={styles.postDescription}> {item.description}</Text>
                    <Text style={styles.date}> {formatDate(item.publish_date)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <Loading />
    }
    return (
        <View style={styles.container}>
            <FlatList
                data={news}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                style={styles.list}
            />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',

    },
    list: {
        padding: 5
    },
    item: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    title: {
        fontSize: RFValue(16),
        fontFamily: 'OpenSans'
    },
    postDescription: {
        fontFamily: 'OpenSans'
    },

    date: {
        fontFamily: 'OpenSans',
        color: 'tomato'
    },

    icon: {
        color: 'tomato',
        paddingRight: 5,
        paddingBottom: 10,
        fontSize: RFValue(20),
    }

})
export default NewsScreen;
