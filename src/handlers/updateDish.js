import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateDish(event, context) {
  let { id } = event.pathParameters;

  const {
    userId,
    name,
    servings,
    directions,
    ingredients,
    image,
    breakfast,
    lunch,
    dinner,
    other,
  } = event.body;

  const now = new Date();

  const dish = {
    userId,
    name,
    dishId: id,
    timestamp: now.toISOString(),
    servings,
    ingredients,
    directions,
    image,
    breakfast,
    lunch,
    dinner,
    other,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.RECIPES_TABLE_NAME,
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

export const handler = commonMiddleware(updateDish);
