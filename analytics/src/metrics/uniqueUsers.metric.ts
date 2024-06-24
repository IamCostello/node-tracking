import { Collection } from "mongodb";

export const uniqueUsersMetric = async (dataCollection: Collection) => {
  try {
    return dataCollection.countDocuments();
  } catch (error) {
    return null;
  }
};
