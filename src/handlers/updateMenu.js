import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateMenu(event, context) {
  const { userId, startDate, menu } = event.body;
  const now = new Date();

  const updatedMenu = {
    userId,
    startDate,
    timestamp: now.toISOString(),
    menuId: uuid(),
    menu,
    // groceryList: {},
    groceryListText: [],
  };

  for (const day in menu) {
    for (const meal in menu[day]) {
      let dish = null;
      console.log(userId);
      console.log(menu[day][meal]);
      try {
        const result = await dynamodb
          .get({
            TableName: process.env.DISHES_TABLE_NAME,
            Key: {
              userId: userId,
              name: menu[day][meal],
            },
          })
          .promise();
        dish = result.Item;
        console.log(dish);

        updatedMenu.groceryListText.push(dish.name);
      } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
      }

      if (!dish) {
        throw new createError.NotFound(`Dish not found`);
      }
    }
  }

  // // Helper method to add ingredients to grocery list
  // const addToGroceryList = (dish) => {
  //   dish.ingredients.forEach((ingredient) => {
  //     // if ingredient already exists in grocery list
  //     if (menu.groceryList[ingredient.name]) {
  //       let added = false;
  //       menu.groceryList[ingredient.name].forEach((amountInfo) => {
  //         // dish name shouldn't be added if duplicate dish
  //         let alreadyIn = false;
  //         amountInfo.for.forEach((dishName) => {
  //           if (dishName === dish.name) {
  //             alreadyIn = true;
  //           }
  //         });

  //         // if no amount
  //         if (!added && !ingredient.amount && amountInfo.amount === "some") {
  //           !alreadyIn && amountInfo.for.push(dish.name);
  //           added = true;
  //           // if no amount or same measurement
  //         } else if (
  //           (!added &&
  //             ingredient.amount &&
  //             !ingredient.measurement &&
  //             amountInfo.amount &&
  //             !amountInfo.measurement) ||
  //           (!added &&
  //             ingredient.amount &&
  //             ingredient.measurement &&
  //             amountInfo.amount &&
  //             amountInfo.measurement === ingredient.measurement)
  //         ) {
  //           const existingAmount = Number(amountInfo.amount);
  //           const amountToAdd = Number(ingredient.amount);
  //           if (existingAmount && amountToAdd) {
  //             amountInfo.amount = existingAmount + amountToAdd;
  //             amountInfo["comment"] = "Summed up the ingredients";
  //           }
  //           !alreadyIn && amountInfo.for.push(dish.name);
  //           added = true;
  //         }
  //       });

  //       // if different measurements
  //       if (!added && ingredient.amount) {
  //         let addOn = { amount: ingredient.amount };
  //         if (ingredient.measurement) {
  //           addOn["measurement"] = ingredient.measurement;
  //         }
  //         menu.groceryList[ingredient.name].push(addOn);
  //         menu.groceryList[ingredient.name][
  //           menu.groceryList[ingredient.name].length - 1
  //         ]["for"] = [dish.name];
  //         added = true;
  //       } else if (!added) {
  //         menu.groceryList[ingredient.name].push({ amount: "some" });
  //         menu.groceryList[ingredient.name][
  //           menu.groceryList[ingredient.name].length - 1
  //         ]["for"] = [dish.name];
  //         added = true;
  //       }

  //       // if ingredient doesn't exist in grocery list
  //     } else {
  //       if (ingredient.amount) {
  //         menu.groceryList[ingredient.name] = [{ amount: ingredient.amount }];
  //         if (ingredient.measurement) {
  //           menu.groceryList[ingredient.name][0]["measurement"] =
  //             ingredient.measurement;
  //         }
  //         // if no amount, replace with some
  //       } else {
  //         menu.groceryList[ingredient.name] = [{ amount: "some" }];
  //       }
  //       menu.groceryList[ingredient.name][0]["for"] = [dish.name];
  //     }
  //   });
  // };

  // // Helper method to add dishes to menu
  // const addDishes = () => {
  //   shuffledDishes.forEach((dish) => {
  //     let used = false;
  //     let servings = dish.servings;

  //     if (dish.breakfast === "y") {
  //       for (const day in menu.menu) {
  //         if (menu.menu[day].breakfast === "") {
  //           menu.menu[day].breakfast = dish.name;
  //           servings = servings - 2;
  //           if (servings < 2) {
  //             used = true;
  //             break;
  //           }
  //         }
  //       }
  //     }
  //     if (used) {
  //       if (dish.ingredients) {
  //         addToGroceryList(dish);
  //       }
  //       return;
  //     }
  //     if (dish.lunch === "y") {
  //       for (const day in menu.menu) {
  //         if (menu.menu[day].lunch === "") {
  //           menu.menu[day].lunch = dish.name;
  //           servings = servings - 2;
  //           if (servings < 2) {
  //             used = true;
  //             break;
  //           }
  //         }
  //       }
  //     }
  //     if (used) {
  //       if (dish.ingredients) {
  //         addToGroceryList(dish);
  //       }
  //       return;
  //     }
  //     if (dish.dinner === "y") {
  //       for (const day in menu.menu) {
  //         if (menu.menu[day].dinner === "") {
  //           menu.menu[day].dinner = dish.name;
  //           servings = servings - 2;
  //           if (servings < 2) {
  //             used = true;
  //             break;
  //           }
  //         }
  //       }
  //     }
  //     if (used) {
  //       if (dish.ingredients) {
  //         addToGroceryList(dish);
  //       }
  //       return;
  //     }
  //   });
  // };

  // // Generating menu
  // let filled = false;
  // while (!filled) {
  //   filled = true;
  //   addDishes();
  //   for (const day in menu.menu) {
  //     if (
  //       menu.menu[day].breakfast === "" ||
  //       menu.menu[day].lunch === "" ||
  //       menu.menu[day].dinner === ""
  //     ) {
  //       filled = false;
  //     }
  //   }
  // }

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
        Item: updatedMenu,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(updatedMenu),
  };
}

export const handler = commonMiddleware(updateMenu);
