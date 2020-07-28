import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateMenu(event, context) {
  const { menuId } = event.pathParameters;
  const { userId, startDate, familySize, updatedMenu } = event.body;
  const now = new Date();

  const menu = {
    userId,
    startDate,
    familySize,
    timestamp: now.toISOString(),
    menuId,
    menu: updatedMenu,
    groceryList: {},
    groceryListText: [],
  };

  const dates = [menu.startDate];
  for (let i = 1; i < 7; i++) {
    let day = new Date(menu.startDate);
    day.setDate(day.getDate() + i);
    dates.push(day.toISOString());
  }
  console.log(dates);

  // Helper method to add ingredients to grocery list
  const addToGroceryList = (dish) => {
    dish.ingredients.forEach((ingredient) => {
      // if ingredient already exists in grocery list
      if (menu.groceryList[ingredient.name]) {
        let added = false;
        menu.groceryList[ingredient.name].forEach((amountInfo) => {
          // dish name shouldn't be added if duplicate dish
          let alreadyIn = false;
          amountInfo.for.forEach((dishName) => {
            if (dishName === dish.name) {
              alreadyIn = true;
            }
          });

          // if no amount
          if (!added && !ingredient.amount && amountInfo.amount === "some") {
            !alreadyIn && amountInfo.for.push(dish.name);
            added = true;
            // if no amount or same measurement
          } else if (
            (!added &&
              ingredient.amount &&
              !ingredient.measurement &&
              amountInfo.amount &&
              !amountInfo.measurement) ||
            (!added &&
              ingredient.amount &&
              ingredient.measurement &&
              amountInfo.amount &&
              amountInfo.measurement === ingredient.measurement)
          ) {
            const existingAmount = Number(amountInfo.amount);
            const amountToAdd = Number(ingredient.amount);
            if (existingAmount && amountToAdd) {
              amountInfo.amount = existingAmount + amountToAdd;
              amountInfo["comment"] = "Summed up the ingredients";
            }
            !alreadyIn && amountInfo.for.push(dish.name);
            added = true;
          }
        });

        // if different measurements
        if (!added && ingredient.amount) {
          let addOn = { amount: ingredient.amount };
          if (ingredient.measurement) {
            addOn["measurement"] = ingredient.measurement;
          }
          menu.groceryList[ingredient.name].push(addOn);
          menu.groceryList[ingredient.name][
            menu.groceryList[ingredient.name].length - 1
          ]["for"] = [dish.name];
          added = true;
        } else if (!added) {
          menu.groceryList[ingredient.name].push({ amount: "some" });
          menu.groceryList[ingredient.name][
            menu.groceryList[ingredient.name].length - 1
          ]["for"] = [dish.name];
          added = true;
        }

        // if ingredient doesn't exist in grocery list
      } else {
        if (ingredient.amount) {
          menu.groceryList[ingredient.name] = [{ amount: ingredient.amount }];
          if (ingredient.measurement) {
            menu.groceryList[ingredient.name][0]["measurement"] =
              ingredient.measurement;
          }
          // if no amount, replace with some
        } else {
          menu.groceryList[ingredient.name] = [{ amount: "some" }];
        }
        menu.groceryList[ingredient.name][0]["for"] = [dish.name];
      }
    });
  };

  // Helper method to get servings & ingredients data for all dishes from the menu
  const checkServingsAndIngredients = async (meal) => {
    let servings = 0;
    let dish = null;
    for (let day in dates) {
      if (menu.menu[dates[day]][meal]) {
        if (
          servings < 2 ||
          (day !== 0 &&
            menu.menu[dates[day]][meal] !== menu.menu[dates[day - 1]][meal])
        ) {
          console.log(menu.menu);
          console.log(menu.menu[dates[day]][meal]);
          // Get next dish info from Dynamodb
          try {
            const result = await dynamodb
              .query({
                TableName: process.env.RECIPES_TABLE_NAME,
                IndexName: "userIdGlobalIndex",
                // ProjectionExpression: "#n",
                KeyConditionExpression: "userId = :hkey and #n = :rkey",
                ExpressionAttributeNames: {
                  "#n": "name",
                },
                ExpressionAttributeValues: {
                  ":hkey": userId,
                  ":rkey": menu.menu[dates[day]][meal],
                },
              })
              .promise();
            console.log(result);
            console.log(result.Items[0]);
            dish = result.Items[0];
            servings = result.Items[0].servings;
          } catch (error) {
            console.error(error);
            throw new createError.InternalServerError(error);
          }

          if (!dish) {
            throw new createError.NotFound(`Dish not found`);
          }

          // Add ingridients of the newly fetched dish
          addToGroceryList(dish);
        }

        // Else decrese servings
        servings -= 2;
      }
    }
  };

  await checkServingsAndIngredients("breakfast");
  await checkServingsAndIngredients("lunch");
  await checkServingsAndIngredients("dinner");

  // Restructure grocery list output for frontend
  for (const item in menu.groceryList) {
    menu.groceryList[item].forEach((amountInfo) => {
      let main = "";
      main += item;

      if (amountInfo["amount"]) {
        main += ": ";
        main += amountInfo["amount"];
      }
      if (amountInfo["measurement"]) {
        main += " ";
        main += amountInfo["measurement"];
      }

      let extra = amountInfo["for"].join(", ");
      let toAdd = { main: main, for: extra };
      menu.groceryListText.push(toAdd);
    });
  }

  // Sort groceryListText
  let sortedGroceryListText = menu.groceryListText.sort((a, b) => {
    if (a.main.toUpperCase() < b.main.toUpperCase()) {
      return -1;
    }
    if (a.main.toUpperCase() > b.main.toUpperCase()) {
      return 1;
    }
    return 0;
  });
  menu.groceryListText = sortedGroceryListText;

  try {
    await dynamodb
      .put({
        TableName: process.env.PLANS_TABLE_NAME,
        Item: menu,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(menu.menuId),
  };
}

export const handler = commonMiddleware(updateMenu);
