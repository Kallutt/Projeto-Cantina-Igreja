import React, { useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformFromFirestore } from '../../utils/firestoreHelpers';
import SplashScreen from '../../components/SplashScreen';
import styles from '../../styles/GlobalStyles';
// Nota: Os imports de 'react-native-svg-charts' foram removidos do seu código original
// porque não estavam sendo usados. Se você for adicionar gráficos,
// lembre-se de importá-los aqui (ex: BarChart, PieChart).

/**
 * Tela de "Estatísticas" (Admin).
 * Mostra dados de faturamento e produtos mais vendidos
 * com base APENAS nos pedidos concluídos.
 */
const AdminStatsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [orders, setOrders] = useState([]); // Armazena apenas pedidos concluídos
  const [loading, setLoading] = useState(true);

  // Adiciona o botão "Sair" no cabeçalho
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={logout} title="Sair" color="red" />,
    });
  }, [navigation, logout]);

  // Função para buscar os pedidos (apenas concluídos)
  const fetchCompletedOrders = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Busca TODOS os pedidos
      const response = await fetch(`${FIRESTORE_BASE_URL}/orders`);
      const data = await response.json();
      const allOrders =
        data.documents?.map(transformFromFirestore).filter((o) => o !== null) ||
        [];

      // 2. Filtra localmente APENAS os 'completed'
      setOrders(allOrders.filter((o) => o.status === 'completed'));
    } catch (error) {
      console.error('Erro ao buscar dados para estatísticas:', error);
      showSnackbar('Erro ao carregar dados.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Recarrega os dados sempre que a tela entra em foco
  useFocusEffect(fetchCompletedOrders);

  // Memoiza o cálculo do Faturamento Total
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  // Memoiza o cálculo dos produtos mais vendidos
  const bestSellingProducts = useMemo(() => {
    const productCounts = {}; // Mapa para contar a quantidade de cada produto
    orders.forEach((order) => {
      try {
        if (order.items && typeof order.items === 'string') {
          const items = JSON.parse(order.items);
          items.forEach((item) => {
            // Soma a quantidade (qty) de cada item
            productCounts[item.name] =
              (productCounts[item.name] || 0) + item.qty;
          });
        }
      } catch (e) {
        console.warn('Erro ao parsear itens do pedido para stats:', order.id, e);
      }
    });

    // Converte o mapa para um array [nome, contagem], ordena e pega o Top 5
    return Object.entries(productCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Ordena pela contagem (descendente)
      .slice(0, 5); // Pega os 5 primeiros
  }, [orders]);

  if (loading) return <SplashScreen />;

  return (
    <ScrollView style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Estatísticas (Pedidos Concluídos)</Text>

      {/* Card: Faturamento Total */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Faturamento Total</Text>
        <Text style={styles.statsValue}>R$ {totalRevenue.toFixed(2)}</Text>
      </View>

      {/* Card: Produtos Mais Vendidos */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Produtos Mais Vendidos (Top 5)</Text>
        {bestSellingProducts.length > 0 ? (
          bestSellingProducts.map(([name, count]) => (
            <Text key={name} style={styles.statsText}>
              - {name}: {count} unidades
            </Text>
          ))
        ) : (
          <Text style={styles.statsText}>Nenhum produto vendido ainda.</Text>
        )}
      </View>
      
      {/* Aqui é um ótimo lugar para adicionar os componentes 
        <BarChart /> ou <PieChart /> que você tinha importado,
        usando os dados de 'bestSellingProducts'.
      */}

    </ScrollView>
  );
};

export default AdminStatsScreen;