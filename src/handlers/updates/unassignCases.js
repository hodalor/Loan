import { dataBaseUrl } from "../../libs/endpoints";

const unassignCases = async (path, IDs = []) => {
  try {
    const request = await fetch(`${dataBaseUrl}${path}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ IDs }),
    });

    return await request.json();
  } catch (error) {
    return {
      success: 0,
      message: "Could not unassign selected cases.",
    };
  }
};

export const _unassignAuditCases = (IDs) => unassignCases("unassignAuditCases", IDs);
export const _unassignPreColCases = (IDs) => unassignCases("unassignPreColCases", IDs);
export const _unassignColCases = (IDs) => unassignCases("unassignColCases", IDs);
