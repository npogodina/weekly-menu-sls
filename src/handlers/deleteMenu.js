import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteMenu(event, context) {
  let menu;
  console.log(event.pathParameters);
  let { menuId } = event.pathParameters;

  const params = {
    TableName: process.env.MENUS_TABLE_NAME,
    IndexName: "menuIdGlobalIndex",
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

  const userId = menu.userId;
  const startDate = menu.startDate;

  try {
    const result = await dynamodb
      .delete({
        TableName: process.env.MENUS_TABLE_NAME,
        Key: {
          userId: userId,
          startDate: startDate,
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
