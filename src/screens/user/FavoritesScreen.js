import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

/**
 * Tela de "Favoritos".
 * Lista todos os produtos que o usuário marcou como favoritos.
 */
const FavoritesScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, isFavorite, removeFavorite, addFavorite } = useAuth(); // Pega a lista de IDs favoritos
  const { showSnackbar } = useSnackbar();

  // Função para buscar os dados completos dos produtos favoritos
  const fetchProducts = useCallback(async () => {
    if (favorites.length === 0) {
      // Otimização: se não há favoritos, não faz chamada à API
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Busca TODOS os produtos
      // (Otimização futura: buscar apenas os IDs da lista 'favorites'
      // se a API do Firestore permitir um 'IN' query)
      const response = await fetch(`${FIRESTORE_BASE_URL}/products`);
      const data = await response.json();
      const allProducts =
        data.documents?.map(transformFromFirestore).filter((p) => p !== null) ||
        [];

      // 2. Filtra localmente apenas os produtos favoritos
      const favoriteProducts = allProducts.filter((p) =>
        favorites.includes(p.id)
      );
      setProducts(favoriteProducts);
    } catch (error) {
      showSnackbar('Erro ao carregar favoritos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [favorites, showSnackbar]); // Dependência: lista de IDs 'favorites'

  // Recarrega os dados quando a tela entra em foco (ou a lista de favoritos muda)
  useFocusEffect(fetchProducts);

  if (loading) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Reutiliza o componente 'card' da HomeScreen
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
          >
            <Image
              source={{
                uri: item.images?.[0] || 'https://via.placeholder.com/100',
              }}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardPrice}>
                R$ {item.price ? item.price.toFixed(2) : '0.00'}
              </Text>
            </View>
            {/* Botão de Favorito (aqui sempre estará 'cheio') */}
            <Pressable
              onPress={() =>
                isFavorite(item.id)
                  ? removeFavorite(item.id)
                  : addFavorite(item.id)
              }
              style={styles.favoriteButton}
            >
              <Ionicons name={'heart'} size={24} color={'red'} />
            </Pressable>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            Você ainda não marcou nenhum produto como favorito.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default FavoritesScreen;