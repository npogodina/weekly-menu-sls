import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteDish(event, context) {
  let dish;
  console.log(event.pathParameters);
  let { id } = event.pathParameters;

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

  return {
    statusCode: 200,
    body: JSON.stringify(dish),
  };
}

export const handler = commonMiddleware(deleteDish);

////////////////////////////////////
// OLD: get dish by userId and name:

// import AWS from "aws-sdk";
// import createError from "http-errors";
// import urlSlug from "url-slug";
// import commonMiddleware from "../lib/commonMiddleware";

// const dynamodb = new AWS.DynamoDB.DocumentClient();

// async function getDish(event, context) {
//   let dish;
//   let { id, name } = event.pathParameters;
//   name = urlSlug.revert(name, "-", urlSlug.transformers.titlecase);

//   try {
//     const result = await dynamodb
//       .get({
//         TableName: process.env.DISHES_TABLE_NAME,
//         Key: {
//           userId: id,
//           name: name,
//         },
//       })
//       .promise();

//     dish = result.Item;
//   } catch (error) {
//     console.error(error);
//     throw new createError.InternalServerError(error);
//   }

//   if (!dish) {
//     throw new createError.NotFound(`Dish not found`);
//   }

//   return {
//     statusCode: 200,
//     body: JSON.stringify(dish),
//   };
// }

// export const handler = commonMiddleware(getDish);
