import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteMenu(event, context) {
  let { menuId } = event.pathParameters;

  try {
    const result = await dynamodb
      .delete({
        TableName: process.env.PLANS_TABLE_NAME,
        Key: {
          menuId,
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
    body: JSON.stringify("Menu deleted"),
  };
}

export const handler = commonMiddleware(deleteMenu);
