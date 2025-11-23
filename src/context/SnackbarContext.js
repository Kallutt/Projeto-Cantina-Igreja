import React, { useState, createContext, useContext, useMemo } from 'react';
import { Snackbar } from 'react-native-paper';
import styles from '../styles/GlobalStyles'; // Importa os estilos

// Cria o contexto
const SnackbarContext = createContext({
  showSnackbar: (message, action) => {}, // Função de placeholder
});

/**
 * Provedor que gerencia o estado e a exibição de Snackbars (notificações).
 * Ele envolve os componentes filhos e fornece a função `showSnackbar`.
 */
export const SnackbarProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState(null);

  // Função para mostrar um snackbar
  const showSnackbar = (msg, act = null) => {
    setMessage(msg);
    setAction(act);
    setVisible(true);
  };

  // Função para esconder o snackbar
  const onDismissSnackBar = () => {
    setVisible(false);
    setMessage('');
    setAction(null);
  };

  // Memoiza o valor do contexto para evitar re-renderizações desnecessárias
  const value = useMemo(() => ({ showSnackbar }), []);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {/* O componente Snackbar do React Native Paper que será exibido */}
      <Snackbar
        visible={visible}
        onDismiss={onDismissSnackBar}
        duration={Snackbar.DURATION_SHORT}
        style={styles.snackbar} // Usa o estilo global
        action={
          action
            ? {
                label: action.label,
                onPress: () => {
                  if (action.onPress) action.onPress();
                  onDismissSnackBar();
                },
              }
            : undefined
        }
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

/**
 * Hook customizado para facilitar o acesso à função `showSnackbar`
 * de qualquer componente dentro do `SnackbarProvider`.
 */
export const useSnackbar = () => useContext(SnackbarContext);