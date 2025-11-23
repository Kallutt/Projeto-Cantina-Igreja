import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import styles from '../styles/GlobalStyles'; // Importa estilos

/**
 * Tela de "Carregando" (Splash Screen).
 * Exibida enquanto dados iniciais (usuário, carrinho) são carregados.
 */
const SplashScreen = () => (
  <View style={styles.containerCenter}>
    <ActivityIndicator size="large" color="#007bff" />
    <Text>Carregando...</Text>
  </View>
);

export default SplashScreen;