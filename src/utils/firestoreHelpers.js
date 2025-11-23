/**
 * Transforma um objeto JavaScript (JS) em um formato de documento
 * que a API REST do Firestore entende (estrutura 'fields').
 * @param {object} data - O objeto JS a ser transformado.
 * @returns {object} - Objeto formatado para o Firestore.
 */
export const transformToFirestore = (data) => {
  const fields = {};
  for (const key in data) {
    const value = data[key];

    // Tratamento especial para o campo 'items' se for uma string (JSON stringificado)
    if (key === 'items' && typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number' && Number.isInteger(value)) {
      fields[key] = { integerValue: value.toString() }; // Firestore API REST espera inteiros como string
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      // Converte arrays de JS para o formato de arrayValue do Firestore
      fields[key] = {
        arrayValue: { values: value.map((v) => ({ stringValue: v })) },
      };
    }
    // Outros tipos (boolean, null, object) podem ser adicionados se necessário
  }
  return { fields };
};

/**
 * Transforma um documento recebido da API REST do Firestore
 * em um objeto JavaScript (JS) limpo.
 * @param {object} doc - O documento do Firestore (com 'name' e 'fields').
 * @returns {object|null} - Objeto JS limpo com 'id' ou null se inválido.
 */
export const transformFromFirestore = (doc) => {
  if (!doc || !doc.name || !doc.fields) return null;

  // Extrai o ID do documento da sua URL (campo 'name')
  const data = { id: doc.name.split('/').pop() };

  // Itera sobre os 'fields' e extrai o valor de cada tipo
  for (const key in doc.fields) {
    const valueObject = doc.fields[key];
    const type = Object.keys(valueObject)[0]; // Pega o tipo (ex: 'stringValue', 'arrayValue')

    if (type === 'arrayValue') {
      // Converte 'arrayValue' de volta para um array de strings
      data[key] = valueObject[type].values?.map((v) => v.stringValue) || [];
    } else if (type === 'timestampValue') {
      // Mantém o timestamp como string ISO (ou converte para Date, se preferir)
      data[key] = valueObject[type];
    } else {
      // Para 'stringValue', 'integerValue', 'doubleValue', etc.
      data[key] = valueObject[type];
    }
  }

  // Conversões de tipo explícitas pós-transformação para garantir
  if (data.stock !== undefined) data.stock = parseInt(data.stock, 10) || 0;
  if (data.price !== undefined) data.price = parseFloat(data.price) || 0.0;
  if (data.total !== undefined) data.total = parseFloat(data.total) || 0.0;

  return data;
};