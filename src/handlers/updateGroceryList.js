import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateGroceryList(event, context) {
  const { userId, startDate, updatedGroceryListText } = event.body;

  // Sort groceryListText
  let sortedGroceryListText = updatedGroceryListText.sort((a, b) => {
    if (a.main.toUpperCase() < b.main.toUpperCase()) {
      return -1;
    }
    if (a.main.toUpperCase() > b.main.toUpperCase()) {
      return 1;
    }
    return 0;
  });

  var params = {
    TableName: process.env.MENUS_TABLE_NAME,
    Key: {
      userId,
      startDate,
    },
    UpdateExpression: "set groceryListText = :a",
    ExpressionAttributeValues: {
      ":a": sortedGroceryListText,
    },
  };

  try {
    const result = await dynamodb.update(params).promise();
    console.log(result);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify("Menu updated!"),
  };
}

export const handler = commonMiddleware(updateGroceryList);
