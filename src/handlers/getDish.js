import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDish(event, context) {
  let dish;
  console.log(event.pathParameters);
  let { id } = event.pathParameters;

  const params = {
    TableName: process.env.RECIPES_TABLE_NAME,
    Key: {
      dishId: id,
    },
  };

  try {
    const result = await dynamodb.get(params).promise();
    console.log(result);
    dish = result.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!dish) {
    throw new createError.NotFound(`Dish not found`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(dish),
  };
}

export const handler = commonMiddleware(getDish);
