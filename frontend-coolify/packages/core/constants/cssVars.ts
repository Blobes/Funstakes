/**
 * Central design tokens used across component style overrides.
 */
export const CSS_VARS = {
  //Primary
  color_primary_main: "var(--mui-palette-primary-main)",
  color_primary_dark: "var(--mui-palette-primary-dark)",
  color_primary_light: "var(--mui-palette-primary-dark)",
  color_fixed_primary_trans: "var(--mui-fixedColors-pTrans)",
  // Grayscale
  color_gray0: "var(--mui-palette-gray-0)",
  color_gray50: "var(--mui-palette-gray-50)",
  color_gray100: "var(--mui-palette-gray-100)",
  color_gray200: "var(--mui-palette-gray-200)",
  color_gray300: "var(--mui-palette-gray-300)",
  color_gray_trans_1: "var(--mui-palette-gray-trans-1)",
  color_gray_trans_2: "var(--mui-palette-gray-trans-2)",
  color_gray_trans_overlay: "var(--mui-palette-gray-trans-overlay)",
  color_gray_trans_overlay_adaptive:
    "var(--mui-palette-gray-trans-overlay-adaptive)",
  color_gray_trans_overlay_default:
    "var(--mui-palette-gray-trans-overlay-default)",
  color_fixed_gray50: "var(--mui-fixedColors-gray50)",
  color_fixed_gray800: "var(--mui-fixedColors-gray800)",
  // Success
  color_success_light: "var(--mui-palette-success-light)",
  color_success_main: "var(--mui-palette-success-main)",
  color_success_dark: "var(--mui-palette-success-dark)",
  color_success_trans_1: "var(--mui-palette-success-trans-1)",
  color_success_trans_2: "var(--mui-palette-success-trans-2)",
  // Info
  color_info_main: "var(--mui-palette-info-main)",
  color_info_light: "var(--mui-palette-info-light)",
  color_info_dark: "var(--mui-palette-info-dark)",
  // Error
  color_error_main: "var(--mui-palette-error-main)",
  color_error_light: "var(--mui-palette-error-light)",
  color_error_dark: "var(--mui-palette-error-dark)",
  color_error_trans_1: "var(--mui-palette-error-trans-1)",
  color_error_trans_2: "var(--mui-palette-error-trans-2)",
  // Typography
  text_fontsize: "calc(1rem * var(--ui-font-scale, 1))",
  text_align: "var(--ui-text-align, inherit)" as any,
  text_helper_fontsize: "calc(0.875rem * var(--ui-font-scale, 1))",
} as const;
