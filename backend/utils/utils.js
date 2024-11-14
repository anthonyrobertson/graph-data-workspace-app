const fs = require('fs').promises;

// Factory function for creating classes
exports.createClass = function (dictionaryEntry, baseClass) {
    let abc = class AbstractBaseClass {
        constructor(data) {
            Object.setPrototypeOf(this, new baseClass(data));
            for (let p of dictionaryEntry.properties) { // Add props from the dictionary
                this[p.name] = data[p.name] !== undefined ? data[p.name] : p.default || null;
            }
        }
    };
    abc.definition = dictionaryEntry; // stash definition for static convenience
    return abc;
}

exports.getRandomString = function (length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

exports.loadJson = async function (filepath) {
    try {
      await fs.access(filepath);
      const graphData = await fs.readFile(filepath, 'utf8');
      return JSON.parse(graphData);
    } catch (error) {
      console.log(error)
      return false;
    }
}