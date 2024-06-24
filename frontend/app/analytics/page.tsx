const getAnalytics = async () => {
  const res = await fetch(process.env.ANALYTICS_SERVICE_URL as string, {
    next: { revalidate: 60 },
  });

  if (res.status !== 200) {
    return null;
  }

  return res.json();
};

const Page = async () => {
  const analytics = await getAnalytics();

  if (!analytics) {
    return (
      <div className="container mx-auto p-4 text-center">
        Failed to fetch analytics
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Analytics</h1>
      <div className="bg-white shadow-md rounded-md p-6">
        <div className="mb-4">
          <div className="text-lg font-bold">Unique Users:</div>
          <div className="text-xl">{analytics.uniqueUsers}</div>
        </div>
        <div>
          <div className="text-lg font-bold">
            Unique Users with Object in View:
          </div>
          <div className="text-xl">{analytics.uniqueUsersWithObjectInView}</div>
        </div>
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";
export default Page;
