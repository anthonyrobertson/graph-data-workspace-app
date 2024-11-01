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