import AWS from "aws-sdk";
import createError from "http-errors";
// import urlSlug from "url-slug";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteDish(event, context) {
  let dish;
  console.log(event.pathParameters);
  let { id } = event.pathParameters;
  // name = urlSlug.revert(name, "-", urlSlug.transformers.titlecase);

  const params = {
    TableName: process.env.DISHES_TABLE_NAME,
    IndexName: "dishIdGlobalIndex",
    KeyConditionExpression: "dishId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": id,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    console.log(result);
    dish = result.Items[0];
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!dish) {
    throw new createError.NotFound(`Dish not found`);
  }

  const userId = dish.userId;
  const name = dish.name;

  try {
    const result = await dynamodb
      .delete({
        TableName: process.env.DISHES_TABLE_NAME,
        Key: {
          userId: userId,
          name: name,
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
