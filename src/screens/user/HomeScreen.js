import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';

/**
 * Tela principal de "Produtos" (Home) para o usuário.
 * Exibe a lista de produtos, com filtros e busca.
 */
const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  // Hooks de contexto
  const { addFavorite, removeFavorite, isFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Função para buscar produtos do Firestore
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${FIRESTORE_BASE_URL}/products`);
      const data = await response.json();
      // Mapeia, transforma e filtra produtos nulos
      const productList =
        data.documents?.map(transformFromFirestore).filter((p) => p !== null) ||
        [];
      setProducts(productList);
    } catch (error) {
      showSnackbar('Erro ao carregar produtos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]); // Dependência: showSnackbar

  // `useFocusEffect` (do React Navigation) roda a função toda vez que a tela entra em foco
  useFocusEffect(fetchProducts);

  // Memoiza a lista de categorias únicas
  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean); // Pega todas as categorias e remove nulas/undefined
    return ['Todos', ...new Set(cats)]; // Adiciona "Todos" e remove duplicatas
  }, [products]);

  // Memoiza a lista de produtos filtrados (busca e categoria)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro de Texto (Busca)
      const nameMatch =
        !isSearchBarVisible || // Se a barra não está visível, não filtra
        !searchText || // Se a barra está vazia, não filtra
        product.name?.toLowerCase().includes(searchText.toLowerCase());
      // Filtro de Categoria
      const categoryMatch =
        !selectedCategory ||
        selectedCategory === 'Todos' ||
        product.category === selectedCategory;
      return nameMatch && categoryMatch;
    });
  }, [products, searchText, selectedCategory, isSearchBarVisible]);

  // Handler para selecionar categoria no modal
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryModalVisible(false);
  };

  // Alterna a visibilidade da barra de busca
  const toggleSearchBar = () => {
    setIsSearchBarVisible((prev) => {
      if (prev) {
        setSearchText(''); // Limpa a busca ao fechar
      }
      return !prev;
    });
  };

  if (loading) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho Customizado com Busca e Filtro */}
      <View style={styles.homeHeader}>
        <TouchableOpacity
          style={styles.headerButtonLeft}
          onPress={toggleSearchBar}
        >
          <Ionicons
            name={isSearchBarVisible ? 'close-outline' : 'search-outline'}
            size={24}
            color="#007bff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButtonRight}
          onPress={() => setIsCategoryModalVisible(true)}
        >
          <Text style={styles.headerButtonText}>{selectedCategory}</Text>
          <Ionicons
            name="filter-outline"
            size={24}
            color="#007bff"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>

      {/* Barra de Busca (Condicional) */}
      {isSearchBarVisible && (
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          value={searchText}
          onChangeText={setSearchText}
          autoFocus={true} // Foca automaticamente ao abrir
        />
      )}

      {/* Lista de Produtos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isOutOfStock = item.stock <= 0;
          return (
            <TouchableOpacity
              style={[styles.card, isOutOfStock && styles.cardDisabled]}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item.id })
              }
              disabled={isOutOfStock} // Desabilita clique se fora de estoque
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
              {/* Botão de Favorito */}
              <Pressable
                onPress={() =>
                  isFavorite(item.id)
                    ? removeFavorite(item.id)
                    : addFavorite(item.id)
                }
                style={styles.favoriteButton}
              >
                <Ionicons
                  name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite(item.id) ? 'red' : 'grey'}
                />
              </Pressable>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>Nenhum produto encontrado.</Text>
        }
      />

      {/* Modal de Seleção de Categoria */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Selecione uma Categoria</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryModalItem}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text
                    style={
                      selectedCategory === item
                        ? styles.categoryModalItemSelected
                        : styles.categoryModalItemText
                    }
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <Button
              title="Fechar"
              onPress={() => setIsCategoryModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;