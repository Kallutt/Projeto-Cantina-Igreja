import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore, transformToFirestore } // Importa ambos helpers
from '../../utils/firestoreHelpers';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Gerenciamento de Pedidos" (Admin).
 * Lista pedidos pendentes ou concluídos e permite marcá-los como concluídos ou excluí-los.
 */
const AdminOrdersScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Estado
  const [allOrders, setAllOrders] = useState([]); // Guarda todos os pedidos
  const [filteredOrders, setFilteredOrders] = useState([]); // Pedidos a exibir (filtrados)
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending'); // Filtro inicial
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [orderToDeleteId, setOrderToDeleteId] = useState(null);

  // Adiciona o botão "Sair" no cabeçalho
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={logout} title="Sair" color="red" />,
    });
  }, [navigation, logout]);

  // Função para buscar todos os pedidos
  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${FIRESTORE_BASE_URL}/orders`);
      const data = await response.json();
      // Transforma, filtra nulos e filtra pedidos que não têm data (provavelmente corrompidos)
      const orderList =
        data.documents
          ?.map(transformFromFirestore)
          .filter((o) => o !== null && o.createdAt) || [];
      // Ordena do mais recente para o mais antigo
      orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllOrders(orderList);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      showSnackbar('Erro ao carregar pedidos.');
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Recarrega os pedidos sempre que a tela entra em foco
  useFocusEffect(fetchAllOrders);

  // Efeito que filtra os pedidos a serem exibidos (filteredOrders)
  // sempre que a lista total (allOrders) ou o filtro (selectedStatus) mudar.
  useEffect(() => {
    setFilteredOrders(allOrders.filter((o) => o.status === selectedStatus));
  }, [allOrders, selectedStatus]);

  // Função para marcar um pedido como "concluído"
  const markAsCompleted = async (orderId) => {
    try {
      const statusUpdatePayload = transformToFirestore({ status: 'completed' });
      // URL de PATCH para atualizar apenas o campo 'status'
      const url = `${FIRESTORE_BASE_URL}/orders/${orderId}?updateMask.fieldPaths=status`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdatePayload),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o pedido.');
      }
      showSnackbar('Pedido marcado como concluído!');
      fetchAllOrders(); // Recarrega a lista
    } catch (error) {
      showSnackbar(error.message);
    }
  };

  // Prepara a exclusão (abre o modal)
  const handleDeleteOrder = (orderId) => {
    setOrderToDeleteId(orderId);
    setIsConfirmModalVisible(true);
  };

  // Confirma e executa a exclusão
  const confirmDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    try {
      const response = await fetch(
        `${FIRESTORE_BASE_URL}/orders/${orderToDeleteId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        let errorMsg = 'Falha ao excluir o pedido.';
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error?.message || errorMsg;
        } catch (e) {} // Ignora erro de parsing
        throw new Error(errorMsg);
      }
      showSnackbar('Pedido excluído!');
      fetchAllOrders(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      showSnackbar(error.message);
    } finally {
      setIsConfirmModalVisible(false);
      setOrderToDeleteId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtros de Status (Pendentes / Concluídos) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedStatus === 'pending' && styles.filterButtonSelected,
          ]}
          onPress={() => setSelectedStatus('pending')}
        >
          <Text
            style={[
              styles.filterText,
              selectedStatus === 'pending' && styles.filterTextSelected,
            ]}
          >
            Pendentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedStatus === 'completed' && styles.filterButtonSelected,
          ]}
          onPress={() => setSelectedStatus('completed')}
        >
          <Text
            style={[
              styles.filterText,
              selectedStatus === 'completed' && styles.filterTextSelected,
            ]}
          >
            Concluídos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Pedidos */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            // Card do Pedido
            <View
              style={[
                styles.orderCard,
                item.status === 'completed'
                  ? styles.orderCardCompleted
                  : styles.orderCardPending,
              ]}
            >
              <Text style={styles.orderTitle}>
                Pedido de: {item.customerName}
              </Text>
              <Text>Contato/Mesa: {item.contact}</Text>
              <Text>
                Data:{' '}
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </Text>
              <Text>
                Total: R$ {item.total ? item.total.toFixed(2) : '0.00'}
              </Text>
              {/* Lista de Itens do Pedido */}
              <View style={styles.orderItems}>
                <Text>Itens:</Text>
                {/* Verifica se 'items' é uma string JSON válida antes de dar 'parse' */}
                {item.items && typeof item.items === 'string' ? (
                  JSON.parse(item.items).map((prod) => (
                    <Text key={prod.id}>
                      - {prod.qty}x {prod.name}
                    </Text>
                  ))
                ) : (
                  <Text>- Erro ao carregar itens -</Text>
                )}
              </View>
              {/* Ações do Admin */}
              <View style={styles.orderActionsContainer}>
                {item.status === 'pending' && (
                  <Button
                    title="Marcar como Concluído"
                    onPress={() => markAsCompleted(item.id)}
                  />
                )}
                <Button
                  title="Excluir"
                  color="red"
                  onPress={() => handleDeleteOrder(item.id)}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              Nenhum pedido encontrado com status '{selectedStatus}'.
            </Text>
          }
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isConfirmModalVisible}
        onRequestClose={() => {
          setIsConfirmModalVisible(false);
          setOrderToDeleteId(null);
        }}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir este pedido permanentemente?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setIsConfirmModalVisible(false);
                  setOrderToDeleteId(null);
                }}
              />
              <Button
                title="Excluir"
                color="red"
                onPress={confirmDeleteOrder}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AdminOrdersScreen;