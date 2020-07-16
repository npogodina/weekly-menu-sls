import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateMenu(event, context) {
  const { userId, startDate, updatedMenu } = event.body;
  const now = new Date();

  const menu = {
    userId,
    startDate,
    timestamp: now.toISOString(),
    menuId: uuid(),
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

  // Needs refactor
  // Throws "can not use keyword ‘await’ outside an async function” error" when using a helper method
  // Breakfast:
  // const checkServingsAndIngredients = async (meal) => {
  let servings = 0;
  let dish = null;
  for (let day in dates) {
    if (
      servings < 2 ||
      (day !== 0 &&
        menu.menu[dates[day]]["breakfast"] !==
          menu.menu[dates[day - 1]]["breakfast"])
    ) {
      console.log(menu.menu);
      console.log(menu.menu[dates[day]]["breakfast"]);
      // Get next dish info from Dynamodb
      try {
        const result = await dynamodb
          .get({
            TableName: process.env.DISHES_TABLE_NAME,
            Key: {
              userId: userId,
              name: menu.menu[dates[day]]["breakfast"],
            },
          })
          .promise();
        dish = result.Item;
        servings = result.Item.servings;
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
  // };

  // Lunch:
  servings = 0;
  dish = null;
  for (let day in dates) {
    if (
      servings < 2 ||
      (day !== 0 &&
        menu.menu[dates[day]]["lunch"] !== menu.menu[dates[day - 1]]["lunch"])
    ) {
      console.log(menu.menu);
      console.log(menu.menu[dates[day]]["lunch"]);
      // Get next dish info from Dynamodb
      try {
        const result = await dynamodb
          .get({
            TableName: process.env.DISHES_TABLE_NAME,
            Key: {
              userId: userId,
              name: menu.menu[dates[day]]["lunch"],
            },
          })
          .promise();
        dish = result.Item;
        servings = result.Item.servings;
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

  // Dinner:
  servings = 0;
  dish = null;
  for (let day in dates) {
    if (
      servings < 2 ||
      (day !== 0 &&
        menu.menu[dates[day]]["dinner"] !== menu.menu[dates[day - 1]]["dinner"])
    ) {
      console.log(menu.menu);
      console.log(menu.menu[dates[day]]["dinner"]);
      // Get next dish info from Dynamodb
      try {
        const result = await dynamodb
          .get({
            TableName: process.env.DISHES_TABLE_NAME,
            Key: {
              userId: userId,
              name: menu.menu[dates[day]]["dinner"],
            },
          })
          .promise();
        dish = result.Item;
        servings = result.Item.servings;
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

  // checkServingsAndIngredients("breakfast");
  // checkServingsAndIngredients("lunch");
  // checkServingsAndIngredients("dinner");

  // // Restructure grocery list output for frontend
  // for (const item in menu.groceryList) {
  //   menu.groceryList[item].forEach((amountInfo) => {
  //     let main = "";
  //     main += item;

  //     if (amountInfo["amount"]) {
  //       main += ": ";
  //       main += amountInfo["amount"];
  //     }
  //     if (amountInfo["measurement"]) {
  //       main += " ";
  //       main += amountInfo["measurement"];
  //     }

  //     let extra = amountInfo["for"].join(", ");
  //     let toAdd = { main: main, for: extra };
  //     menu.groceryListText.push(toAdd);
  //   });
  // }

  // // Sort groceryListText
  // let sortedGroceryListText = menu.groceryListText.sort((a, b) => {
  //   if (a.main.toUpperCase() < b.main.toUpperCase()) {
  //     return -1;
  //   }
  //   if (a.main.toUpperCase() > b.main.toUpperCase()) {
  //     return 1;
  //   }
  //   return 0;
  // });
  // menu.groceryListText = sortedGroceryListText;

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

export const handler = commonMiddleware(updateMenu);
