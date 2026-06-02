function somar(numero1, numero2) {
  if (typeof numero1 !== "number" || typeof numero2 !== "number") {
    throw new Error("Os parâmetros devem ser números");
  }
  return numero1 + numero2;
}

exports.somar = somar;
