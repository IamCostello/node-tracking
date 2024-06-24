import { Collection } from "mongodb";

export const uniqueUsersWithObjectInViewMetric = async (
  dataCollection: Collection
) => {
  try {
    return dataCollection.countDocuments({
      "actions.type": "objectInView",
    });
  } catch (error) {
    return null;
  }
};
