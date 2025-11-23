import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Histórico de Pedidos" do usuário.
 * Lista todos os pedidos feitos pelo usuário logado.
 */
const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Função para buscar os pedidos do usuário
  const fetchOrders = useCallback(async () => {
    if (!userData?.uid) return; // Não faz nada se o usuário não estiver carregado
    setLoading(true);
    try {
      // 1. Busca TODOS os pedidos
      // (Idealmente, o Firestore permite filtrar por 'userId' na query,
      // mas a API REST simples pode não suportar isso sem índices)
      const response = await fetch(`${FIRESTORE_BASE_URL}/orders`);
      const data = await response.json();
      const allOrders =
        data.documents?.map(transformFromFirestore).filter((o) => o !== null) ||
        [];

      // 2. Filtra os pedidos localmente para este usuário
      const userOrders = allOrders.filter(
        (order) => order.userId === userData.uid
      );

      // 3. Ordena do mais recente para o mais antigo
      userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(userOrders);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      showSnackbar('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [userData, showSnackbar]); // Dependências: userData e showSnackbar

  // Recarrega os pedidos sempre que a tela entra em foco
  useFocusEffect(fetchOrders);

  // Função auxiliar para traduzir o status
  const getStatusText = (status) => {
    if (status === 'completed') return 'Concluído';
    if (status === 'pending') return 'Pendente';
    return status;
  };

  if (loading) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Card do pedido
          <View
            style={[
              styles.orderCard,
              // Estilo condicional baseado no status
              item.status === 'completed'
                ? styles.orderCardCompleted
                : styles.orderCardPending,
            ]}
          >
            <Text style={styles.orderTitle}>
              Pedido #{item.id.substring(0, 6)}...
            </Text>
            <Text>
              Data:{' '}
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('pt-BR')
                : 'N/A'}
            </Text>
            <Text>
              Total: R$ {item.total ? item.total.toFixed(2) : '0.00'}
            </Text>
            <Text>Status: {getStatusText(item.status)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            Você ainda não fez nenhum pedido.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;