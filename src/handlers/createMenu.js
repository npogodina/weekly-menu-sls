import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createMenu(event, context) {
  const { userId, startDate, familySize } = event.body;
  // const { userId } = event.body;
  // const { sub } = event.requestContext.authorizer;
  const eaters = Number(familySize);

  const now = new Date();

  let dishes;
  const params = {
    TableName: process.env.RECIPES_TABLE_NAME,
    IndexName: "userIdGlobalIndex",
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

  // Check for enough dish variety meal-wise
  let noVariety = false;
  let check = [0, 0, 0];
  dishes.forEach((dish) => {
    if (dish.breakfast === "y") {
      check[0]++;
    }
    if (dish.lunch === "y") {
      check[1]++;
    }
    if (dish.dinner === "y") {
      check[2]++;
    }
  });
  check.forEach((num) => {
    if (num === 0) {
      noVariety = true;
      // throw new createError.InternalServerError("Not enough dish variety.");
    }
  });
  if (noVariety) {
    return {
      statusCode: 400,
      body:
        "You don't have dishes to cover all meal types - breakfasts, lunches and dinners, sorry!",
    };
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
    groceryList: {},
    groceryListText: [],
    familySize: eaters,
  };

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

  // Helper method to add dishes to menu
  const addDishes = () => {
    shuffledDishes.forEach((dish) => {
      let used = false;
      let servings = dish.servings;

      if (dish.servings >= eaters) {
        if (dish.breakfast === "y") {
          let complete = true; // check if breakfasts are done so that the dish won't get used
          for (const day in menu.menu) {
            if (menu.menu[day].breakfast === "") {
              complete = false;
              break;
            }
          }
          // ? V need rewrite using dates array to keep order
          if (!complete) {
            for (const day in menu.menu) {
              if (menu.menu[day].breakfast === "") {
                menu.menu[day].breakfast = dish.name;
                servings = servings - eaters;
                if (servings < eaters) {
                  used = true;
                  break;
                }
              } else {
                used = true;
              }
            }
          }
        }
        if (used) {
          if (dish.ingredients) {
            addToGroceryList(dish);
          }
          return;
        }

        if (dish.lunch === "y") {
          let complete = true; // check if lunches are done so that the dish won't get used
          for (const day in menu.menu) {
            if (menu.menu[day].lunch === "") {
              complete = false;
              break;
            }
          }
          if (!complete) {
            for (const day in menu.menu) {
              if (menu.menu[day].lunch === "") {
                menu.menu[day].lunch = dish.name;
                servings = servings - eaters;
                if (servings < eaters) {
                  used = true;
                  break;
                }
              } else {
                used = true;
              }
            }
          }
        }
        if (used) {
          if (dish.ingredients) {
            addToGroceryList(dish);
          }
          return;
        }

        if (dish.dinner === "y") {
          let complete = true; // check if dinners are done so that the dish won't get used
          for (const day in menu.menu) {
            if (menu.menu[day].dinner === "") {
              complete = false;
              break;
            }
          }
          if (!complete) {
            for (const day in menu.menu) {
              if (menu.menu[day].dinner === "") {
                menu.menu[day].dinner = dish.name;
                servings = servings - eaters;
                if (servings < eaters) {
                  used = true;
                  break;
                }
              } else {
                used = true;
              }
            }
          }
        }
        if (used) {
          if (dish.ingredients) {
            addToGroceryList(dish);
          }
          return;
        }
      }
    });
  };

  // Generating menu
  let filled = false;
  while (!filled) {
    console.log(shuffledDishes);
    console.log(menu);
    filled = true;
    addDishes();
    for (const day in menu.menu) {
      if (
        menu.menu[day].breakfast === "" ||
        menu.menu[day].lunch === "" ||
        menu.menu[day].dinner === ""
      ) {
        filled = false;
      }
    }
  }

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
    body: JSON.stringify(menu),
  };
}

export const handler = commonMiddleware(createMenu);
