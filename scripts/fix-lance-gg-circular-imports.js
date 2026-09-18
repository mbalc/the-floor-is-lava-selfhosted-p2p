const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const serializeDirs = [
    path.join(root, 'node_modules', 'lance-gg', 'src', 'serialize'),
    path.join(root, 'node_modules', 'lance-gg', 'es5', 'serialize')
];

function patchFile(fileName, replacements) {
    for (const serializeDir of serializeDirs) {
        const filePath = path.join(serializeDir, fileName);
        if (!fs.existsSync(filePath)) continue;

        let source = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        for (const { oldString, newString } of replacements) {
            if (source.includes(newString)) continue;
            if (!source.includes(oldString)) continue;
            source = source.replace(oldString, newString);
            changed = true;
        }

        if (changed) fs.writeFileSync(filePath, source);
    }
}

patchFile('Serializer.js', [
    {
        oldString: "import Utils from './../lib/Utils';\nimport TwoVector from './TwoVector';\nimport ThreeVector from './ThreeVector';\nimport Quaternion from './Quaternion';\n",
        newString: "import Utils from './../lib/Utils';\n\nfunction getRegisteredVectorTypes() {\n    return {\n        TwoVector: require('./TwoVector').default,\n        ThreeVector: require('./ThreeVector').default,\n        Quaternion: require('./Quaternion').default\n    };\n}\n"
    },
    {
        oldString: "        this.registeredClasses = {};\n        this.customTypes = {};\n        this.registerClass(TwoVector);\n        this.registerClass(ThreeVector);\n        this.registerClass(Quaternion);\n",
        newString: "        this.registeredClasses = {};\n        this.customTypes = {};\n\n        const { TwoVector, ThreeVector, Quaternion } = getRegisteredVectorTypes();\n        this.registerClass(TwoVector);\n        this.registerClass(ThreeVector);\n        this.registerClass(Quaternion);\n"
    },
    {
        oldString: "var _TwoVector = require('./TwoVector');\n\nvar _TwoVector2 = _interopRequireDefault(_TwoVector);\n\nvar _ThreeVector = require('./ThreeVector');\n\nvar _ThreeVector2 = _interopRequireDefault(_ThreeVector);\n\nvar _Quaternion = require('./Quaternion');\n\nvar _Quaternion2 = _interopRequireDefault(_Quaternion);\n",
        newString: "function getRegisteredVectorTypes() {\n    return {\n        TwoVector: require('./TwoVector').default,\n        ThreeVector: require('./ThreeVector').default,\n        Quaternion: require('./Quaternion').default\n    };\n}\n"
    },
    {
        oldString: "        this.registeredClasses = {};\n        this.customTypes = {};\n        this.registerClass(_TwoVector2.default);\n        this.registerClass(_ThreeVector2.default);\n        this.registerClass(_Quaternion2.default);\n",
        newString: "        this.registeredClasses = {};\n        this.customTypes = {};\n\n        var vectorTypes = getRegisteredVectorTypes();\n        this.registerClass(vectorTypes.TwoVector);\n        this.registerClass(vectorTypes.ThreeVector);\n        this.registerClass(vectorTypes.Quaternion);\n"
    }
]);

patchFile('TwoVector.js', [
    {
        oldString: "import Serializable from './Serializable';\nimport Serializer from './Serializer';\n",
        newString: "import Serializable from './Serializable';\n"
    },
    {
        oldString: "var _Serializer = require('./Serializer');\n\nvar _Serializer2 = _interopRequireDefault(_Serializer);\n",
        newString: ""
    },
    {
        oldString: "    static get netScheme() {\n        return {\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n",
        newString: "    static get netScheme() {\n        const Serializer = require('./Serializer').default;\n        return {\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n"
    }
]);

patchFile('ThreeVector.js', [
    {
        oldString: "import Serializable from './Serializable';\nimport Serializer from './Serializer';\n",
        newString: "import Serializable from './Serializable';\n"
    },
    {
        oldString: "var _Serializer = require('./Serializer');\n\nvar _Serializer2 = _interopRequireDefault(_Serializer);\n",
        newString: ""
    },
    {
        oldString: "    static get netScheme() {\n        return {\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 },\n            z: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n",
        newString: "    static get netScheme() {\n        const Serializer = require('./Serializer').default;\n        return {\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 },\n            z: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n"
    }
]);

patchFile('Quaternion.js', [
    {
        oldString: "import Serializable from './Serializable';\nimport Serializer from './Serializer';\nimport ThreeVector from './ThreeVector';\n",
        newString: "import Serializable from './Serializable';\nimport ThreeVector from './ThreeVector';\n"
    },
    {
        oldString: "var _Serializer = require('./Serializer');\n\nvar _Serializer2 = _interopRequireDefault(_Serializer);\n",
        newString: ""
    },
    {
        oldString: "    static get netScheme() {\n        return {\n            w: { type: Serializer.TYPES.FLOAT32 },\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 },\n            z: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n",
        newString: "    static get netScheme() {\n        const Serializer = require('./Serializer').default;\n        return {\n            w: { type: Serializer.TYPES.FLOAT32 },\n            x: { type: Serializer.TYPES.FLOAT32 },\n            y: { type: Serializer.TYPES.FLOAT32 },\n            z: { type: Serializer.TYPES.FLOAT32 }\n        };\n    }\n"
    }
]);

patchFile('PhysicalObject.js', [
    {
        oldString: "import GameObject from './GameObject';\nimport Serializer from './Serializer';\nimport ThreeVector from './ThreeVector';\nimport Quaternion from './Quaternion';\n",
        newString: "import GameObject from './GameObject';\nimport ThreeVector from './ThreeVector';\nimport Quaternion from './Quaternion';\n"
    },
    {
        oldString: "    static get netScheme() {\n        return Object.assign({\n            playerId: { type: Serializer.TYPES.INT16 },\n            position: { type: Serializer.TYPES.CLASSINSTANCE },\n            quaternion: { type: Serializer.TYPES.CLASSINSTANCE },\n            velocity: { type: Serializer.TYPES.CLASSINSTANCE },\n            angularVelocity: { type: Serializer.TYPES.CLASSINSTANCE }\n        }, super.netScheme);\n    }\n",
        newString: "    static get netScheme() {\n        const Serializer = require('./Serializer').default;\n        return Object.assign({\n            playerId: { type: Serializer.TYPES.INT16 },\n            position: { type: Serializer.TYPES.CLASSINSTANCE },\n            quaternion: { type: Serializer.TYPES.CLASSINSTANCE },\n            velocity: { type: Serializer.TYPES.CLASSINSTANCE },\n            angularVelocity: { type: Serializer.TYPES.CLASSINSTANCE }\n        }, super.netScheme);\n    }\n"
    }
]);

console.log('Patched lance-gg circular serializer imports.');
