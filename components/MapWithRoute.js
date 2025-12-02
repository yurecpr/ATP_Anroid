import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, Callout, PROVIDER_GOOGLE} from 'react-native-maps';
import Geocoder from 'react-native-geocoding';

const MapWithRoute = ({ startAddress, endAddress, currentRoute }) => {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    Geocoder.init('AIzaSyCvfzyrAdNyDEZcm5-_7bY3-dD1yQ9GCTk');
    Geocoder.from(startAddress)
      .then((response) => {
        const { lat, lng } = response.results[0].geometry.location;
        setStartLocation({ latitude: lat, longitude: lng });
      })
      .catch((error) => console.log(error));

    Geocoder.from(endAddress)
      .then((response) => {
        const { lat, lng } = response.results[0].geometry.location;
        setEndLocation({ latitude: lat, longitude: lng });
      })
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    if (startLocation && endLocation) {
      fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation.latitude},${startLocation.longitude}&destination=${endLocation.latitude},${endLocation.longitude}&mode=driving&key=AIzaSyCvfzyrAdNyDEZcm5-_7bY3-dD1yQ9GCTk`)
        .then((response) => response.json())
        .then((responseJson) => {
          const points = responseJson.routes[0].overview_polyline.points;
          const decodedPoints = decodePolyline(points);
          setRouteCoordinates(decodedPoints);
        })
        .catch((error) => console.log(error));
    }
  }, [startLocation, endLocation]);

  const decodePolyline = (encoded) => {
    const len = encoded.length;
    let index = 0;
    let lat = 0;
    let lng = 0;
    const polyline = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      polyline.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return polyline;
  };

  const additionalPoints = currentRoute.checkpoints
    .filter(point => point.latitude && point.longitude)
    .map(point => ({
      latitude: parseFloat(point.latitude),
      longitude: parseFloat(point.longitude),
      title: point.name,
    }));



  return (
    <View style={styles.container}>
      {startLocation && endLocation && (
        <MapView
        provider={PROVIDER_GOOGLE}
          style={styles.map}
          minHeight={200}
          initialRegion={{
            latitude: (startLocation.latitude + endLocation.latitude) / 2,
            longitude: (startLocation.longitude + endLocation.longitude) / 2,
            latitudeDelta: Math.abs(startLocation.latitude - endLocation.latitude) * 1.5,
            longitudeDelta: Math.abs(startLocation.longitude - endLocation.longitude) * 1.5,
          }}

        >
          <Marker coordinate={startLocation} title="Точка завантаження" />
          <Marker coordinate={endLocation} title="Точка розвантаження" />
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#F00"
            strokeWidth={3}
          />
          {additionalPoints.map((point, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.title}
              pinColor={'blue'}
            >
              <Callout>
                <View>
                  <Text>{point.title}</Text>
                </View>
              </Callout>

            </Marker>
          ))}
        </MapView>
      )}
      {!startLocation && (
        <Text style={styles.loading}>Завантаження стартової точки...</Text>
      )}
      {!endLocation && (
        <Text style={styles.loading}>Завантаження кінцевої точки...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default MapWithRoute;