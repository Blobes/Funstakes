"use client";

import React, { useState, useTransition, useRef } from "react";
// import parse from "html-react-parser";
import { MenuItem, ListItemText } from "@mui/material";
import { LANGUAGES, MenuRef } from "@repo/core";
import { MenuPopup } from "./Menu";
import { AppButton } from "./Buttons";
import { getBrowserLanguage } from "@repo/helpers";
import { useTheme } from "@mui/material/styles";

/**
 * Reusable dropdown language selection trigger utilizing the workspace unified MenuPopup.
 */
export const LanguageSelector: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<MenuRef>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useTheme();

  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_lang") || "en";
    }
    return "en";
  });

  const selectedLangObj = LANGUAGES.find((l) => l.iso === currentLang);

  const SharedItemStyle = {
    ...theme.typography.text5,
    borderRadius: theme.radius.full,
    minHeight: "unset",
    padding: theme.boxSpacing(4, 6),
  };

  /**
   * Dispatches unified localized runtime events over global custom layout contexts.
   */
  const handleLangSelect = (nextLang: string) => {
    startTransition(() => {
      localStorage.setItem("app_lang", nextLang);
      setCurrentLang(nextLang);
      window.dispatchEvent(
        new CustomEvent("GLOBAL_LANG_CHANGED", { detail: nextLang }),
      );
      menuRef.current?.closeMenu();
      setIsMenuOpen(false);
    });
  };

  /**
   * Resets language state to match native browser system localization properties.
   */
  const handleResetToDefault = () => {
    startTransition(() => {
      const systemLang = getBrowserLanguage();
      localStorage.setItem("app_lang", systemLang);
      setCurrentLang(systemLang);
      window.dispatchEvent(
        new CustomEvent("GLOBAL_LANG_CHANGED", { detail: systemLang }),
      );
      menuRef.current?.closeMenu();
      setIsMenuOpen(false);
    });
  };

  /**
   * Triggers the ref-based MenuPopup anchoring routine.
   */
  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    menuRef.current?.openMenu(event.currentTarget);
    setIsMenuOpen(true);
  };

  return (
    <>
      <AppButton
        variant="text"
        size="small"
        onClick={handleButtonClick}
        options={{
          disabled: isPending,
          "aria-expanded": isMenuOpen,
          "aria-haspopup": "menu",
          "aria-controls": "navigation-dropdown-tray",
        }}
        style={{
          ...theme.typography.text6Caps,
          color: theme.palette.gray[200],
        }}
      >
        {selectedLangObj
          ? `${selectedLangObj.flag} ${selectedLangObj.iso}`
          : currentLang}
      </AppButton>

      <MenuPopup
        ref={menuRef}
        heightThreshold={40}
        marginThreshold={54}
        style={{ ul: { gap: theme.gap(4) } }}
      >
        {/* System Default Reset Trigger */}
        <MenuItem onClick={handleResetToDefault} sx={SharedItemStyle}>
          🌐 &nbsp; System
        </MenuItem>
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.iso}
            selected={lang.iso === currentLang}
            onClick={() => handleLangSelect(lang.iso)}
            sx={SharedItemStyle}
          >
            {lang.flag} &nbsp; {lang.title}
          </MenuItem>
        ))}
      </MenuPopup>
    </>
  );
};
