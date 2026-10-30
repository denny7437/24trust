import type { Metadata } from 'next';
import { FormPanel } from '@/components/FormPanel';
import { Footer } from '@/components/Footer';
import { MobileHeader } from '@/components/MobileHeader';
import { Rail } from '@/components/Rail';
import { About } from '@/components/sections/About';
import { Audience } from '@/components/sections/Audience';
import { Delivery } from '@/components/sections/Delivery';
import { Faq } from '@/components/sections/Faq';
import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Pilot } from '@/components/sections/Pilot';
import { Problem } from '@/components/sections/Problem';
import { Security } from '@/components/sections/Security';
import { Solution } from '@/components/sections/Solution';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * Сколько блоков стоит в <main> кроме формы. С 1280 px форма занимает правую колонку
 * на всю их высоту (grid-row: 1 / span N). Добавили или убрали блок — поправьте число.
 */
const BLOCKS_IN_MAIN = 10;

export default function HomePage() {
  return (
    <>
      <MobileHeader />
      <div className="page">
        <Rail />
        <main id="main" className="main" tabIndex={-1}>
          <Hero />
          <Problem />
          <Solution />
          <HowItWorks />
          <Delivery />
          <Security />
          <Audience />
          <Pilot />
          {/* На узком экране форма идёт сразу после «Пилота», на широком — закреплена справа */}
          <FormPanel style={{ gridRow: `1 / span ${BLOCKS_IN_MAIN}` }} />
          <About />
          <Faq />
        </main>
      </div>
      <Footer />
    </>
  );
}
