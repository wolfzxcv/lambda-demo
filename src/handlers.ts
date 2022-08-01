import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 } from 'uuid';
import * as yup from 'yup';

const dbClient = new DynamoDBClient({ region: 'ap-northeast-1' });
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
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
  }
}

const handleError = (e: unknown) => {
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

export const createUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const user = {
      ...reqBody,
      userID: v4()
    };

    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(user)
    });

    await dbClient.send(putCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(user)
    };
  } catch (e) {
    return handleError(e);
  }
};

const fetchUserById = async (id: any) => {
  const getCommand = new GetItemCommand({
    TableName: tableName,
    Key: marshall({
      userID: id
    })
  });

  const { Item } = await dbClient.send(getCommand);

  if (!Item) {
    throw new HttpError(404, { error: 'not found' });
  }

  return Item;
};

export const getUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    const user = await fetchUserById(id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(unmarshall(user))
    };
  } catch (e) {
    return handleError(e);
  }
};

export const updateUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchUserById(id);

    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const user = {
      ...reqBody,
      userID: id
    };

    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(user)
    });

    await dbClient.send(putCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(user)
    };
  } catch (e) {
    return handleError(e);
  }
};

export const deleteUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as any;

    await fetchUserById(id);

    const deleteCommand = new DeleteItemCommand({
      TableName: tableName,
      Key: marshall({
        userID: id
      })
    });

    await dbClient.send(deleteCommand);

    return {
      statusCode: 200,
      body: ''
    };
  } catch (e) {
    return handleError(e);
  }
};

export const listUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const scanCommand = new ScanCommand({
    TableName: tableName
  });
  const { Items } = await dbClient.send(scanCommand);

  const output = Items?.map(each => unmarshall(each));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output)
  };
};
