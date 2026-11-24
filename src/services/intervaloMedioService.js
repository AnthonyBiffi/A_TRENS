// Equivalente exato a IntervaloMedioService.java
export function calcularMinutos(tipoTransporte, linha) {
  if (!tipoTransporte || !linha) {
    return 0;
  }

  const tipo = tipoTransporte.trim();
  const linhaNormalizada = linha.trim();

  if (tipo.toLowerCase() === 'metrô') {
    if (linhaNormalizada.includes('Linha 15') || linhaNormalizada.includes('Linha 17')) {
      return 6;
    }
    if (linhaNormalizada.includes('Linha 4')) {
      return 3;
    }
    return 4;
  }

  if (tipo.toLowerCase() === 'trem') {
    if (linhaNormalizada.includes('Linha 13')) {
      return 15;
    }
    if (
      linhaNormalizada.includes('Linha 7') ||
      linhaNormalizada.includes('Linha 10') ||
      linhaNormalizada.includes('Linha 11')
    ) {
      return 8;
    }
    return 10;
  }

  return 0;
}

export function montarTextoEstimativa(tipoTransporte, linha) {
  const minutos = calcularMinutos(tipoTransporte, linha);
  if (minutos <= 0) {
    return 'Estimativa não disponível';
  }
  return `Aproximadamente ${minutos} minutos`;
}
