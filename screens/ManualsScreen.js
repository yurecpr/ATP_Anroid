import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, FlatList, TouchableOpacity, Text, Vibration, Linking } from 'react-native';
import Loading from "./Loading.js";
import { serverUrl } from '../config';
import { RFValue } from "react-native-responsive-fontsize";
import { formatDate } from "../utils/dateUtils.js";
import Icon from 'react-native-vector-icons/FontAwesome';


const NewsScreen = ({ navigation }) => {
    const [manuals, setManuals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchManuals = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await axios.get(`${serverUrl}/api/posts/manuals`, {
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

    const loadManuals = async () => {
        setLoading(true);
        const data = await fetchManuals();
        console.log('data', data)
        if (data) {
            // Розгортаємо posts у плоский список
            const flatList = [];
            data.forEach(category => {
                category.posts.forEach(post => {
                    flatList.push(post);
                });
            });
            setManuals(flatList);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadManuals();
    }, [])

    const handleManualPress = (manual) => {
        Vibration.vibrate(25);
        navigation.navigate('PostScreen', manual);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleManualPress(item)}>
            <View style={styles.item}>
                <Icon name="star" style={styles.icon} />
                <Text style={styles.title}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <Loading />
    }
    return (
        <View style={styles.container}>
            <FlatList
                data={manuals}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    title: {
        fontSize: RFValue(16),
        fontFamily: 'OpenSans',
        color: 'tomato',
        flex: 1,
    },
    icon: {
        color: 'tomato',
        paddingRight: 10,
        fontSize: RFValue(20),
    }
})
export default NewsScreen;
