import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getMenu(event, context) {
  let menu;
  let { menuId } = event.pathParameters;

  const params = {
    TableName: process.env.PLANS_TABLE_NAME,
    Key: {
      menuId: menuId,
    },
  };

  try {
    const result = await dynamodb.get(params).promise();
    console.log(result);
    menu = result.Item;
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
