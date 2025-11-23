import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformToFirestore } from '../../utils/firestoreHelpers';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Finalizar Pedido" (Checkout).
 * Coleta nome e contato/mesa, e cria o pedido no Firestore.
 */
const CheckoutScreen = ({ navigation }) => {
  // Hooks de contexto
  const { cartItems, cartTotal, clearCart } = useCart();
  const { userData } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Estado do formulário
  const [customerName, setCustomerName] = useState(userData?.name || ''); // Puxa o nome do usuário logado
  const [contact, setContact] = useState(''); // Para mesa ou contato
  const [loading, setLoading] = useState(false);

  // Função para criar o pedido
  const handlePlaceOrder = async () => {
    if (!customerName || !contact) {
      showSnackbar('Preencha nome e contato/mesa.');
      return;
    }
    setLoading(true);
    let newOrderId = null;

    try {
      // 1. Cria o documento do pedido
      const orderData = {
        userId: userData.uid,
        customerName,
        contact,
        items: JSON.stringify(cartItems), // Armazena os itens como JSON string
        total: cartTotal,
        status: 'pending', // Status inicial
        createdAt: new Date(),
      };
      const firestorePayload = transformToFirestore(orderData);

      const response = await fetch(`${FIRESTORE_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload),
      });

      if (!response.ok) {
        throw new Error('Não foi possível criar o pedido.');
      }
      const createdOrder = await response.json();
      newOrderId = createdOrder.name.split('/').pop(); // Pega o ID do pedido criado

      // 2. Atualiza o estoque de cada produto (um por um)
      for (const item of cartItems) {
        const newStock = item.stock - item.qty;
        const stockUpdatePayload = transformToFirestore({ stock: newStock });
        // URL especial para PATCH que atualiza campos específicos
        const url = `${FIRESTORE_BASE_URL}/products/${item.id}?updateMask.fieldPaths=stock`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockUpdatePayload),
        });
      }

      // 3. Limpa o carrinho e navega para confirmação
      clearCart();
      navigation.navigate('OrderConfirmation', { orderId: newOrderId });
    } catch (error) {
      showSnackbar(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar Pedido</Text>
      <TextInput
        style={styles.input}
        placeholder="Seu Nome"
        value={customerName}
        onChangeText={setCustomerName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nº da Mesa ou Contato"
        value={contact}
        onChangeText={setContact}
      />
      {/* Resumo do Pedido */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total: R$ {cartTotal.toFixed(2)}
        </Text>
      </View>
      {/* Botão de Confirmação */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Confirmar Pedido" onPress={handlePlaceOrder} />
      )}
    </View>
  );
};

export default CheckoutScreen;