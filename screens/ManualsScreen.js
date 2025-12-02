import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, FlatList, TouchableOpacity, Text, Vibration } from 'react-native';
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
            setManuals(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadManuals();
    }, [])

    const renderItem = ({ item }) => (

        <View style={[styles.item]}>
            <Text style={styles.subcategoryTitle}>{item._id}</Text>
            {item.posts.map(manual => (
                <TouchableOpacity key={manual._id} onPress={() => { console.log('manual', manual); Vibration.vibrate(25); navigation.navigate('PostScreen', manual) }}>
                    <View key={manual._id} style={{flexDirection: 'row', paddingTop: 5}}>
                    <Icon name="star"  style={styles.icon} />
                        <Text style={styles.title}>{manual.title}</Text>
                    </View>
                </TouchableOpacity>
                ))
                }
        </View>
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
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    subcategoryTitle: {
        fontSize: RFValue(20),
        fontFamily: 'OpenSans',
        borderBottomWidth: 1,
        paddingBottom: 10
    },
    title: {
        fontSize: RFValue(16),
        fontFamily: 'OpenSans',
        color: 'tomato'
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
