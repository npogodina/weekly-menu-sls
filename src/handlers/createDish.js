import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createDish(event, context) {
  const {
    userId,
    name,
    servings,
    directions,
    ingredients,
    breakfast,
    lunch,
    dinner,
    other,
  } = event.body;
  // const { sub } = event.requestContext.authorizer;

  const now = new Date();

  const dish = {
    userId,
    name,
    dishId: uuid(),
    timestamp: now.toISOString(),
    servings,
    ingredients,
    directions,
    breakfast,
    lunch,
    dinner,
    other,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.DISHES_TABLE_NAME,
        Item: dish,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(dish),
  };
}

export const handler = commonMiddleware(createDish);
