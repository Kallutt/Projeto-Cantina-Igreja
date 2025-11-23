import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import { useSnackbar } from '../../context/SnackbarContext';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Confirmação de Pedido".
 * Exibida após o checkout, mostrando os detalhes do pedido recém-criado.
 */
const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  // Efeito para buscar os dados do pedido recém-criado
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${FIRESTORE_BASE_URL}/orders/${orderId}`);
        const data = await response.json();
        if (data && !data.error) {
          setOrder(transformFromFirestore(data));
        } else {
          throw new Error('Pedido não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        showSnackbar('Erro ao carregar detalhes do pedido.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
    else setLoading(false);
  }, [orderId, showSnackbar]);

  if (loading) return <SplashScreen />;

  if (!order) {
    return (
      <View style={styles.containerCenter}>
        <Text>Erro ao carregar pedido.</Text>
      </View>
    );
  }

  // Formata a data do pedido
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : 'Data indisponível';

  return (
    <View style={styles.containerCenter}>
      <Ionicons name="checkmark-circle-outline" size={80} color="green" />
      <Text style={styles.confirmationTitle}>Pedido Realizado com Sucesso!</Text>
      <Text style={styles.confirmationText}>Número do Pedido: {order.id}</Text>
      <Text style={styles.confirmationText}>Data: {orderDate}</Text>
      <Text style={styles.confirmationText}>
        Total: R$ {order.total ? order.total.toFixed(2) : '0.00'}
      </Text>
      <Button
        title="Voltar para Produtos"
        onPress={() => navigation.navigate('UserTabs')} // Volta para a tela Home (dentro das UserTabs)
      />
    </View>
  );
};

export default OrderConfirmationScreen;