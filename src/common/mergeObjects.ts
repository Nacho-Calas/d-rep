export function mergeObjects(target, source) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (Array.isArray(source[key])) {
        // Si el valor es un array, maneja de manera especial
        target[key] = Array.isArray(target[key]) ? target[key] : [];
        mergeObjects(target[key], source[key]);
      } else if (typeof source[key] === "object" && source[key] !== null) {
        // Si el valor es un objeto, combina recursivamente
        target[key] = typeof target[key] === "object" && target[key] !== null ? target[key] : {};
        mergeObjects(target[key], source[key]);
      } else {
        // Si el valor es un tipo de dato, cópialo
        target[key] = source[key];
      }
    }
  }
}