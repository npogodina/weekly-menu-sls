const AWS = require("aws-sdk");

// Use the scan method to get everything from the old table
const readAllDataFromTable = async ({ region, table }) => {
  AWS.config.update({ region });
  const db = new AWS.DynamoDB.DocumentClient();

  return await new Promise((resolve, reject) => {
    db.scan(
      {
        TableName: table,
      },
      (err, data) => {
        if (err) {
          reject("Unable to scan the table.");
        } else {
          resolve(data.Items);
        }
      }
    );
  });
};

// Write one row of data to the new table
const writeRowToTable = async (db, table, row) => {
  return await new Promise((resolve, reject) => {
    db.put(
      {
        TableName: table,
        Item: row,
      },
      (err) => {
        if (err) {
          reject();
        } else {
          resolve();
        }
      }
    );
  });
};

// Write all the data to the new table
const writeDataToTable = async ({ region, table, data }) => {
  AWS.config.update({ region });
  const db = new AWS.DynamoDB.DocumentClient();

  // Keep a count of the successful writes so we can know if
  // all the items were written successfully
  let successfulWrites = 0;

  await Promise.all(
    data.map(async (item) => {
      return new Promise(async (resolve) => {
        try {
          await writeRowToTable(db, table, item);
          successfulWrites++;
        } catch (e) {
          // If something fails, log it
          console.log("error", e);
        }
        resolve();
      });
    })
  );

  console.log(`wrote ${successfulWrites} of ${data.length} rows to database`);
};

// Run the script
async function dishesMigration() {
  // Store all the data in memory to write later
  const data = await readAllDataFromTable({
    region: "us-west-2",
    table: "DishesTable-dev",
  });

  // Write the saved data to the new table
  await writeDataToTable({
    region: "us-west-2",
    table: "RecipesTable-dev",
    data,
  });
}

export const handler = dishesMigration;
