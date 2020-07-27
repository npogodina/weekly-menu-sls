import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDishes(event, context) {
  // const { userId } = event.body;
  // const { sub } = event.requestContext.authorizer;
  const { userId } = event.queryStringParameters;
  let dishes;

  const params = {
    TableName: process.env.RECIPES_TABLE_NAME,
    IndexName: "userIdGlobalIndex",
    KeyConditionExpression: "userId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": userId,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    dishes = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(dishes),
  };
}

export const handler = commonMiddleware(getDishes);
