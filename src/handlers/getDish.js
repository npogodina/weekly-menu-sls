import AWS from "aws-sdk";
import createError from "http-errors";
import urlSlug from "url-slug";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDish(event, context) {
  let dish;
  let { id, name } = event.pathParameters;
  name = urlSlug.revert(name, "-", urlSlug.transformers.titlecase);

  try {
    const result = await dynamodb
      .get({
        TableName: process.env.DISHES_TABLE_NAME,
        Key: {
          userId: id,
          name: name,
        },
      })
      .promise();

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
