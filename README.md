<p align="center"><img width="400" src="https://live.staticflickr.com/65535/50147918473_b7eec0cc98_o.jpg"/></p>

[Weekly Menu](https://master.dgrpdkkvvvjff.amplifyapp.com/) is a serverless web app that allows registered users to add dishes and makes a weekly menu out of them. The dishes can have optional ingredients. If the ingredients are provided, the app will output a grocery list in addition to the menu. This helps planning meals and making grocery lists.

Weekly menu started as a capstone project for Ada Developers Academy by Nataliya Pogodina.

[Ada Developers Academy](https://adadevelopersacademy.org/) is a non-profit tuition-free intensive coding school for women and gender diverse people. It combines six months of classroom training with a five month internship at Seattle tech companies. As a culmination of the classroom learning experience, students create a Capstone project where they are encouraged to learn and implement new technologies with a three week deadline.

- [Weekly Menu demo (video)](https://www.youtube.com/watch?v=9OHsD5yx8No)
- [Weekly Menu Trello Board](https://trello.com/b/zZakfPqr/weekly-menu)

## Github repos

- Back End: [weekly-menu-sls](https://github.com/npogodina/weekly-menu-sls/) (this repo!)
- Front End: [weekly-menu-react](https://github.com/npogodina/weekly-menu-react-2)

## Tech Stack

### Back End

- AWS serverless stack:

  - AWS Lambda (Node.js)
  - AWS API Gateway
  - AWS DynamoDB

- serverless framework
- serverless plugins:

  - [serverless-pseudo-parameters](https://www.npmjs.com/package/serverless-pseudo-parameters): allows you to take advantage of CloudFormation Pseudo Parameters
  - [serverless-bundle](https://www.npmjs.com/package/serverless-bundle): bundler based on the serverless-webpack plugin - fully compatible with ES6/ES7 features

- Back End Dependencies:

  - @middy/core
  - @middy/http-cors
  - @middy/http-error-handler
  - @middy/http-event-normalizer
  - @middy/http-json-body-parser
  - aws-sdk
  - http-errors
  - url-slug
  - uuid

### Front End

- React
- Front End Dependencies:

  - @auth0-react
  - axios
  - dateformat
  - react-datepicker
  - react-dnd, react-dnd-html5-backend
  - react-dom
  - react-pdf, @react-pdf/renderer
  - react-router-dom
  - semantic-ui-react

- auth0: authentication

- AWS Amplify: deployment

## Data modeling

### DishesTable

```
{
  userId: google-oauth2,              // partition key
  name: string,                       // sort key
  dishId: uuid,                       // GSI
  timestamp: new Date().toISOString,  // LCI
  breakfast: string,                  // LCI, currently "y" or "n"
  lunch: string,                      // LCI, currently "y" or "n"
  dinner: string,                     // LCI, currently "y" or "n"
  other: string                       // LCI, currently "y" or "n"
  image: string,                      // url
  servings: string
  directions: [],
  ingredients: [
    {
      name: string,
      amount: string,                 // validated in React to be a decimal
      measurement: string
    }
  ],
}
```

LCI (Local Secondary Index) provides fast look up with alternative queries, but right now due to the small amount of data all filtering is handled by React.

### MenusTable

```
{
  userId: google-oauth2,              // partition key
  startDate: string,                  // sort key
  menuId: uuid,                       // GSI
  timestamp: new Date().toISOString,
  familySize: number
  servings: string
  directions: [],
  groceryList: [
    {
      name: [
        {
          amount: number,
          measurement" string,
          for: []                    // list of strings (dish names)
        },
        {
          ...                        // to handle same ingredient with different measurements
        }
      ]
    }
  ],
  groceryListText: [
    {
      main: string                   // in format [name]: [amount][measurement]
      for: string                    // coma separated dish names
    },
    {
      ...
    }
  ]
}
```

groceryList is a result of the first ingredients aggregation.  
groceryListText restructures the data for easier access in React.

## REST API

### Endpoints

#### Dishes

- POST /dishes - to create a new dish
- GET /dishes - to get all dishes
- GET /dishes/{id} - to get one dish, where id is dishId
- DELETE /dishes/{id} - to delete a dish, where id is dishId

Currently updating a dish is done with createDish function using put method (AWS.DynamoDB.DocumentClient). It replaces the whole item based on matching primary key: userId and name. There is no option to modify name in UI (React).

#### Menus

- POST /menus - to create a new menu
- GET /menus - to get all menues
- GET /menus/{menuId} - to get one menu, where menuId is menuId
- POST /menus/{menuId} - to update (overwrite) a menu, where menuId is menuId
- DELETE /menus/{menuId} - to delete a menu, where menuId is menuId
- PATCH /menus/{menuId} - to update grocery list for a menu, where menuId is menuId

Currently updateMenu function uses put method (AWS.DynamoDB.DocumentClient) to overwrite the item, while updateGroceryList function uses update method to update only groceryList and groceryListText attributes. These two functions might get refactored into one in the future.

## Future Plans

I plan to continue working on the project. Your feedback is very welcome. Please, feel free to report bugs and reach out with any suggestions. Happy meal planning!
