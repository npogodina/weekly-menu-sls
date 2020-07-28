import AWS from "aws-sdk";
import createError from "http-errors";
// import urlSlug from "url-slug";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getMenu(event, context) {
  let menu;
  console.log(event.pathParameters);
  let { menuId } = event.pathParameters;
  // name = urlSlug.revert(name, "-", urlSlug.transformers.titlecase);

  const params = {
    TableName: process.env.PLANS_TABLE_NAME,
    KeyConditionExpression: "menuId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": menuId,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    console.log(result);
    menu = result.Items[0];
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!menu) {
    throw new createError.NotFound(`Menu not found`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(menu),
  };
}

export const handler = commonMiddleware(getMenu);
