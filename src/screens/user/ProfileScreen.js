import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/GlobalStyles';

/**
 * Tela de "Perfil" do usuário.
 * Exibe informações do usuário e o botão de Logout.
 */
const ProfileScreen = ({ navigation }) => {
  const { logout, userData } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>
      {/* Exibe dados do usuário se estiverem carregados */}
      {userData && (
        <>
          <Text style={styles.profileText}>Nome: {userData.name}</Text>
          <Text style={styles.profileText}>Email: {userData.email}</Text>
        </>
      )}
      {/* Botão de Logout */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Logout"
          onPress={logout} // Chama a função de logout do AuthContext
          color="red"
        />
      </View>
    </View>
  );
};

export default ProfileScreen;