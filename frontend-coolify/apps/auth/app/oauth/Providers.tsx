"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { asset } from "@repo/assets";
import { AppButton, SVGWrapper } from "@repo/shared-ui";
import { useOAuth } from "./useOauth";
import { blue } from "@mui/material/colors";

interface OAuthProvidersProps {
  purpose?: "REGISTRATION" | "LOGIN";
  autoPromptGoogle?: boolean;
  isAppAuthLoading?: boolean;
}

interface ProviderConfig {
  key: string;
  onClick: () => void;
  icon: string;
  iconColor?: string;
  size?: number;
}

/**
 * Renders third-party OAuth provider sign-in buttons with icon assets using a mapped list.
 */
export const OAuthProviders: React.FC<OAuthProvidersProps> = ({
  purpose = "REGISTRATION",
  autoPromptGoogle = true,
  isAppAuthLoading = false,
}) => {
  const theme = useTheme();

  const {
    handleGoogleSignIn,
    handleAppleSignIn,
    handleFacebookSignIn,
    handleGitHubSignIn,
    handleLinkedInSignIn,
    handleXSignIn,
    isOAuthLoading,
  } = useOAuth({
    purpose,
    autoPromptGoogle,
  });

  const btnStyle = {
    gap: theme.gap(4),
    width: "100%",
    minWidth: "fit-content",
    borderRadius: theme.radius[12],
  };

  const providerConfigs: ProviderConfig[] = [
    {
      key: "google",
      onClick: handleGoogleSignIn,
      icon: asset.googleLogo,
    },
    {
      key: "facebook",
      onClick: handleFacebookSignIn,
      icon: asset.facebookLogo,
      iconColor: blue[500],
    },
    {
      key: "x",
      onClick: handleXSignIn,
      icon: asset.xLogo,
      iconColor: theme.palette.gray[300],
      size: 16,
    },
    {
      key: "linkedin",
      onClick: handleLinkedInSignIn,
      icon: asset.linkedinLogo,
    },
    {
      key: "github",
      onClick: handleGitHubSignIn,
      icon: asset.githubLogo,
      iconColor: theme.palette.gray[300],
    },
    {
      key: "apple",
      onClick: handleAppleSignIn,
      icon: asset.appleLogo,
      iconColor: theme.palette.gray[300],
    },
  ];

  return (
    <Stack
      sx={{
        width: "100%",
        flexDirection: "row",
        gap: theme.gap(4),
        overflow: "auto",
        scrollbarWidth: "none",
        flex: "none",
      }}
    >
      {providerConfigs.map((provider) => (
        <AppButton
          key={provider.key}
          variant="outlined"
          onClick={provider.onClick}
          style={btnStyle}
          options={{ disabled: isOAuthLoading || isAppAuthLoading }}
        >
          <SVGWrapper
            src={provider.icon}
            size={provider.size || 20}
            fallbackUIType="SKELETON"
            color={provider.iconColor}
          />
        </AppButton>
      ))}
    </Stack>
  );
};
