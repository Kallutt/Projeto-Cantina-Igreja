import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  AUTH_SIGN_UP_URL,
  AUTH_RESET_PASSWORD_URL,
  FIRESTORE_BASE_URL,
} from '../../utils/firebaseConfig';
import { transformToFirestore } from '../../utils/firestoreHelpers';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de Login, Registro e Recuperação de Senha.
 * Gerencia três modos (login, register, forgot).
 */
const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Estado do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Usado apenas no registro

  // Estado de controle da UI
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Função para tentar fazer o login
  const handleLogin = async () => {
    setError('');
    if (!email || !password) return setError('Preencha e-mail e senha.');
    setLoading(true);
    try {
      await login(email, password);
      // Se o login for bem-sucedido, o AppNavigator fará a transição automática
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar uma nova conta
  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password)
      return setError('Preencha nome, e-mail e senha.');
    setLoading(true);
    try {
      // 1. Criar o usuário no Firebase Auth
      const authResponse = await fetch(AUTH_SIGN_UP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        const errorMessage = errorData?.error?.message || 'Erro desconhecido.';
        if (errorMessage === 'EMAIL_EXISTS')
          throw new Error('Este e-mail já está em uso.');
        throw new Error('Não foi possível criar a conta.');
      }

      const authData = await authResponse.json();
      const { localId: uid } = authData;

      // 2. Salvar dados adicionais (nome, role) no Firestore
      const userProfile = { name, email, role: 'user' }; // 'role' padrão
      const firestorePayload = transformToFirestore(userProfile);

      const profileResponse = await fetch(`${FIRESTORE_BASE_URL}/users/${uid}`, {
        method: 'PATCH', // Usar PATCH (ou PUT) para criar/atualizar o documento do usuário
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload),
      });

      if (!profileResponse.ok) {
        throw new Error('Não foi possível salvar o perfil do usuário.');
      }

      showSnackbar('Conta criada com sucesso! Você já pode fazer o login.');
      setIsRegistering(false); // Volta para o modo de login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para redefinir a senha
  const handlePasswordReset = async () => {
    setError('');
    if (!email) return setError('Por favor, insira seu e-mail.');
    setLoading(true);
    try {
      const response = await fetch(AUTH_RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || 'Erro desconhecido.';
        if (errorMessage === 'EMAIL_NOT_FOUND')
          throw new Error('E-mail não cadastrado.');
        throw new Error('Não foi possível enviar o e-mail de redefinição.');
      }

      showSnackbar('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setIsForgotPassword(false); // Volta para o modo de login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Alterna entre os modos da tela (login, register, forgot)
  const toggleMode = (mode) => {
    setError('');
    if (mode === 'register') {
      setIsRegistering(true);
      setIsForgotPassword(false);
    } else if (mode === 'login') {
      setIsRegistering(false);
      setIsForgotPassword(false);
    } else if (mode === 'forgot') {
      setIsRegistering(false);
      setIsForgotPassword(true);
    }
  };

  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={styles.title}>Cantina da Igreja</Text>

      {/* MODO: ESQUECI MINHA SENHA */}
      {isForgotPassword ? (
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Recuperar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Button title="Enviar E-mail" onPress={handlePasswordReset} />
          )}
          <TouchableOpacity onPress={() => toggleMode('login')}>
            <Text style={styles.switchText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* MODO: LOGIN ou REGISTRO */
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Criar Nova Conta' : 'Login'}
          </Text>
          {isRegistering && (
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Button
              title={isRegistering ? 'Cadastrar' : 'Entrar'}
              onPress={isRegistering ? handleRegister : handleLogin}
            />
          )}
          <TouchableOpacity
            onPress={() => toggleMode(isRegistering ? 'login' : 'register')}
          >
            <Text style={styles.switchText}>
              {isRegistering
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
          {!isRegistering && (
            <TouchableOpacity onPress={() => toggleMode('forgot')}>
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default LoginScreen;