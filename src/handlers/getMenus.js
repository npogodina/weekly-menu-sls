import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getMenus(event, context) {
  // const { userId } = event.body;
  // const { sub } = event.requestContext.authorizer;

  let menus;

  const nataliya = "google-oauth2|102165070264738113845";
  const params = {
    TableName: process.env.MENUS_TABLE_NAME,
    KeyConditionExpression: "userId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": nataliya,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    menus = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(menus),
  };
}

export const handler = commonMiddleware(getMenus);
