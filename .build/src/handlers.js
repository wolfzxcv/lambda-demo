"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUser = exports.deleteUser = exports.updateUser = exports.getUser = exports.createUser = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const uuid_1 = require("uuid");
const yup = __importStar(require("yup"));
const dbClient = new client_dynamodb_1.DynamoDBClient({ region: 'ap-northeast-1' });
const tableName = 'UsersTable';
const headers = {
    'content-type': 'application/json'
};
const schema = yup.object().shape({
    name: yup.string().required(),
    occupation: yup.string().required(),
    age: yup.number().required(),
    isActive: yup.bool().required()
});
class HttpError extends Error {
    constructor(statusCode, body = {}) {
        super(JSON.stringify(body));
        this.statusCode = statusCode;
    }
}
const handleError = (e) => {
    if (e instanceof yup.ValidationError) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                errors: e.errors
            })
        };
    }
    if (e instanceof SyntaxError) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: `Invalid request body format : "${e.message}"`
            })
        };
    }
    if (e instanceof HttpError) {
        return {
            statusCode: e.statusCode,
            headers,
            body: e.message
        };
    }
    throw e;
};
const createUser = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reqBody = JSON.parse(event.body);
        yield schema.validate(reqBody, { abortEarly: false });
        const user = Object.assign(Object.assign({}, reqBody), { userID: (0, uuid_1.v4)() });
        const putCommand = new client_dynamodb_1.PutItemCommand({
            TableName: tableName,
            Item: (0, util_dynamodb_1.marshall)(user)
        });
        yield dbClient.send(putCommand);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(user)
        };
    }
    catch (e) {
        return handleError(e);
    }
});
exports.createUser = createUser;
const fetchUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const getCommand = new client_dynamodb_1.GetItemCommand({
        TableName: tableName,
        Key: (0, util_dynamodb_1.marshall)({
            userID: id
        })
    });
    const { Item } = yield dbClient.send(getCommand);
    if (!Item) {
        throw new HttpError(404, { error: 'not found' });
    }
    return Item;
});
const getUser = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield fetchUserById(id);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify((0, util_dynamodb_1.unmarshall)(user))
        };
    }
    catch (e) {
        return handleError(e);
    }
});
exports.getUser = getUser;
const updateUser = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const id = (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.id;
        yield fetchUserById(id);
        const reqBody = JSON.parse(event.body);
        yield schema.validate(reqBody, { abortEarly: false });
        const user = Object.assign(Object.assign({}, reqBody), { userID: id });
        const putCommand = new client_dynamodb_1.PutItemCommand({
            TableName: tableName,
            Item: (0, util_dynamodb_1.marshall)(user)
        });
        yield dbClient.send(putCommand);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(user)
        };
    }
    catch (e) {
        return handleError(e);
    }
});
exports.updateUser = updateUser;
const deleteUser = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const id = (_c = event.pathParameters) === null || _c === void 0 ? void 0 : _c.id;
        yield fetchUserById(id);
        const deleteCommand = new client_dynamodb_1.DeleteItemCommand({
            TableName: tableName,
            Key: {
                userID: id
            }
        });
        yield dbClient.send(deleteCommand);
        return {
            statusCode: 200,
            body: ''
        };
    }
    catch (e) {
        return handleError(e);
    }
});
exports.deleteUser = deleteUser;
const listUser = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const scanCommand = new client_dynamodb_1.ScanCommand({
        TableName: tableName
    });
    const { Items } = yield dbClient.send(scanCommand);
    const output = Items === null || Items === void 0 ? void 0 : Items.map(each => (0, util_dynamodb_1.unmarshall)(each));
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(output)
    };
});
exports.listUser = listUser;
//# sourceMappingURL=handlers.js.map