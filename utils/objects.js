/**
 * 
 * @param {Object} obj 
 * @returns {Array<Array, Array>} returns an array of arrays
 *  the first array being the keys
 *  the second array being the values
 */
const objectTranspose = (obj) => {
  let keys = []
  let values = []
  Object.keys(obj).forEach((key) => {
    keys.push(key);
    values.push(obj[key]);
  })
  return [keys, values];
}
