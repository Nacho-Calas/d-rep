export async function compareObjects(oldObject, newObject) {
    const result = {};

    // Iterar sobre las claves de NewObject para detectar campos agregados
    for (const key in newObject) {
        if (typeof newObject[key] === 'object' && newObject[key] !== null) {
            result[key] = { data: await compareObjects(null, newObject[key]), change: 'new' };
        } else {
            result[key] = { data: newObject[key], change: 'new' };
        }
    }

    // Si OldObject está presente, realizar comparaciones
    if (oldObject) {
        // Iterar sobre las claves de OldObject
        for (const key in oldObject) {
            const oldValue = oldObject[key];
            const newValue = newObject[key];

            if (oldValue === undefined && newValue !== undefined) {
                // Si la clave no está en OldObject, se considera agregada
                result[key] = { data: newValue, change: 'new' };
            } else if (newValue === undefined && oldValue !== undefined) {
                // Si la clave no está en NewObject, se considera eliminada
                result[key] = { data: oldValue, change: 'delete' };
            } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
                // Si ambos valores son objetos, llamamos a la función recursivamente
                result[key] = { data: await compareObjects(oldValue, newValue), change: 'unchanged' };
            } else {
                // Comparamos los valores directamente
                result[key] = {
                    data: newValue,
                    change: oldValue === newValue ? 'unchanged' : 'modified',
                };
            }
        }
    }

    return result;
}
