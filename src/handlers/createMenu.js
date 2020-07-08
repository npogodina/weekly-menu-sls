import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createMenu(event, context) {
  const { userId, startDate } = event.body;
  // const { userId } = event.body;
  // const { sub } = event.requestContext.authorizer;

  const now = new Date();

  let dishes;
  const params = {
    TableName: process.env.DISHES_TABLE_NAME,
    KeyConditionExpression: "userId = :hkey",
    ExpressionAttributeValues: {
      ":hkey": userId,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    dishes = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  let shuffledDishes = dishes;
  for (let i = shuffledDishes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = shuffledDishes[i];
    shuffledDishes[i] = shuffledDishes[j];
    shuffledDishes[j] = temp;
  }

  const dates = [startDate];
  for (let i = 1; i < 7; i++) {
    let day = new Date(startDate);
    day.setDate(day.getDate() + i);
    dates.push(day.toISOString());
  }

  const menu = {
    userId,
    startDate,
    timestamp: now.toISOString(),
    menuId: uuid(),
    menu: {
      [dates[0]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[1]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[2]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[3]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[4]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[5]]: { breakfast: "", lunch: "", dinner: "" },
      [dates[6]]: { breakfast: "", lunch: "", dinner: "" },
    },
  };

  shuffledDishes.forEach((dish) => {
    let used = false;
    let servings = dish.servings;

    if (dish.breakfast === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].breakfast === "") {
          menu.menu[day].breakfast = dish.name;
          servings = servings - 2;
          if (servings < 2) {
            used = true;
            break;
          }
        }
      }
    }
    if (used) {
      return;
    }
    if (dish.lunch === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].lunch === "") {
          menu.menu[day].lunch = dish.name;
          servings = servings - 2;
          if (servings < 2) {
            used = true;
            break;
          }
        }
      }
    }
    if (used) {
      return;
    }
    if (dish.dinner === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].dinner === "") {
          menu.menu[day].dinner = dish.name;
          servings = servings - 2;
          if (servings < 2) {
            used = true;
            break;
          }
        }
      }
    }
  });

  try {
    await dynamodb
      .put({
        TableName: process.env.MENUS_TABLE_NAME,
        Item: menu,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(menu),
  };
}

export const handler = commonMiddleware(createMenu);
