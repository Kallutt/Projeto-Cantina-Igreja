import React from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import styles from '../../styles/GlobalStyles';

/**
 * Tela do Carrinho de Compras.
 * Exibe os itens adicionados, permite alterar quantidade, remover
 * e ir para o Checkout.
 */
const CartScreen = ({ navigation }) => {
  // Obtém dados e funções do contexto do carrinho
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  return (
    <SafeAreaView style={styles.container}>
      {/* Lista de itens no carrinho */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.images?.[0] }}
              style={styles.cartItemImage}
            />
            <View style={styles.cartItemInfo}>
              <Text>{item.name}</Text>
              <Text>R$ {item.price.toFixed(2)}</Text>
              {/* Controle de Quantidade */}
              <View style={styles.quantityControl}>
                <Button
                  title="-"
                  onPress={() => updateQuantity(item.id, item.qty - 1)}
                />
                <Text style={styles.quantityText}>{item.qty}</Text>
                <Button
                  title="+"
                  onPress={() => updateQuantity(item.id, item.qty + 1)}
                />
              </View>
            </View>
            {/* Botão de Remover */}
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Text style={{ color: 'red' }}>Remover</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>Seu carrinho está vazio.</Text>
        }
      />

      {/* Rodapé com o Total e Botão de Finalizar */}
      <View style={styles.cartTotalContainer}>
        <Text style={styles.cartTotalText}>
          Total: R$ {cartTotal.toFixed(2)}
        </Text>
        <Button
          title="Finalizar Pedido"
          onPress={() => navigation.navigate('Checkout')}
          disabled={cartItems.length === 0} // Desabilita se o carrinho estiver vazio
        />
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;