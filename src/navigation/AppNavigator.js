import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Hook de autenticação
import SplashScreen from '../components/SplashScreen'; // Tela de loading

// Importa os três navegadores principais
import { AdminNavigator, UserNavigator, AuthNavigator } from './Navigators';

/**
 * Componente principal de navegação.
 * Ele usa o `useAuth` para verificar o estado do usuário e decide
 * qual navegador (Stack) renderizar:
 * - Se estiver carregando (loading): Mostra SplashScreen.
 * - Se não houver usuário (userData): Mostra AuthNavigator (Login).
 * - Se houver usuário e for 'admin': Mostra AdminNavigator.
 * - Se houver usuário e não for 'admin': Mostra UserNavigator.
 */
const AppNavigator = () => {
  const { userData, loading } = useAuth();

  // Exibe o SplashScreen enquanto o AuthContext verifica o AsyncStorage
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userData ? ( // Se o usuário está logado...
        userData.role === 'admin' ? ( // É admin?
          <AdminNavigator />
        ) : (
          <UserNavigator /> // Senão, é usuário comum
        )
      ) : (
        <AuthNavigator /> // Se não está logado, mostra tela de Login
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;