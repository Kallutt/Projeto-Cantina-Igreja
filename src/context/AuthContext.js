import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_SIGN_IN_URL,
  AUTH_SIGN_UP_URL, // Importa URL de cadastro
  FIRESTORE_BASE_URL,
} from '../utils/firebaseConfig';
import { transformFromFirestore } from '../utils/firestoreHelpers'; // Importa helper

// Adaptador de armazenamento, facilita a troca (ex: por SecureStore)
const StorageAdapter = AsyncStorage;

// Cria o contexto
const AuthContext = createContext();

/**
 * Provedor que gerencia o estado de autenticação (usuário logado, dados, loading)
 * e também os produtos favoritos do usuário.
 */
export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Efeito para carregar dados do usuário e favoritos do AsyncStorage ao iniciar
  useEffect(() => {
    const loadInitialData = async () => {
      const storedUser = await StorageAdapter.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          // Carrega favoritos específicos deste usuário
          const storedFavorites = await StorageAdapter.getItem(
            `favorites_${parsedUser.uid}`
          );
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } catch (e) {
          console.warn('Erro ao carregar dados iniciais', e);
          // Limpa dados corrompidos
          await StorageAdapter.multiRemove([
            'user',
            `favorites_${userData?.uid}`,
          ]);
        }
      }
      setLoading(false);
    };
    loadInitialData();
  }, []); // Array vazio garante que rode apenas uma vez

  // Efeito para salvar favoritos no AsyncStorage sempre que a lista mudar
  useEffect(() => {
    if (!loading && userData?.uid) {
      StorageAdapter.setItem(
        `favorites_${userData.uid}`,
        JSON.stringify(favorites)
      );
    }
  }, [favorites, loading, userData]);

  // Função de Login
  const login = async (email, password) => {
    // 1. Autenticar com Identity Toolkit
    const authResponse = await fetch(AUTH_SIGN_IN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      const errorMessage = errorData?.error?.message || 'Erro desconhecido.';
      // Traduz erros comuns da API
      if (
        errorMessage === 'EMAIL_NOT_FOUND' ||
        errorMessage === 'INVALID_PASSWORD' ||
        errorMessage === 'INVALID_LOGIN_CREDENTIALS'
      ) {
        throw new Error('E-mail ou senha inválidos.');
      }
      throw new Error('Erro ao tentar fazer login.');
    }
    const authData = await authResponse.json();
    const { localId: uid, idToken } = authData;

    // 2. Buscar dados do perfil no Firestore
    const userDocResponse = await fetch(`${FIRESTORE_BASE_URL}/users/${uid}`);
    if (!userDocResponse.ok) {
      throw new Error('Não foi possível encontrar os dados do perfil do usuário.');
    }
    const userDoc = await userDocResponse.json();
    const userProfile = transformFromFirestore(userDoc);

    // 3. Juntar dados e salvar no estado/storage
    const fullUserData = { uid, email, idToken, ...userProfile };
    setUserData(fullUserData);
    await StorageAdapter.setItem('user', JSON.stringify(fullUserData));

    // 4. Carregar favoritos deste usuário
    const storedFavorites = await StorageAdapter.getItem(`favorites_${uid}`);
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    else setFavorites([]);
  };

  // Função de Logout
  const logout = async () => {
    setUserData(null);
    setFavorites([]);
    await StorageAdapter.removeItem('user');
    // Idealmente, também deveria limpar o carrinho (ou não, dependendo da regra de negócio)
  };

  // Funções de gerenciamento de favoritos
  const addFavorite = (productId) =>
    setFavorites((prev) => [...new Set([...prev, productId])]); // 'Set' evita duplicatas
  const removeFavorite = (productId) =>
    setFavorites((prev) => prev.filter((id) => id !== productId));
  const isFavorite = (productId) => favorites.includes(productId);

  // Memoiza o valor do contexto
  const value = useMemo(
    () => ({
      userData,
      loading,
      login,
      logout,
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
    }),
    [userData, loading, favorites] // Recalcula apenas se estas dependências mudarem
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook customizado para facilitar o acesso ao contexto de autenticação.
 */
export const useAuth = () => useContext(AuthContext);