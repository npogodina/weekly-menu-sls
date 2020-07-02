# Weekly Menu

Serverless web app that allows registered users to add dishes and makes a weekly menu out of them. The dishes can have optional ingredients. If the ingredients are provided, the app will output a grocery list in addition to the menu. This helps planning meals and making grocery lists. 

## Tech Stack:
### AWS serverless stack
- AWS Lambda (Node.js)
- AWS API Gateway
- AWS DynamoDB
- AWS S3

### serverless framework
Plugins:
- [serverless-pseudo-parameters](https://www.npmjs.com/package/serverless-pseudo-parameters): allows you to take advantage of CloudFormation Pseudo Parameters
- [serverless-bundle](https://www.npmjs.com/package/serverless-bundle): bundler based on the serverless-webpack plugin - requires zero configuration and fully compatible with ES6/ES7 features

### React

## Data modeling:

DishesTable:
```
{
  userId: uuid,                       // partition key
  name: string,                       // sort key
  dishId: uuid,                       // ? not needed ?
  timestamp: new Date().toISOString,  // LCI
  recipe: [],
  imageUrl: string,
  ingredients: [
    {
      name: string,
      amount: number,
      measurement: string
    }
  ],
  breakfast: string,                  // LCI
  lunch: string,                      // LCI
  dinner: string,                     // LCI
  other: string                       // LCI
}
```
LCI (Local Secondary Index) provides fast look up with alternative queries, but depending on the amount of data it might be wiser to move sorting/filtering to React to avoid extra API calls.
  
## REST API:
### Endpoints:
- POST /dishes - to create a new dish
- GET /dishes - to get all dishes
- GET /dishes/{id}/{name} where id is userId and name is name - to show one dish

Updating dish will be a put method (AWS.DynamoDB.DocumentClient) and will replace the whole item based on matching primary key: userId and name. There won't be an option to modify name in UI (React).
