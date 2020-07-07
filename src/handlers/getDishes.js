import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDishes(event, context) {
  // const { userId } = event.body;
  // const { sub } = event.requestContext.authorizer;

  let dishes;

  const nataliya = "google-oauth2|102165070264738113845";
  const params = {
    TableName: process.env.DISHES_TABLE_NAME,
    // IndexName: 'Index',
    KeyConditionExpression: "userId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": nataliya,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    dishes = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  // dynamodb.query(params, function (err, data) {
  //   if (err) {
  //     console.error(
  //       "Unable to read item. Error JSON:",
  //       JSON.stringify(err, null, 2)
  //     );
  //   } else {
  //     dishes = data;
  //   }
  // });

  // try {
  //   const result = await dynamodb.query(params).promise();

  //   dishes = result.Items;
  // } catch (error) {
  //   console.error(error);
  //   throw new createError.InternalServerError(error);
  // }

  return {
    statusCode: 200,
    body: JSON.stringify(dishes),
  };
}

export const handler = commonMiddleware(getDishes);
