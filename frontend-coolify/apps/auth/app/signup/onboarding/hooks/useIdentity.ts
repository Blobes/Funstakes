import { useMutation } from "@tanstack/react-query";
import {
  useDebounce,
  useInputValidationMsg,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useCallback, useEffect, useState } from "react";
import { OnboardingService } from "../../service";
import { LoginService } from "../../../login/service";
import { ApiError, COMMON_FEEDBACK, useGlobalStore } from "@repo/core";

/**
 * Manages Identity logic using the updated bulk validator.
 */
export const useIdentity = (onSuccess?: () => void) => {
  const { checkUsername } = LoginService();
  const { validateInputs, validateUsername } = useInputValidationMsg();
  const { syncIdentity, updateProgress } = OnboardingService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const { translateTxtString } = useStaticTranslation();

  const [formData, setFormData] = useState({ displayName: "", username: "" });

  const [usernameStatus, setUsernameStatus] = useState<{
    status: "IDLE" | "CHECKING" | "TAKEN" | "AVAILABLE";
    suggestions?: string[];
  }>({ status: "IDLE" });

  const debouncedUsername = useDebounce(formData.username, 500);

  useEffect(() => {
    const checkAvailability = async () => {
      // Local format check before API call
      const isInvalid = validateUsername(debouncedUsername);
      if (isInvalid) return;

      setUsernameStatus({ status: "CHECKING" });

      const res = await checkUsername({
        identifier: debouncedUsername,
        purpose: "REGISTRATION",
      });

      if (res.isExisting) {
        setUsernameStatus({ status: "TAKEN", suggestions: res.suggestions });
      } else {
        setUsernameStatus({ status: "AVAILABLE" });
      }
    };

    if (debouncedUsername) checkAvailability();
  }, [debouncedUsername, checkUsername]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Reset availability status when handle changes
      if (name === "username") setUsernameStatus({ status: "IDLE" });
    },
    [],
  );

  // Perform bulk check on all local identity fields
  const isLocalValid = !validateInputs([
    { value: formData.displayName, type: "NAME" },
    { value: formData.username, type: "USERNAME" },
  ]);

  const isFormValid =
    isLocalValid &&
    (usernameStatus.status === "AVAILABLE" || usernameStatus.status === "IDLE");

  const { mutate: submitIdentity, isPending } = useMutation({
    mutationFn: async () => {
      // Persist identity data to DB
      await syncIdentity(formData);
      // Advance user state to demographics step in
      return await updateProgress("DEMOGRAPHICS", false);
    },
    onSuccess: () => {
      setInlineMsg(null);
      if (onSuccess) onSuccess();
    },
    onError: (error: ApiError) => {
      setInlineMsg(
        error.localizedErrMsg || translateTxtString(COMMON_FEEDBACK.sync_error),
      );
      setUsernameStatus({ status: "IDLE" });
    },
  });

  return {
    formData,
    handleChange,
    submitIdentity,
    isPending,
    isFormValid,
    usernameStatus,
    setFormData,
  };
};
