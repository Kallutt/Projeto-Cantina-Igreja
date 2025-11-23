import React, { useMemo } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext'; // Hook do carrinho

// Telas de Autenticação
import LoginScreen from '../screens/auth/LoginScreen';

// Telas de Usuário
import HomeScreen from '../screens/user/HomeScreen';
import FavoritesScreen from '../screens/user/FavoritesScreen';
import CartScreen from '../screens/user/CartScreen';
import OrderHistoryScreen from '../screens/user/OrderHistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import ProductDetailScreen from '../screens/user/ProductDetailScreen';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import OrderConfirmationScreen from '../screens/user/OrderConfirmationScreen';

// Telas de Admin
import AdminStatsScreen from '../screens/admin/AdminStatsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import ProductFormScreen from '../screens/admin/ProductFormScreen';

// Cria os construtores de navegador
const Stack = createStackNavigator();
const UserTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

/**
 * Navegador de abas (Tabs) para o usuário comum.
 * Inclui: Produtos, Favoritos, Carrinho, Histórico e Perfil.
 */
const UserTabs = () => {
  const { cartItems } = useCart();

  // Calcula o total de itens no carrinho (para o badge)
  const totalItemsInCart = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.qty, 0);
  }, [cartItems]);

  return (
    <UserTab.Navigator
      screenOptions={({ route }) => ({
        // Define o ícone de cada aba
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home')
            iconName = focused ? 'fast-food' : 'fast-food-outline';
          else if (route.name === 'Favorites')
            iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Cart')
            iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'History')
            iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile')
            iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <UserTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, title: 'Produtos' }}
      />
      <UserTab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favoritos' }}
      />
      <UserTab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Carrinho',
          // Badge (bolinha) com o número de itens
          tabBarBadge: totalItemsInCart > 0 ? totalItemsInCart : null,
          tabBarBadgeStyle: { backgroundColor: 'red', color: 'white' },
        }}
      />
      <UserTab.Screen
        name="History"
        component={OrderHistoryScreen}
        options={{ title: 'Histórico' }}
      />
      <UserTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </UserTab.Navigator>
  );
};

/**
 * Navegador de pilha (Stack) para o usuário comum.
 * Contém as abas (UserTabs) e as telas de detalhes acessadas a partir delas.
 */
export const UserNavigator = () => (
  <Stack.Navigator>
    {/* A tela principal é o conjunto de abas */}
    <Stack.Screen
      name="UserTabs"
      component={UserTabs}
      options={{ headerShown: false }}
    />
    {/* Telas acessadas a partir das abas */}
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Detalhes do Produto' }}
    />
    <Stack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ title: 'Finalizar Pedido' }}
    />
    <Stack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{
        title: 'Pedido Confirmado',
        headerLeft: null, // Remove o botão "voltar"
        gestureEnabled: false, // Desabilita o gesto de "voltar"
      }}
    />
  </Stack.Navigator>
);

/**
 * Navegador de abas (Tabs) para o administrador.
 * Inclui: Estatísticas, Produtos e Pedidos.
 */
const AdminTabs = () => (
  <AdminTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'AdminStats')
          iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'AdminProducts')
          iconName = focused ? 'list-circle' : 'list-circle-outline';
        else if (route.name === 'AdminOrders')
          iconName = focused ? 'reader' : 'reader-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007bff',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <AdminTab.Screen
      name="AdminStats"
      component={AdminStatsScreen}
      options={{ title: 'Estatísticas' }}
    />
    <AdminTab.Screen
      name="AdminProducts"
      component={AdminProductsScreen}
      options={{ title: 'Produtos' }}
    />
    <AdminTab.Screen
      name="AdminOrders"
      component={AdminOrdersScreen}
      options={{ title: 'Pedidos' }}
    />
  </AdminTab.Navigator>
);

/**
 * Navegador de pilha (Stack) para o administrador.
 * Contém as abas (AdminTabs) e as telas de formulário.
 */
export const AdminNavigator = () => (
  <Stack.Navigator>
    {/* A tela principal é o conjunto de abas de admin */}
    <Stack.Screen
      name="AdminTabs"
      component={AdminTabs}
      options={{ headerShown: false }}
    />
    {/* Tela de formulário (Adicionar/Editar Produto) */}
    <Stack.Screen
      name="ProductForm"
      component={ProductFormScreen}
      options={{ title: 'Formulário de Produto' }}
    />
  </Stack.Navigator>
);

/**
 * Navegador de autenticação (para usuários não logados).
 * Contém apenas a tela de Login (que também tem o modo de Registro).
 */
export const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);