export interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
}

/**
 * Formata CEP: 12345678 -> 12345-678
 */
export function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Remove formatação do CEP: 12345-678 -> 12345678
 */
export function unformatCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Valida formato de CEP
 */
export function isValidCEP(cep: string): boolean {
  const digits = unformatCEP(cep);
  return digits.length === 8 && /^\d{8}$/.test(digits);
}

/**
 * Formata endereço completo
 */
export function formatAddress(data: Partial<AddressData>): string {
  const parts: string[] = [];
  
  if (data.street) {
    let streetPart = data.street;
    if (data.number) streetPart += `, ${data.number}`;
    parts.push(streetPart);
  }
  
  if (data.neighborhood) parts.push(data.neighborhood);
  if (data.city) parts.push(data.city);
  if (data.state) parts.push(data.state);
  
  return parts.filter(Boolean).join(', ');
}

/**
 * Valida se endereço tem todos os campos obrigatórios
 */
export function validateAddress(data: Partial<AddressData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!data.street) errors.push('Rua/Avenida é obrigatória');
  if (!data.number) errors.push('Número é obrigatório');
  if (!data.neighborhood) errors.push('Bairro é obrigatório');
  if (!data.city) errors.push('Cidade é obrigatória');
  if (!data.state) errors.push('Estado é obrigatório');
  if (!data.postal_code) errors.push('CEP é obrigatório');
  if (data.postal_code && !isValidCEP(data.postal_code)) {
    errors.push('CEP inválido');
  }
  if (!data.latitude || !data.longitude) {
    errors.push('Coordenadas não foram geocodificadas');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Verifica se coordenadas estão dentro do Brasil
 */
export function isInBrazil(lat: number, lon: number): boolean {
  // Limites aproximados do Brasil
  const minLat = -33.75;
  const maxLat = 5.27;
  const minLon = -73.98;
  const maxLon = -28.83;
  
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}
