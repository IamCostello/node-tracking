import Link from "next/link";
import { WithTrackingBehavior } from "./WithTrackingBehavior";
import { trackInView, trackPageVisit } from "./trackingBehavior";
import { TrackingSessionProvider } from "./trackingSessionProvider";

const getFakeUser = async () => {
  const res = await fetch("https://random-data-api.com/api/v2/users", {
    next: { revalidate: 60 },
  });

  return res.json();
};

const Page = async () => {
  const data = await getFakeUser();

  return (
    <TrackingSessionProvider userId={data.uid}>
      <WithTrackingBehavior actionType="pageVisit" behavior={trackPageVisit}>
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between border-b-2 border-slate-200 p-2 my-2 ">
            User {data.uid}
            <Link href="/analytics">Analytics</Link>
          </div>
          <div className="prose lg:prose-xl mx-auto text-justify px-2">
            {[...Array(10)].map((_, i) => (
              <DummyText key={i} />
            ))}
          </div>
          <WithTrackingBehavior
            actionType="objectInView"
            behavior={trackInView}
          >
            <div className="w-full bg-slate-100 rounded-lg shadow-inner">
              <img alt="avatar" src={data.avatar} className="my-8 mx-auto" />
            </div>
          </WithTrackingBehavior>
          <div className="prose lg:prose-xl mx-auto">
            {[...Array(10)].map((_, i) => (
              <DummyText key={i} />
            ))}
          </div>
        </main>
      </WithTrackingBehavior>
    </TrackingSessionProvider>
  );
};

export const dynamic = "force-dynamic";
export default Page;

const DummyText = () => {
  return (
    <div>
      Lorem Ipsum is simply dummy text of the printing and typesetting industry.
      Lorem Ipsum has been the industry's standard dummy text ever since the
      1500s, when an unknown printer took a galley of type and scrambled it to
      make a type specimen book. It has survived not only five centuries, but
      also the leap into electronic typesetting, remaining essentially
      unchanged. It was popularised in the 1960s with the release of Letraset
      sheets containing Lorem Ipsum passages, and more recently with desktop
      publishing software like Aldus PageMaker including versions of Lorem
      Ipsum. It is a long established fact that a reader will be distracted by
      the readable content of a page when looking at its layout. The point of
      using Lorem Ipsum is that it has a more-or-less normal distribution of
      letters, as opposed to using 'Content here, content here', making it look
      like readable English. Many desktop publishing packages and web page
      editors now use Lorem Ipsum as their default model text, and a search for
      'lorem ipsum' will uncover many web sites still in their infancy. Various
      versions have evolved over the years, sometimes by accident, sometimes on
      purpose (injected humour and the like). Contrary to popular belief, Lorem
      Ipsum is not simply random text. It has roots in a piece of classical
      Latin literature from 45 BC, making it over 2000 years old. Richard
      McClintock, a Latin professor at Hampden-Sydney College in Virginia,
      looked up one of the more obscure Latin words, consectetur, from a Lorem
      Ipsum passage, and going through the cites of the word in classical
      literature, discovered the undoubtable source. Lorem Ipsum comes from
      sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The
      Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a
      treatise on the theory of ethics, very popular during the Renaissance. The
      first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a
      line in section 1.10.32.
    </div>
  );
};
