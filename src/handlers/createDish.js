import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createDish(event, context) {
  const { name } = JSON.parse(event.body);
  const now = new Date();

  const dish = {
    userId: "1",
    name,
    dishId: uuid(),
    timestamp: now.toISOString(),
    breakfast: "no",
    lunch: "yes",
    dinner: "yes",
    other: "no",
  };

  await dynamodb
    .put({
      TableName: "DishesTable",
      Item: dish,
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(dish),
  };
}

export const handler = createDish;
