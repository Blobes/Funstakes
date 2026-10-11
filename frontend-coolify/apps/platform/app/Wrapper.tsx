"use client";

import React, { useRef } from "react";
import { RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./navbars/Header";
import { useStaticTranslation } from "@repo/shared-hooks";
import { LISTS } from "@repo/core";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { translateTxtString } = useStaticTranslation();
  const { FOOTER_NAV_LIST } = LISTS(translateTxtString);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <RootUIContainer shouldScroll={true} scrollRef={scrollRef}>
      <Header scrollRef={scrollRef} />
      {children}
      <Footer navList={FOOTER_NAV_LIST} />
    </RootUIContainer>
  );
};
