// Base classes for Node and Edge
class BaseNode {
    constructor(data) {
        // remember: uuid, type, name and attributes are all stored statically under self::definition
        this.attributes = data.attributes || {};
        this.metadata = {
            created: data.created || Date.now(),
            updated: data.updated || Date.now(),
            author: data.author || 'unknown',
        };
        // console.log('creating', static::definition)
    }

    updateAttributes(newAttributes) {
        this.attributes = { ...this.attributes, ...newAttributes };
        this.metadata.updated = Date.now();
    }
}

class BaseEdge {
    constructor(data) {
        this.type = data.type;
        this.attributes = data.attributes || {};
        this.timeWindows = data.timeWindows || [];
        this.metadata = {
            created: data.created || Date.now(),
            updated: data.updated || Date.now(),
            author: data.author || 'unknown',
        };
    }

    updateAttributes(newAttributes) {
        this.attributes = { ...this.attributes, ...newAttributes };
        this.metadata.updated = Date.now();
    }

    addTimeWindow(timeWindow) {
        this.timeWindows.push(timeWindow);
        this.metadata.updated = Date.now();
    }
}

exports = {BaseNode, BaseEdge}