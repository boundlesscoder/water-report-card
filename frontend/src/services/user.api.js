import api from "./api";
import { IF_ERROR_PERSISTS } from "@/utils/constants";

export const createUserAPI = async (payload) => {
    try {
        const response = await api.post("https://waterreportcard.com/api/auth/register", payload);

        return {
            data: response.data,
        };
    } catch (error) {
        console.error('Signup API error:', error.response?.data || error);
        return {
            error: error.response?.data?.error || error.response?.data?.message || IF_ERROR_PERSISTS,
        };
    }
};

// use JWT in header Bearer token format for authentication. route is: GET /User
export const getUserInfoAPI = async () => {
    try {
        const response = await api.get("/User");

        return {
            data: response.data,
        };
    } catch (error) {
        return {
            error: error.response ? error.response.data : IF_ERROR_PERSISTS,
        };
    }
};