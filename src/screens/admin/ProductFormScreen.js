import React, { useState, useLayoutEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { FIRESTORE_BASE_URL } from '../../utils/firebaseConfig';
import { transformToFirestore } from '../../utils/firestoreHelpers';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Formulário de Produto" (Admin).
 * Usada tanto para CRIAR um novo produto quanto para EDITAR um existente.
 */
const ProductFormScreen = ({ route, navigation }) => {
  const { logout } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Verifica se estamos editando um produto (passado via params)
  const productToEdit = route.params?.product;
  const isEditing = !!productToEdit;

  // Estado do formulário
  // Inicializa com os dados do 'productToEdit' se estiver editando, senão com strings vazias
  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(
    productToEdit?.description || ''
  );
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [stock, setStock] = useState(productToEdit?.stock?.toString() || '');
  const [imageUrl, setImageUrl] = useState(productToEdit?.images?.[0] || '');
  const [category, setCategory] = useState(productToEdit?.category || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Adiciona o botão de "Sair" no cabeçalho
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={logout} title="Sair" color="red" />,
    });
  }, [navigation, logout]);

  // Função chamada ao salvar (criar ou editar)
  const handleSubmit = async () => {
    setError('');
    // Validação simples
    if (!name || !price || !stock || !imageUrl || !category) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);

    // Monta o objeto de dados do produto
    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      images: [imageUrl], // Salva a imagem como um array
      category,
      createdAt: new Date(), // Adiciona data de criação/atualização
    };

    // Transforma para o formato do Firestore
    const firestorePayload = transformToFirestore(productData);

    // Define a URL e o Método (POST para criar, PATCH para editar)
    const url = isEditing
      ? // URL de PATCH: precisa dos 'updateMask.fieldPaths' para dizer quais campos atualizar
        `${FIRESTORE_BASE_URL}/products/${
          productToEdit.id
        }?updateMask.fieldPaths=${Object.keys(productData).join(
          '&updateMask.fieldPaths='
        )}`
      : // URL de POST: cria um novo documento
        `${FIRESTORE_BASE_URL}/products`;

    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload),
      });

      if (!response.ok) {
        // Tenta extrair uma mensagem de erro da API
        const errorText = await response.text();
        console.error('Erro bruto da API Firestore:', errorText);
        let errorMessage = 'Falha ao salvar.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson?.error?.message || 'Verifique os logs.';
        } catch (e) {
          errorMessage = 'A API retornou um erro inesperado.';
        }
        throw new Error(errorMessage);
      }

      showSnackbar(`Produto ${isEditing ? 'atualizado' : 'criado'}!`);
      navigation.goBack(); // Volta para a tela anterior (AdminProductsScreen)
    } catch (err) {
      showSnackbar(`Erro: ${err.message}`);
      console.error('Erro ao salvar produto:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Editar Produto' : 'Novo Produto'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Produto"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError('');
        }}
      />
      <TextInput
        style={styles.input}
        multiline
        placeholder="Descrição"
        value={description}
        onChangeText={(t) => {
          setDescription(t);
          setError('');
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Preço (ex: 5.50)"
        value={price}
        onChangeText={(t) => {
          setPrice(t);
          setError('');
        }}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Estoque"
        value={stock}
        onChangeText={(t) => {
          setStock(t);
          setError('');
        }}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="URL da Imagem"
        value={imageUrl}
        onChangeText={(t) => {
          setImageUrl(t);
          setError('');
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Categoria (ex: Salgado, Doce)"
        value={category}
        onChangeText={(t) => {
          setCategory(t);
          setError('');
        }}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button
          title={isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          onPress={handleSubmit}
        />
      )}
    </ScrollView>
  );
};

export default ProductFormScreen;