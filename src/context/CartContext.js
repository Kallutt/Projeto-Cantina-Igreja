import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSnackbar } from './SnackbarContext'; // Importa hook de snackbar
import SplashScreen from '../components/SplashScreen'; // Importa o componente

// Adaptador de armazenamento
const StorageAdapter = AsyncStorage;

// Cria o contexto
const CartContext = createContext();

/**
 * Provedor que gerencia o estado do carrinho de compras.
 * Armazena itens, calcula total e persiste no AsyncStorage.
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar(); // Hook para mostrar notificações

  // Efeito para carregar o carrinho do AsyncStorage ao iniciar
  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await StorageAdapter.getItem('cart');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          console.warn('Erro ao parsear cart armazenado', e);
          setCartItems([]);
          await StorageAdapter.removeItem('cart');
        }
      }
      setLoading(false);
    };
    loadCart();
  }, []);

  // Efeito para salvar o carrinho no AsyncStorage sempre que ele mudar
  useEffect(() => {
    if (!loading) {
      StorageAdapter.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, loading]);

  // Adiciona um item ao carrinho
  const addToCart = (product, navigation) => {
    const exist = cartItems.find((item) => item.id === product.id);
    const currentQtyInCart = exist ? exist.qty : 0;

    // Verifica o estoque
    if (currentQtyInCart + 1 > product.stock) {
      showSnackbar(
        `Estoque insuficiente para ${product.name}. Máx: ${product.stock}`
      );
      return;
    }

    setCartItems((prevItems) => {
      if (exist) {
        // Se já existe, incrementa a quantidade
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // Se não existe, adiciona o produto com qty: 1
      return [...prevItems, { ...product, qty: 1 }];
    });

    // Mostra notificação com ação para ver o carrinho
    showSnackbar(`${product.name} adicionado!`);
  };

  // Atualiza a quantidade de um item
  const updateQuantity = (productId, newQty) => {
    const itemToUpdate = cartItems.find((item) => item.id === productId);
    if (!itemToUpdate) return;

    // Verifica o estoque
    if (newQty > itemToUpdate.stock) {
      showSnackbar(`Estoque insuficiente. Máx: ${itemToUpdate.stock}`);
      return; // Não atualiza
    }

    if (newQty <= 0) {
      // Remove se a quantidade for 0 ou menor
      removeFromCart(productId);
    } else {
      // Atualiza a quantidade
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, qty: newQty } : item
        )
      );
    }
  };

  // Remove um item do carrinho
  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  // Limpa todo o carrinho
  const clearCart = () => setCartItems([]);

  // Calcula o total do carrinho, memoizado para performance
  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartItems]
  );

  // Valor do contexto
  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    clearCart,
  };

  // Mostra SplashScreen enquanto carrega o carrinho do storage
  if (loading) return <SplashScreen />;

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Hook customizado para facilitar o acesso ao contexto do carrinho.
 */
export const useCart = () => useContext(CartContext);