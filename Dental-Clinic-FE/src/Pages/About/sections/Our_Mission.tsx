import adaLogo from "../../../assets/about_images/logo1.png";
import icoLogo from "../../../assets/about_images/logo2.png";

export default function OurMission() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl">
        
        <div className="rounded-3xl bg-gradient-to-b from-[#f7f7f7] via-[#e6eaf2] to-[#d8ecff] px-6 py-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-black">
            Our Mission
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg md:text-xl text-slate-800">
            Dedicated to providing high-quality dental care in a comfortable and
            friendly environment.
          </p>

    
          <div className="mx-auto mt-8 w-full rounded-3xl bg-white/95 p-6 shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-y-0 md:divide-x">
              <Stat big="20+" small="YEARS EXPERIENCE" />
              <Stat big="5k+" small="HAPPY PATIENTS" />
              <Stat big="40+" small="DENTAL PROFESSIONALS" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white/95 p-6 text-left shadow-sm ring-1 ring-slate-200">
              <h3 className="text-2xl text-center font-semibold text-black">
                Our History
              </h3>
              <div className="mt-4 grid w-fit mx-auto grid-cols-[88px_1fr] gap-x-6">
               
                <div className="text-lg font-semibold text-slate-900">2004</div>
                <div className="relative pb-3 text-slate-800">
                  <span
                    className="absolute -left-6 top-1 h-4 w-px bg-slate-300 md:left-[-24px]"
                    aria-hidden
                  />
                  <div className="text-base">Founded in Viet Nam</div>
                </div>
                
                <div className="text-lg font-semibold text-slate-900">2010</div>
                <div className="relative pb-3 text-slate-800">
                  <span
                    className="absolute -left-6 top-1 h-4 w-px bg-slate-300 md:left-[-24px]"
                    aria-hidden
                  />
                  <div className="text-base">Office Expanded</div>
                </div>
                
                <div className="text-lg font-semibold text-slate-900">2018</div>
                <div className="relative text-slate-800">
                  <span
                    className="absolute -left-6 top-1 h-4 w-px bg-slate-300 md:left-[-24px]"
                    aria-hidden
                  />
                  <div className="text-base">Clinic Renovated</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white/95 p-6 text-left shadow-sm ring-1 ring-slate-200">
              <h3 className="text-2xl font-semibold text-black text-center">
                Accreditations
              </h3>
              <div className="mt-5 flex items-center justify-center gap-6 md:gap-8">
                <div className="flex h-24 w-36 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-2">
                  <img src={adaLogo} alt="ADA" className="max-h-20 w-auto" />
                </div>
                <div className="flex h-24 w-36 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-2">
                  <img src={icoLogo} alt="ICOI" className="max-h-20 w-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-4">
      <div className="text-3xl md:text-4xl font-extrabold text-black">
        {big}
      </div>
      <div className="text-[12px] tracking-[0.12em] text-slate-700">
        {small}
      </div>
    </div>
  );
}
