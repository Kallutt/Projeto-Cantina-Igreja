import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  Button,
  Pressable,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

/**
 * Tela de "Detalhes do Produto".
 * Exibe informações completas de um produto específico.
 */
const ProductDetailScreen = ({ route, navigation }) => {
  // Obtém o ID do produto dos parâmetros da rota
  const { productId } = route.params;
  const [product, setProduct] = useState(null);

  // Hooks de contexto
  const { addToCart } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Efeito para buscar os dados do produto no Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${FIRESTORE_BASE_URL}/products/${productId}`
        );
        const doc = await response.json();
        if (doc && !doc.error) {
          setProduct(transformFromFirestore(doc));
        } else {
          showSnackbar('Produto não encontrado.');
        }
      } catch (e) {
        console.error(e);
        showSnackbar('Erro ao buscar produto.');
      }
    };
    fetchProduct();
  }, [productId, showSnackbar]); // Dependências: productId e showSnackbar

  // Exibe "Carregando" enquanto o produto não for carregado
  if (!product) return <SplashScreen />;

  const isOutOfStock = product.stock <= 0;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
        style={styles.detailImage}
      />
      <View style={styles.detailContent}>
        {/* Cabeçalho com Título e Botão de Favorito */}
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{product.name}</Text>
          <Pressable
            onPress={() =>
              isFavorite(product.id)
                ? removeFavorite(product.id)
                : addFavorite(product.id)
            }
          >
            <Ionicons
              name={isFavorite(product.id) ? 'heart' : 'heart-outline'}
              size={30}
              color={isFavorite(product.id) ? 'red' : 'grey'}
            />
          </Pressable>
        </View>

        {/* Preço e Descrição */}
        <Text style={styles.detailPrice}>
          R$ {product.price ? product.price.toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.detailDescription}>{product.description}</Text>

        {/* Botão de Adicionar ao Carrinho ou Texto de Indisponível */}
        {isOutOfStock ? (
          <Text style={styles.outOfStockText}>PRODUTO INDISPONÍVEL</Text>
        ) : (
          <Button
            title="Adicionar ao Carrinho"
            onPress={() => addToCart(product, navigation)}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default ProductDetailScreen;