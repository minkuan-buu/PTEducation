import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
export default function ComingSoon() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block items-center justify-center">
          <h1 className={title()}>Sắp ra mắt</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
