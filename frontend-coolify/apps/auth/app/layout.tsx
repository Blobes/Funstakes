import React from "react";
import { RootUIContainer } from "@repo/shared-ui";
import { Metadata, Viewport } from "next";
import { BaseLayout, GlobalUIManager } from "@repo/features";
import { baseMetadata, sharedViewport } from "@repo/helpers";

export const viewport: Viewport = {
  ...sharedViewport,
};
export const metadata: Metadata = {
  ...baseMetadata,
  title: "Authentication | Funstakes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <GlobalUIManager>
        <RootUIContainer shouldScroll>{children}</RootUIContainer>
      </GlobalUIManager>
    </BaseLayout>
  );
}
