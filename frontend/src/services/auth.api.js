import { IF_ERROR_PERSISTS } from "@/utils/constants";
import api from "./api";

export const loginAPI = async ({ email, password }) => {
    try {
        const response = await api.post("https://waterreportcard.com/api/auth/login", {
            email,
            password,
        });

        return {
            data: response.data,
        };
    } catch (error) {
        return {
            error: error.response ? error.response.data : IF_ERROR_PERSISTS,
        };
    }
};

export const logoutAPI = async () => {
    try {
        const response = await api.post("/auth/logout");

        return response;
    } catch (error) {
        return {
        error: error.response ? error.response.data.message : "An error occurred",
        };
    }
};