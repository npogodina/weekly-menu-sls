async function createDish(event, context) {
  const { name } = JSON.parse(event.body);
  const now = new Date();

  const dish = {
    name,
    breakfast: "yes",
    createdAt: now.toISOString(),
  };

  return {
    statusCode: 201,
    body: JSON.stringify(dish),
  };
}

export const handler = createDish;
