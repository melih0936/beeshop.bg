"use client";

import { useState } from "react";

type LegalModal = "terms" | "privacy" | null;

export default function SiteFooter() {
  const [openModal, setOpenModal] = useState<LegalModal>(null);

  const title =
    openModal === "terms" ? "Условия за ползване" : "Политика за поверителност";

  return (
    <>
      <footer className="border-t border-amber-200/60 bg-white/85 px-4 py-4 text-center text-xs leading-5 text-slate-600 backdrop-blur">
        <p>
          © 2026 BeeShop.bg. Всички права запазени.{" "}
          <a className="font-bold text-amber-700 hover:underline" href="mailto:contact@beeshop.bg">
            contact@beeshop.bg
          </a>
        </p>

        <nav className="mt-1 flex flex-wrap justify-center gap-3 font-bold">
          <button
            type="button"
            onClick={() => setOpenModal("terms")}
            className="hover:text-amber-700"
          >
            Условия за ползване
          </button>

          <button
            type="button"
            onClick={() => setOpenModal("privacy")}
            className="hover:text-amber-700"
          >
            Поверителност
          </button>

          <a href="mailto:contact@beeshop.bg" className="hover:text-amber-700">
            Контакти
          </a>
        </nav>
      </footer>

      {openModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">{title}</h2>
                <p className="text-sm font-semibold text-slate-500">BeeShop.bg – Пчеларски обяви за България</p>
              </div>

              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-amber-100"
              >
                Затвори
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-5 py-5 text-left text-sm leading-7 text-slate-700">
              {openModal === "terms" ? <TermsText /> : <PrivacyText />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TermsText() {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-lg font-black text-slate-950">1. Общи условия</h3>
        <p>
          BeeShop.bg е онлайн платформа за публикуване на пчеларски обяви в България:
          мед, пчелни семейства, пчелни майки, кошери, инвентар, восък, услуги и изкупуване.
          С използването на сайта потребителят приема тези условия.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">2. Роля на платформата</h3>
        <p>
          BeeShop.bg предоставя място за публикуване и намиране на обяви. Платформата не е страна
          по сделките между купувачи и продавачи, освен ако изрично не е посочено друго. Условията
          за доставка, плащане, връщане, гаранция и качество се договарят директно между купувача
          и продавача.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">3. Отговорност на продавачите</h3>
        <p>
          Продавачът отговаря за верността на публикуваната информация, снимките, цената,
          произхода и състоянието на продукта. Забранено е публикуването на подвеждащи,
          фалшиви, незаконни, опасни или чужди обяви.
        </p>
        <p>
          При продажба на храни и пчелни продукти продавачът следва да спазва приложимите
          изисквания на българското и европейското законодателство, включително регистрация,
          етикетиране, безопасност и проследимост, когато такива се изискват.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">4. Права на купувачите</h3>
        <p>
          Купувачът трябва внимателно да провери продавача, описанието, снимките, цената,
          условията за доставка и начина на плащане преди сделка. Препоръчително е комуникацията
          да се води писмено и да се пазят доказателства за уговорките.
        </p>
        <p>
          Ако продавачът е търговец, купувачът може да има права като потребител при покупка
          от разстояние, включително право на отказ в законов срок, когато законът го позволява.
          Ако продавачът е частно лице, тези потребителски права може да не се прилагат по същия начин.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">5. Забранено съдържание</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Фалшиви или подвеждащи обяви.</li>
          <li>Обяви със снимки, които не принадлежат на продавача.</li>
          <li>Продукти без нужната регистрация или документи, когато такива са задължителни.</li>
          <li>Спам, измами, агресивни съобщения и обиди.</li>
          <li>Съдържание, което нарушава закона или правата на други лица.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">6. Модерация и премахване на обяви</h3>
        <p>
          BeeShop.bg може да проверява, скрива, редактира или премахва обяви, когато има съмнение
          за нарушение, измама, опасен продукт, подвеждаща информация или сигнал от потребител.
          При нужда акаунт може да бъде ограничен или блокиран.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">7. Плащане, доставка и спорове</h3>
        <p>
          Плащането и доставката се уговарят директно между купувача и продавача. BeeShop.bg не носи
          отговорност за неплатени суми, забавена доставка, повредена стока, отказана сделка или спор
          между страните, освен ако платформата изрично не е поела такава услуга.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">8. Контакт</h3>
        <p>
          За въпроси, сигнали, жалби или искане за премахване на съдържание: contact@beeshop.bg
        </p>
      </section>
    </div>
  );
}

function PrivacyText() {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-lg font-black text-slate-950">1. Какви данни събираме</h3>
        <p>
          BeeShop.bg може да обработва данни като име, имейл, телефон, населено място,
          съдържание на обяви, снимки, съобщения, IP адрес, информация за вход и технически данни
          за сигурност.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">2. Защо ги използваме</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>За създаване и управление на акаунт.</li>
          <li>За публикуване, редактиране и показване на обяви.</li>
          <li>За връзка между купувачи и продавачи.</li>
          <li>За сигурност, модерация и предотвратяване на измами.</li>
          <li>За отговор на запитвания, сигнали и жалби.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">3. Публична информация</h3>
        <p>
          Част от информацията в обявите може да бъде публична: име на продавач, телефон,
          регион, описание, цена и снимки. Не публикувайте лична информация, която не желаете
          да бъде видима за други потребители.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">4. Съхранение и защита</h3>
        <p>
          Данните се съхраняват за времето, необходимо за работата на платформата, сигурността,
          изпълнение на законови задължения и защита при спорове. Прилагаме разумни технически
          мерки за защита, но никоя онлайн система не може да гарантира абсолютна сигурност.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">5. Права на потребителя</h3>
        <p>
          Потребителят може да поиска достъп, корекция, ограничаване, изтриване или информация
          относно обработването на личните му данни, когато това е приложимо по закон.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">6. Бисквитки и външни услуги</h3>
        <p>
          Сайтът може да използва технически бисквитки и външни услуги за вход, хостинг,
          база данни, защита от спам, статистика или функционалност. При добавяне на маркетинг
          бисквитки ще бъде добавена отделна настройка за съгласие.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black text-slate-950">7. Контакт за лични данни</h3>
        <p>
          За въпроси относно лични данни или искане за премахване на информация:
          contact@beeshop.bg
        </p>
      </section>
    </div>
  );
}
