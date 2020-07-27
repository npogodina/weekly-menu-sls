import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteDish(event, context) {
  console.log(event.pathParameters);
  let { id } = event.pathParameters;

  try {
    const result = await dynamodb
      .delete({
        TableName: process.env.RECIPES_TABLE_NAME,
        Key: {
          dishId: id,
        },
      })
      .promise();
    console.log(result);
    console.log("Item deleted");
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify("Item deleted"),
  };
}

export const handler = commonMiddleware(deleteDish);
