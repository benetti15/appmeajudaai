/**
 * Valida um CPF brasileiro usando o algoritmo oficial
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido, false caso contrário
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Valida o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const firstDigit = remainder >= 10 ? 0 : remainder;
  
  if (firstDigit !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }
  
  // Valida o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const secondDigit = remainder >= 10 ? 0 : remainder;
  
  if (secondDigit !== parseInt(cleanCPF.charAt(10))) {
    return false;
  }
  
  return true;
};

/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, (_, first, second, third, fourth) => {
      let formatted = first;
      if (second) formatted += `.${second}`;
      if (third) formatted += `.${third}`;
      if (fourth) formatted += `-${fourth}`;
      return formatted;
    });
  }
  return value;
};
