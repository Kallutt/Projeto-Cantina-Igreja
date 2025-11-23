/**
 * Constantes de configuração para integração com o Firebase.
 * Inclui IDs de projeto, chaves de API e URLs de endpoints.
 */

// =================================================================
// CONFIGURAÇÃO DO FIREBASE
// =================================================================
export const FIREBASE_PROJECT_ID = 'appigreja-23c34';
export const FIREBASE_WEB_API_KEY = 'AIzaSyDkX2PqLwNcJm5rTv18d9-2GBfUU-KAjH'; //API usada para exemplo, não tem utilidade

// Endpoint da API do Firestore para operações de documentos (CRUD)
export const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Endpoints da API de Autenticação do Firebase Identity Toolkit
export const AUTH_SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;
export const AUTH_SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`;

export const AUTH_RESET_PASSWORD_URL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`;  
