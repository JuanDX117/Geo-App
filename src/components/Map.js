import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const API_KEY = 'AIzaSyAVqKR_OuT9YPIb_n6tqk-H9ro5pHcl56k';

const mapContainerStyle = {
  height: '100vh',
  width: '100%',
};

const sidebarStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '300px',
  height: '90%',
  backgroundColor: '#f5f5f5',
  overflowY: 'auto',
  padding: '10px',
  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
  zIndex: '1',
  borderRadius: '8px',
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '15px',
  marginBottom: '10px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const cardHoverStyle = {
  backgroundColor: '#e0e0e0', // Color al hacer hover para mejor visibilidad
};

const center = {
  lat: 0,
  lng: 0,
};

const Map = () => {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(center);
  const [places, setPlaces] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [directions, setDirections] = useState(null);

  // Obtener la ubicación actual al cargar el componente
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Obtener la ubicación actual en tiempo real
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Ubicación actual: Lat ${latitude}, Lng ${longitude}`); // Verifica las coordenadas en la consola
          setCurrentLocation({ lat: latitude, lng: longitude });
          if (map) {
            map.panTo({ lat: latitude, lng: longitude });
          }
          fetchNearbyPlaces(latitude, longitude);
        },
        (error) => {
          console.error('Error obteniendo la ubicación:', error);
          setErrorMessage('Error al obtener la ubicación. Verifica los permisos o prueba en otro navegador.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setErrorMessage('La geolocalización no está disponible en este navegador.');
    }
  };

  // Obtener los lugares cercanos usando Google Places API y ordenar por proximidad
  const fetchNearbyPlaces = async (lat, lng) => {
    if (!map) {
      console.error("El mapa no está listo todavía.");
      return;
    }

    const service = new window.google.maps.places.PlacesService(map);

    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: '3000', // Radio de búsqueda en metros
      type: ['restaurant', 'store'], // Tipos de lugares que estamos buscando
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        // Ordenar lugares por proximidad
        const sortedPlaces = results.sort((a, b) => {
          const distanceA = getDistance(lat, lng, a.geometry.location.lat(), a.geometry.location.lng());
          const distanceB = getDistance(lat, lng, b.geometry.location.lat(), b.geometry.location.lng());
          return distanceA - distanceB; // Ordena de menor a mayor distancia
        });

        setPlaces(sortedPlaces);
      } else {
        setErrorMessage('No se encontraron lugares cercanos.');
      }
    });
  };

  // Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const toRadians = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Retorna la distancia en km
  };

  // Al seleccionar un lugar, centra el mapa en ese lugar y traza una ruta
  const selectPlace = (place) => {
    setSelectedPlace(place);
    calculateRoute(place.geometry.location);
  };

  // Calcular la ruta desde la ubicación actual hasta el lugar seleccionado
  const calculateRoute = (destination) => {
    if (!map || !currentLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error al calcular la ruta: ${status}`);
        }
      }
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <LoadScript googleMapsApiKey={API_KEY} libraries={['places', 'directions']}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation}
          zoom={15}
          onLoad={(mapInstance) => setMap(mapInstance)}
        >
          {/* Marcador de la ubicación actual */}
          {currentLocation && <Marker position={currentLocation} label="Estás aquí" />}
          {/* Mostrar la ruta calculada */}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>

        {/* Botón para centrar en la ubicación actual */}
        <button
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: '1',
            padding: '10px 20px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onClick={getCurrentLocation}
        >
          Centrar en mi ubicación
        </button>
      </LoadScript>

      {/* Panel lateral para mostrar los lugares cercanos */}
      <div style={sidebarStyle}>
        <h3>Puntos de Interés Cercanos</h3>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {places.length > 0 ? (
            places.map((place, index) => (
              <li
                key={index}
                style={cardStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                onClick={() => selectPlace(place)}
              >
                <strong>{place.name}</strong>
                <br />
                {place.vicinity}
                <br />
                <em>{place.types.join(', ')}</em>
              </li>
            ))
          ) : (
            !errorMessage && <p>Cargando lugares cercanos...</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Map;
