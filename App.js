import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { SnackbarProvider } from './src/context/SnackbarContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Componente raiz do aplicativo.
 * Ele envolve o navegador principal (AppNavigator) com todos os provedores
 * de contexto necessários para o funcionamento do app (Paper, Snackbar, Auth, Cart).
 */
export default function App() {
  return (
    // Provedor de componentes visuais do React Native Paper
    <PaperProvider>
      {/* Provedor para exibir notificações (snackbars) */}
      <SnackbarProvider>
        {/* Provedor para gerenciar o estado de autenticação do usuário */}
        <AuthProvider>
          {/* Provedor para gerenciar o estado do carrinho de compras */}
          <CartProvider>
            {/* Componente que controla toda a navegação do app */}
            <AppNavigator />
          </CartProvider>
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}