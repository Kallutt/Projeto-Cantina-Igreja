import React, { useState, useLayoutEffect, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de Gerenciamento de Produtos (Admin).
 * Lista todos os produtos, permite Adicionar, Editar e Excluir.
 * Mostra alertas de estoque baixo.
 */
const AdminProductsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState(null);

  const LOW_STOCK_THRESHOLD = 5; // Limite para considerar estoque baixo

  // Adiciona o botão de "Sair" no cabeçalho
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={logout} title="Sair" color="red" />,
    });
  }, [navigation, logout]);

  // Função para buscar os produtos
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${FIRESTORE_BASE_URL}/products`);
      const data = await response.json();
      const productList =
        data.documents?.map(transformFromFirestore).filter((p) => p !== null) ||
        [];
      setProducts(productList);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      showSnackbar('Erro ao buscar produtos.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega os produtos sempre que a tela entra em foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation]);

  // Prepara a exclusão (abre o modal de confirmação)
  const handleDelete = (productId) => {
    setProductToDeleteId(productId);
    setIsConfirmModalVisible(true);
  };

  // Confirma e executa a exclusão do produto
  const confirmDeleteProduct = async () => {
    if (!productToDeleteId) return;
    try {
      const response = await fetch(
        `${FIRESTORE_BASE_URL}/products/${productToDeleteId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error('Falha ao excluir.');
      }
      showSnackbar('Produto excluído!');
      fetchProducts(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showSnackbar(error.message);
    } finally {
      setIsConfirmModalVisible(false);
      setProductToDeleteId(null);
    }
  };

  // Renderiza cada item da lista de produtos do admin
  const renderProductItem = ({ item }) => {
    const isLowStock = item.stock < LOW_STOCK_THRESHOLD;
    return (
      <View style={[styles.adminListItem, isLowStock && styles.lowStockItem]}>
        {/* Informações do Produto */}
        <View style={styles.adminItemInfo}>
          <Text style={isLowStock ? styles.lowStockText : null}>
            {item.name || 'Produto sem nome'}
          </Text>
          <Text style={isLowStock ? styles.lowStockText : styles.stockText}>
            Estoque: {item.stock}
          </Text>
          {isLowStock && (
            <Ionicons name="warning-outline" size={16} color="orange" />
          )}
        </View>
        {/* Ações (Editar/Excluir) */}
        <View style={styles.adminActions}>
          <Button
            title="Editar"
            onPress={() => navigation.navigate('ProductForm', { product: item })}
          />
          <Button
            title="Excluir"
            color="red"
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </View>
    );
  };

  // Memoiza a lista de produtos com estoque baixo para o alerta
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock < LOW_STOCK_THRESHOLD),
    [products]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal de Confirmação de Exclusão */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isConfirmModalVisible}
        onRequestClose={() => {
          setIsConfirmModalVisible(false);
          setProductToDeleteId(null);
        }}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir este produto permanentemente?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setIsConfirmModalVisible(false);
                  setProductToDeleteId(null);
                }}
              />
              <Button
                title="Excluir"
                color="red"
                onPress={confirmDeleteProduct}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Alerta de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <View style={styles.lowStockWarning}>
          <Ionicons name="warning" size={20} color="orange" />
          <Text style={styles.lowStockWarningText}>
            {' '}
            Atenção: {lowStockProducts.length} produto(s) com estoque baixo!{' '}
          </Text>
        </View>
      )}

      {/* Botão de Adicionar Novo Produto */}
      <Button
        title="Adicionar Novo Produto"
        onPress={() => navigation.navigate('ProductForm')} // Navega para o formulário vazio
      />

      {/* Lista de Produtos */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              Nenhum produto cadastrado.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AdminProductsScreen;