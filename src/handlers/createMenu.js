import AWS from "aws-sdk";
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

  let day2 = new Date(startDate);
  day2.setDate(day2.getDate() + 1);
  day2 = day2.toISOString();

  const menu = {
    userId,
    startDate,
    timestamp: now.toISOString(),
    menu: {
      [startDate]: { breakfast: "", lunch: "", dinner: "" },
      [day2]: { breakfast: "", lunch: "", dinner: "" },
    },
  };

  dishes.forEach((dish) => {
    if (dish.breakfast === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].breakfast === "") {
          menu.menu[day].breakfast = dish.name;
          break;
        }
      }
    } else if (dish.lunch === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].lunch === "") {
          menu.menu[day].lunch = dish.name;
          break;
        }
      }
    } else if (dish.dinner === "y") {
      for (const day in menu.menu) {
        if (menu.menu[day].dinner === "") {
          menu.menu[day].dinner = dish.name;
          break;
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
