"use client";

import { apiClient } from "@repo/helpers";
import { ISinglePayload, ITrustedDevice, SERVER_API } from "@repo/core";

interface SetPDeviceReq {
  sessionId: string;
}
interface SetPDeviceRes extends ISinglePayload<SetPDeviceReq> {
  device: ITrustedDevice;
}

export const SettingsService = () => {
  const setPrimaryDevice = async (
    userId: string,
    targetSession: SetPDeviceReq,
  ): Promise<SetPDeviceRes> => {
    return await apiClient<SetPDeviceRes>(SERVER_API.setPrimaryDevice(userId), {
      method: "PATCH",
      body: JSON.stringify(targetSession),
    });
  };

  return { setPrimaryDevice };
};
