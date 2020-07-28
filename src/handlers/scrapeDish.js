import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";
import recipeScraper from "recipe-scraper";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createDish(event, context) {
  const { userId, dishUrl } = event.body;
  let recipe = await recipeScraper(dishUrl);
  const now = new Date();

  const dish = {
    userId,
    name: recipe.name,
    dishId: uuid(),
    timestamp: now.toISOString(),
    servings: recipe.servings,
    ingredients: [],
    directions: recipe.instructions,
    image: recipe.image,
    breakfast: "n",
    lunch: "n",
    dinner: "n",
    other: "y",
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.RECIPES_TABLE_NAME,
        Item: dish,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(dish),
  };
}

export const handler = commonMiddleware(createDish);
