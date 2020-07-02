import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDishes(event, context) {
  let dishes;

  try {
    const result = await dynamodb
      .scan({
        TableName: process.env.DISHES_TABLE_NAME,
      })
      .promise();

    dishes = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(dishes),
  };
}

export const handler = commonMiddleware(getDishes);
